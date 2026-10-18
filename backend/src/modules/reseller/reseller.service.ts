import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Role, AccountStatus, Prisma, TransactionType, ReferenceType } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as path from 'path';
import * as fs from 'fs';

export interface CreateResellerDto {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: Role;
  companyName?: string;
  creditLimit?: number;
  allowNegativeBalance?: boolean;
  pricingPlanId?: string;
}

@Injectable()
export class ResellerService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get all customers/users with full details, documents, and calling settings
   */
  async getAllCustomers() {
    const users = await this.prisma.user.findMany({
      include: {
        wallet: true,
        callers: {
          select: { id: true, callerName: true, callerNumber: true, isOnline: true },
        },
        pricingPlan: {
          select: { id: true, name: true },
        },
        _count: {
          select: {
            calls: true,
            campaigns: true,
            audioAssets: true,
            contactGroups: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return users.map((u) => ({
      id: u.id,
      legacyId: u.legacyId,
      name: u.name,
      email: u.email,
      phone: u.phone,
      company: u.companyName || 'Individual',
      role: u.role,
      status: u.status,
      frontNid: u.frontNid,
      backNid: u.backNid,
      audioType: u.audioType || 'both',
      autoApproveAudio: u.autoApproveAudio || false,
      autoApproveCampaigns: u.autoApproveCampaigns || false,
      pulseRate: parseFloat(u.pulseRate?.toString() || '0.5'),
      pulseDuration: u.pulseDuration || 10,
      callers: u.callers.map((c) => ({
        id: c.id,
        name: c.callerName,
        number: c.callerNumber,
        isOnline: c.isOnline,
      })),
      pricingPlan: u.pricingPlan ? { id: u.pricingPlan.id, name: u.pricingPlan.name } : null,
      balance: parseFloat(u.wallet?.balance?.toString() || '0'),
      callsCount: u._count.calls,
      campaignsCount: u._count.campaigns,
      audioCount: u._count.audioAssets,
      groupsCount: u._count.contactGroups,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
    }));
  }

  /**
   * Get reseller hierarchy tree rooted at current user
   */
  async getHierarchyTree(currentUserId: string, currentUserRole: string, currentUserPath: string) {
    // If Super Admin, fetch all; else fetch where path starts with currentUserPath
    const users = await this.prisma.user.findMany({
      where: currentUserRole === Role.SUPER_ADMIN ? {} : { path: { startsWith: currentUserPath } },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        companyName: true,
        role: true,
        status: true,
        parentId: true,
        path: true,
        depth: true,
        creditLimit: true,
        allowNegativeBalance: true,
        wallet: {
          select: {
            balance: true,
            reservedBalance: true,
            currency: true,
          },
        },
        pricingPlan: {
          select: {
            id: true,
            name: true,
          },
        },
        createdAt: true,
      },
      orderBy: { depth: 'asc' },
    });

    return users;
  }

  /**
   * Create a new child reseller or customer under parent
   */
  async createChild(parentId: string, dto: CreateResellerDto) {
    const parent = await this.prisma.user.findUnique({
      where: { id: parentId },
      include: { wallet: true },
    });

    if (!parent) {
      throw new NotFoundException('Parent user not found');
    }

    // Role hierarchy validation:
    // SUPER_ADMIN -> SERVICE_PROVIDER
    // SERVICE_PROVIDER -> MASTER_RESELLER
    // MASTER_RESELLER -> SUB_RESELLER
    // SUB_RESELLER / MASTER_RESELLER -> CUSTOMER
    this.validateChildRole(parent.role, dto.role);

    // Check unique email and phone
    const existing = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: dto.email }, { phone: dto.phone }],
      },
    });

    if (existing) {
      throw new BadRequestException('A user with this email or phone number already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const newPath = `${parent.path}/${Date.now()}`;
    const newDepth = parent.depth + 1;

    return this.prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          name: dto.name,
          email: dto.email,
          phone: dto.phone,
          passwordHash,
          role: dto.role,
          companyName: dto.companyName,
          status: AccountStatus.ACTIVE,
          parentId: parent.id,
          path: newPath,
          depth: newDepth,
          creditLimit: dto.creditLimit ?? 0,
          allowNegativeBalance: dto.allowNegativeBalance ?? false,
          pricingPlanId: dto.pricingPlanId,
          wallet: {
            create: {
              currency: 'BDT',
              balance: 0,
              creditLimit: dto.creditLimit ?? 0,
            },
          },
        },
        include: {
          wallet: true,
          pricingPlan: true,
        },
      });

      return created;
    });
  }

  /**
   * Update reseller status (ACTIVE, SUSPENDED, PENDING)
   */
  async updateStatus(targetUserId: string, status: AccountStatus, operatorRole: string) {
    if (operatorRole === Role.CUSTOMER) {
      throw new ForbiddenException('Customers cannot modify reseller accounts');
    }

    const updated = await this.prisma.user.update({
      where: { id: targetUserId },
      data: { status },
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
      },
    });

    return updated;
  }

  /**
   * Role hierarchy enforcer
   */
  private validateChildRole(parentRole: Role, childRole: Role) {
    if (parentRole === Role.SUPER_ADMIN) {
      return; // Super Admin can create any tier
    }

    const allowedMap: Record<Role, Role[]> = {
      [Role.SUPER_ADMIN]: [Role.SERVICE_PROVIDER, Role.MASTER_RESELLER, Role.SUB_RESELLER, Role.CUSTOMER],
      [Role.SERVICE_PROVIDER]: [Role.MASTER_RESELLER, Role.SUB_RESELLER, Role.CUSTOMER],
      [Role.MASTER_RESELLER]: [Role.SUB_RESELLER, Role.CUSTOMER],
      [Role.SUB_RESELLER]: [Role.CUSTOMER],
      [Role.CUSTOMER]: [],
    };

    if (!allowedMap[parentRole].includes(childRole)) {
      throw new BadRequestException(
        `A '${parentRole}' is not allowed to create a '${childRole}'. Hierarchy order must be respected.`,
      );
    }
  }

  /**
   * Update Customer Settings, Calling configuration, and KYC approval
   */
  async updateCustomer(
    id: string,
    data: {
      name?: string;
      email?: string;
      phone?: string;
      companyName?: string;
      password?: string;
      audioType?: string;
      autoApproveAudio?: boolean;
      autoApproveCampaigns?: boolean;
      pulseRate?: number;
      pulseDuration?: number;
      status?: AccountStatus;
      callerIds?: string[];
    },
  ) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Customer not found');

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.companyName !== undefined) updateData.companyName = data.companyName;
    if (data.audioType !== undefined) updateData.audioType = data.audioType;
    if (data.autoApproveAudio !== undefined) updateData.autoApproveAudio = data.autoApproveAudio;
    if (data.autoApproveCampaigns !== undefined) updateData.autoApproveCampaigns = data.autoApproveCampaigns;
    if (data.pulseRate !== undefined) updateData.pulseRate = data.pulseRate;
    if (data.pulseDuration !== undefined) updateData.pulseDuration = data.pulseDuration;
    if (data.status !== undefined) updateData.status = data.status;

    if (data.password && data.password.trim().length > 0) {
      updateData.passwordHash = await bcrypt.hash(data.password, 10);
    }

    if (data.callerIds !== undefined) {
      // Clear previous caller links, then assign selected ones
      await this.prisma.callerId.updateMany({
        where: { userId: id },
        data: { userId: null },
      });
      if (data.callerIds.length > 0) {
        await this.prisma.callerId.updateMany({
          where: { id: { in: data.callerIds } },
          data: { userId: id },
        });
      }
    }

    return this.prisma.user.update({
      where: { id },
      data: updateData,
      include: {
        wallet: true,
        callers: true,
      },
    });
  }

  /**
   * Direct Deposit / Recharge to Customer Wallet
   */
  async depositToCustomer(userId: string, amount: number, notes?: string) {
    if (!amount || amount <= 0) {
      throw new BadRequestException('Deposit amount must be greater than zero');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { wallet: true },
    });

    if (!user) throw new NotFoundException('Customer not found');

    // Ensure user has a wallet
    let wallet = user.wallet;
    if (!wallet) {
      wallet = await this.prisma.wallet.create({
        data: {
          userId,
          currency: 'BDT',
          balance: 0,
        },
      });
    }

    const depositAmount = new Prisma.Decimal(amount);
    const beforeBal = wallet.balance;
    const afterBal = beforeBal.plus(depositAmount);

    return this.prisma.$transaction(async (tx) => {
      // 1. Update wallet balance
      const updatedWallet = await tx.wallet.update({
        where: { id: wallet!.id },
        data: {
          balance: afterBal,
          version: { increment: 1 },
        },
      });

      // 2. Create recharge request record
      const recharge = await tx.rechargeRequest.create({
        data: {
          userId,
          amount: depositAmount,
          currency: 'BDT',
          paymentMethod: 'ADMIN_MANUAL',
          status: 'APPROVED',
          note: notes || 'Admin manual recharge',
        },
      });

      // 3. Create immutable ledger entry
      await tx.ledgerEntry.create({
        data: {
          walletId: wallet!.id,
          userId,
          type: TransactionType.CREDIT,
          amount: depositAmount,
          balanceBefore: beforeBal,
          balanceAfter: afterBal,
          referenceType: ReferenceType.MANUAL_ADJUSTMENT,
          referenceId: recharge.id,
          idempotencyKey: `DEP-MANUAL-${recharge.id}`,
          description: notes ? `Admin deposit: ${notes}` : `Admin direct deposit to wallet`,
        },
      });

      return {
        success: true,
        balance: afterBal.toNumber(),
        rechargeId: recharge.id,
      };
    });
  }

  /**
   * Resolve physical path for Customer NID Document
   */
  async getCustomerDocumentPath(userId: string, type: 'front' | 'back') {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { frontNid: true, backNid: true },
    });

    if (!user) throw new NotFoundException('Customer not found');

    const relativePath = type === 'front' ? user.frontNid : user.backNid;
    if (!relativePath) throw new NotFoundException(`No ${type} NID document found for this customer`);

    const possiblePaths = [
      path.join('/www/wwwroot/vsms.ominaz.com/storage/app/private', relativePath),
      path.join('/www/wwwroot/vsms.ominaz.com/storage/app/public', relativePath),
      path.join('/www/wwwroot/vsms.ominaz.com/storage', relativePath),
    ];

    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        return p;
      }
    }

    throw new NotFoundException(`NID document file not found on server storage: ${relativePath}`);
  }

  /**
   * Get white-label branding configuration for a reseller
   */
  async getResellerBrand(resellerId: string) {
    let brand = await this.prisma.resellerBrand.findUnique({
      where: { resellerId },
    });
    if (!brand) {
      const user = await this.prisma.user.findUnique({ where: { id: resellerId } });
      brand = await this.prisma.resellerBrand.create({
        data: {
          resellerId,
          brandName: user?.companyName || user?.name || 'Voice SMS Portal',
          primaryColor: '#2563eb',
          secondaryColor: '#1e40af',
          supportEmail: user?.email,
          supportPhone: user?.phone,
        },
      });
    }
    return brand;
  }

  /**
   * Update white-label branding configuration
   */
  async updateResellerBrand(resellerId: string, data: any) {
    return this.prisma.resellerBrand.upsert({
      where: { resellerId },
      update: {
        customDomain: data.customDomain || null,
        brandName: data.brandName,
        logoUrl: data.logoUrl,
        faviconUrl: data.faviconUrl,
        primaryColor: data.primaryColor || '#2563eb',
        secondaryColor: data.secondaryColor || '#1e40af',
        supportEmail: data.supportEmail,
        supportPhone: data.supportPhone,
        footerText: data.footerText,
        isVerified: data.isVerified !== undefined ? Boolean(data.isVerified) : false,
      },
      create: {
        resellerId,
        customDomain: data.customDomain || null,
        brandName: data.brandName || 'Voice SMS Portal',
        logoUrl: data.logoUrl,
        faviconUrl: data.faviconUrl,
        primaryColor: data.primaryColor || '#2563eb',
        secondaryColor: data.secondaryColor || '#1e40af',
        supportEmail: data.supportEmail,
        supportPhone: data.supportPhone,
        footerText: data.footerText,
        isVerified: Boolean(data.isVerified),
      },
    });
  }

  /**
   * Super Admin approves or adjusts Reseller credit limit
   */
  async updateCreditLimit(resellerId: string, creditLimit: number, allowNegativeBalance: boolean) {
    await this.prisma.user.update({
      where: { id: resellerId },
      data: {
        creditLimit: new Prisma.Decimal(creditLimit),
        allowNegativeBalance,
      },
    });

    await this.prisma.wallet.updateMany({
      where: { userId: resellerId },
      data: { creditLimit: new Prisma.Decimal(creditLimit) },
    });

    return {
      success: true,
      resellerId,
      creditLimit,
      allowNegativeBalance,
    };
  }
}

