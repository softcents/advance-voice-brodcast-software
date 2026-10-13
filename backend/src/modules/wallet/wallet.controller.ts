import { Controller, Get, Post, Body, Query, Param } from '@nestjs/common';
import { WalletService, TransferBalanceDto, RechargeDto } from './wallet.service';

@Controller('wallets')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get('me')
  async getMyWallet(@Query('userId') userId?: string) {
    const targetUserId = userId || 'ef72a7f3-e48e-47a2-b8cb-1517a5eb4bca';
    return this.walletService.getWallet(targetUserId);
  }

  @Get('deposits')
  async getDeposits() {
    return this.walletService.getAllDeposits();
  }

  @Get('statements')
  async getStatements(
    @Query('userId') userId?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    const targetUserId = userId || 'ef72a7f3-e48e-47a2-b8cb-1517a5eb4bca';
    return this.walletService.getLedgerStatement(targetUserId, parseInt(page, 10), parseInt(limit, 10));
  }

  @Get('all-statements')
  async getAllStatements(
    @Query('page') page = '1',
    @Query('limit') limit = '50',
  ) {
    return this.walletService.getAllStatements(parseInt(page, 10), parseInt(limit, 10));
  }

  @Post('transfer')
  async transferBalance(
    @Body() dto: TransferBalanceDto & { fromUserId?: string },
  ) {
    const fromUserId = dto.fromUserId || 'ef72a7f3-e48e-47a2-b8cb-1517a5eb4bca';
    return this.walletService.transferBalance(fromUserId, dto);
  }

  @Post('recharge')
  async rechargeWallet(
    @Body() dto: RechargeDto & { operatorId?: string },
  ) {
    const operatorId = dto.operatorId || 'ef72a7f3-e48e-47a2-b8cb-1517a5eb4bca';
    return this.walletService.rechargeWallet(operatorId, dto);
  }
}
