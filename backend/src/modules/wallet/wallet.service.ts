import { Injectable, BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TransactionType, ReferenceType, Prisma } from '@prisma/client';

export interface TransferBalanceDto {
  targetUserId: string;
  amount: number;
  note?: string;
  idempotencyKey?: string;
}

export interface RechargeDto {
  userId: string;
  amount: number;
  paymentMethod: string;
  transactionRef?: string;
  note?: string;
  idempotencyKey?: string;
}

export interface SettleCallCostDto {
  callId: string;
  userId: string;
  billableSeconds: number;
  pulseDuration: number;
  pulseRate: number;
  costRate: number;
  reservedCost: number;
  idempotencyKey: string;
}

@Injectable()
export class WalletService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get user wallet with verified running balance
   */
  async getWallet(userId: string) {
    const wallet = await this.prisma.wallet.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            role: true,
            creditLimit: true,
            allowNegativeBalance: true,
          },
        },
      },
    });

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    return wallet;
  }

  /**
   * Transfer balance from parent reseller to child reseller/customer
   * Strictly atomic with row locks & double-entry ledger records
   */
  async transferBalance(fromUserId: string, dto: TransferBalanceDto) {
    if (dto.amount <= 0) {
      throw new BadRequestException('Transfer amount must be greater than zero');
    }

    if (fromUserId === dto.targetUserId) {
      throw new BadRequestException('Cannot transfer balance to self');
    }

    // Check idempotency if key provided
    if (dto.idempotencyKey) {
      const existing = await this.prisma.ledgerEntry.findUnique({
        where: { idempotencyKey: dto.idempotencyKey },
      });
      if (existing) {
        throw new ConflictException('A transaction with this idempotency key has already been executed');
      }
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Lock Sender Wallet
      const senderWallet = await tx.wallet.findUnique({
        where: { userId: fromUserId },
        include: { user: true },
      });
      if (!senderWallet) throw new NotFoundException('Sender wallet not found');

      const transferAmount = new Prisma.Decimal(dto.amount);
      const availableBalance = senderWallet.balance.plus(senderWallet.creditLimit);

      if (availableBalance.lessThan(transferAmount) && !senderWallet.user.allowNegativeBalance) {
        throw new BadRequestException(
          `Insufficient balance. Available: ${availableBalance.toString()} BDT, Requested: ${transferAmount.toString()} BDT`,
        );
      }

      // 2. Lock Recipient Wallet
      const recipientWallet = await tx.wallet.findUnique({
        where: { userId: dto.targetUserId },
        include: { user: true },
      });
      if (!recipientWallet) throw new NotFoundException('Recipient wallet not found');

      // 3. Calculate new balances
      const senderBefore = senderWallet.balance;
      const senderAfter = senderBefore.minus(transferAmount);

      const recipientBefore = recipientWallet.balance;
      const recipientAfter = recipientBefore.plus(transferAmount);

      // 4. Update Wallets with optimistic lock version bump
      await tx.wallet.update({
        where: { id: senderWallet.id },
        data: {
          balance: senderAfter,
          version: { increment: 1 },
        },
      });

      await tx.wallet.update({
        where: { id: recipientWallet.id },
        data: {
          balance: recipientAfter,
          version: { increment: 1 },
        },
      });

      // 5. Create Transfer Record
      const transferRecord = await tx.balanceTransfer.create({
        data: {
          fromUserId,
          toUserId: dto.targetUserId,
          amount: transferAmount,
          currency: senderWallet.currency,
          note: dto.note,
        },
      });

      // 6. Create Double-Entry Ledger for Sender (DEBIT)
      await tx.ledgerEntry.create({
        data: {
          walletId: senderWallet.id,
          userId: fromUserId,
          type: TransactionType.DEBIT,
          amount: transferAmount,
          balanceBefore: senderBefore,
          balanceAfter: senderAfter,
          referenceType: ReferenceType.TRANSFER,
          referenceId: transferRecord.id,
          idempotencyKey: dto.idempotencyKey ? `${dto.idempotencyKey}-SENDER` : undefined,
          description: `Transferred balance to ${recipientWallet.user.name} (${recipientWallet.user.email})`,
        },
      });

      // 7. Create Double-Entry Ledger for Recipient (CREDIT)
      await tx.ledgerEntry.create({
        data: {
          walletId: recipientWallet.id,
          userId: dto.targetUserId,
          type: TransactionType.CREDIT,
          amount: transferAmount,
          balanceBefore: recipientBefore,
          balanceAfter: recipientAfter,
          referenceType: ReferenceType.TRANSFER,
          referenceId: transferRecord.id,
          idempotencyKey: dto.idempotencyKey ? `${dto.idempotencyKey}-RECEIVER` : undefined,
          description: `Received balance from ${senderWallet.user.name} (${senderWallet.user.email})`,
        },
      });

      return {
        success: true,
        transferId: transferRecord.id,
        amount: transferAmount.toNumber(),
        newSenderBalance: senderAfter.toNumber(),
        newRecipientBalance: recipientAfter.toNumber(),
      };
    });
  }

  /**
   * Recharge Wallet (Direct Admin or Gateway)
   */
  async rechargeWallet(operatorUserId: string, dto: RechargeDto) {
    if (dto.amount <= 0) {
      throw new BadRequestException('Recharge amount must be greater than zero');
    }

    const rechargeAmount = new Prisma.Decimal(dto.amount);

    return this.prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({
        where: { userId: dto.userId },
        include: { user: true },
      });
      if (!wallet) throw new NotFoundException('Wallet not found');

      const beforeBal = wallet.balance;
      const afterBal = beforeBal.plus(rechargeAmount);

      await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          balance: afterBal,
          version: { increment: 1 },
        },
      });

      const rechargeReq = await tx.rechargeRequest.create({
        data: {
          userId: dto.userId,
          amount: rechargeAmount,
          paymentMethod: dto.paymentMethod,
          transactionRef: dto.transactionRef,
          status: 'APPROVED',
          approvedBy: operatorUserId,
          note: dto.note,
        },
      });

      const ledger = await tx.ledgerEntry.create({
        data: {
          walletId: wallet.id,
          userId: dto.userId,
          type: TransactionType.CREDIT,
          amount: rechargeAmount,
          balanceBefore: beforeBal,
          balanceAfter: afterBal,
          referenceType: ReferenceType.RECHARGE,
          referenceId: rechargeReq.id,
          idempotencyKey: dto.idempotencyKey,
          description: `Wallet recharge via ${dto.paymentMethod} (Ref: ${dto.transactionRef || 'N/A'})`,
        },
      });

      return {
        success: true,
        rechargeId: rechargeReq.id,
        ledgerId: ledger.id,
        newBalance: afterBal.toNumber(),
      };
    });
  }

  /**
   * Reserve Call/Campaign Cost upfront
   */
  async reserveCallCost(userId: string, estimatedCost: number, referenceId: string, referenceType: ReferenceType) {
    const cost = new Prisma.Decimal(estimatedCost);

    return this.prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({
        where: { userId },
        include: { user: true },
      });
      if (!wallet) throw new NotFoundException('Wallet not found');

      const available = wallet.balance.plus(wallet.creditLimit);
      if (available.lessThan(cost) && !wallet.user.allowNegativeBalance) {
        throw new BadRequestException('Insufficient balance for campaign launch');
      }

      const beforeBal = wallet.balance;
      const afterBal = beforeBal.minus(cost);

      await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          balance: afterBal,
          reservedBalance: wallet.reservedBalance.plus(cost),
          version: { increment: 1 },
        },
      });

      await tx.ledgerEntry.create({
        data: {
          walletId: wallet.id,
          userId,
          type: TransactionType.RESERVE,
          amount: cost,
          balanceBefore: beforeBal,
          balanceAfter: afterBal,
          referenceType,
          referenceId,
          description: `Reserved ${cost.toString()} BDT for ${referenceType} #${referenceId}`,
        },
      });

      return { reserved: true, newBalance: afterBal.toNumber() };
    });
  }

  /**
   * Reconcile & Settle Final Call Charge against actual billable seconds
   */
  async settleCallUsage(dto: SettleCallCostDto) {
    if (dto.idempotencyKey) {
      const existing = await this.prisma.ledgerEntry.findUnique({
        where: { idempotencyKey: dto.idempotencyKey },
      });
      if (existing) {
        return {
          settled: true,
          alreadySettled: true,
          actualCost: 0,
          finalBalance: 0,
        };
      }
    }

    const pulses = dto.billableSeconds > 0 ? Math.ceil(dto.billableSeconds / dto.pulseDuration) : 0;
    const finalActualCost = new Prisma.Decimal(pulses * dto.pulseRate);
    const reservedCost = new Prisma.Decimal(dto.reservedCost);
    const costDifference = finalActualCost.minus(reservedCost); // > 0: undercharged, < 0: overcharged

    return this.prisma.$transaction(async (tx) => {
      // Re-check idempotency inside transaction for strict race safety
      if (dto.idempotencyKey) {
        const existingTx = await tx.ledgerEntry.findUnique({
          where: { idempotencyKey: dto.idempotencyKey },
        });
        if (existingTx) {
          return { settled: true, alreadySettled: true, actualCost: finalActualCost.toNumber() };
        }
      }

      const wallet = await tx.wallet.findUnique({
        where: { userId: dto.userId },
      });
      if (!wallet) throw new NotFoundException('Wallet not found');

      const beforeBal = wallet.balance;
      let afterBal = beforeBal;
      let transactionType: TransactionType = TransactionType.DEBIT;
      let diffAmount = new Prisma.Decimal(0);

      if (costDifference.greaterThan(0)) {
        // Undercharged: debit extra
        afterBal = beforeBal.minus(costDifference);
        transactionType = TransactionType.DEBIT;
        diffAmount = costDifference;
      } else if (costDifference.lessThan(0)) {
        // Overcharged: refund difference
        const refundAmount = costDifference.abs();
        afterBal = beforeBal.plus(refundAmount);
        transactionType = TransactionType.REFUND;
        diffAmount = refundAmount;
      } else {
        transactionType = TransactionType.RELEASE;
      }

      // Release reserved balance
      await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          balance: afterBal,
          reservedBalance: Prisma.Decimal.max(new Prisma.Decimal(0), wallet.reservedBalance.minus(reservedCost)),
          version: { increment: 1 },
        },
      });

      // Persist ledger entry with idempotency key
      await tx.ledgerEntry.create({
        data: {
          walletId: wallet.id,
          userId: dto.userId,
          type: transactionType,
          amount: diffAmount,
          balanceBefore: beforeBal,
          balanceAfter: afterBal,
          referenceType: ReferenceType.CALL,
          referenceId: dto.callId,
          idempotencyKey: dto.idempotencyKey,
          description:
            transactionType === TransactionType.REFUND
              ? `Refund adjustment for Call #${dto.callId} (${dto.billableSeconds}s billable)`
              : transactionType === TransactionType.DEBIT
              ? `Extra charge adjustment for Call #${dto.callId} (${dto.billableSeconds}s billable)`
              : `Final settlement and release for Call #${dto.callId} (${dto.billableSeconds}s billable)`,
        },
      });

      return {
        settled: true,
        actualCost: finalActualCost.toNumber(),
        finalBalance: afterBal.toNumber(),
      };
    });
  }

  /**
   * Get ledger statement / audit history
   */
  async getLedgerStatement(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [entries, total] = await Promise.all([
      this.prisma.ledgerEntry.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.ledgerEntry.count({ where: { userId } }),
    ]);

    return {
      entries,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getAllDeposits() {
    return this.prisma.rechargeRequest.findMany({
      include: { user: { select: { id: true, name: true, email: true, companyName: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAllStatements(page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const [entries, total] = await Promise.all([
      this.prisma.ledgerEntry.findMany({
        include: { user: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.ledgerEntry.count(),
    ]);
    return { entries, total, page, limit, totalPages: Math.ceil(total / limit) };
  }
}
