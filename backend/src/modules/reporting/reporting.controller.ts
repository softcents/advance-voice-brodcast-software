import { Controller, Get, Query, Res, Headers } from '@nestjs/common';
import { Response } from 'express';
import {
  ReportingService,
  CdrFilterDto,
  SalesReportFilterDto,
} from './reporting.service';
import { Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { extractAuthUser } from '../../common/auth-user.helper';

@Controller('reports')
export class ReportingController {
  constructor(
    private readonly reportingService: ReportingService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Helper to resolve authenticated caller's identity, role, and hierarchy path
   */
  private async resolveCaller(authHeader?: string, targetUserId?: string) {
    const auth = extractAuthUser(authHeader, targetUserId);
    let userId = auth.userId;
    let role = (auth.role as Role) || Role.CUSTOMER;
    let path = '1';

    if (userId) {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (user) {
        role = user.role;
        path = user.path || user.id;
      }
    } else {
      const defaultUser = await this.prisma.user.findFirst({ where: { role: Role.SUPER_ADMIN } });
      if (defaultUser) {
        userId = defaultUser.id;
        role = defaultUser.role;
        path = defaultUser.path || defaultUser.id;
      }
    }

    return { userId: userId || 'admin-root', role, path };
  }

  /**
   * 1. Dashboard Overview (Stats, Distribution, Trends, Asterisk Log Stream)
   */
  @Get('dashboard')
  async getDashboardOverview(@Query('timeframe') timeframe?: string) {
    return this.reportingService.getDashboardOverview(timeframe || 'week');
  }

  /**
   * 2. Sales & Profit Report (Filament SalesReport equivalent)
   */
  @Get('sales')
  async getSalesReport(@Query() filter: SalesReportFilterDto) {
    return this.reportingService.getSalesReport(filter);
  }

  /**
   * 3. Customer Usage & Billing Statement (Filament UsageReport equivalent)
   */
  @Get('usage')
  async getUsageReport(@Query('userId') userId: string, @Query() filter: SalesReportFilterDto) {
    return this.reportingService.getUsageReport(userId || 'customer-default', filter);
  }

  /**
   * 4. Call Detail Records (CDR)
   */
  @Get('cdr')
  async getCdrReport(
    @Query() filter: CdrFilterDto,
    @Headers('authorization') authHeader?: string,
  ) {
    const caller = await this.resolveCaller(authHeader, filter.targetUserId);
    return this.reportingService.getCdrReport(caller.userId, caller.role, caller.path, filter);
  }

  /**
   * 5. Reseller Performance Leaderboard
   */
  @Get('resellers')
  async getResellerPerformance(@Headers('authorization') authHeader?: string) {
    const caller = await this.resolveCaller(authHeader);
    return this.reportingService.getResellerPerformance(caller.userId, caller.role, caller.path);
  }

  /**
   * 6. Telephony & Asterisk Health
   */
  @Get('operational')
  async getOperationalHealth() {
    return this.reportingService.getOperationalHealth();
  }

  /**
   * 7. Export CDR to Excel
   */
  @Get('cdr/export')
  async exportCdr(
    @Query() filter: CdrFilterDto,
    @Headers('authorization') authHeader?: string,
    @Res() res?: Response,
  ) {
    const caller = await this.resolveCaller(authHeader, filter.targetUserId);

    const data = await this.reportingService.getCdrReport(caller.userId, caller.role, caller.path, {
      ...filter,
      limit: 5000,
      page: 1,
    });

    const fileBuffer = await this.reportingService.generateCdrExcelExport(data.records);

    if (res) {
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=cdr-report-${Date.now()}.xlsx`);
      res.end(fileBuffer);
    }
  }

  /**
   * 8. Outbound IVR & Order Confirmation Conversion Analytics
   */
  @Get('ivr-conversion')
  async getIvrOrderConversion(
    @Query() filter: any,
    @Headers('authorization') authHeader?: string,
  ) {
    const caller = await this.resolveCaller(authHeader);
    return this.reportingService.getIvrOrderConversionReport(caller.userId, caller.role, caller.path, filter);
  }

  /**
   * 9. Export IVR Orders to Excel
   */
  @Get('ivr-orders/export')
  async exportIvrOrders(
    @Query() filter: any,
    @Headers('authorization') authHeader?: string,
    @Res() res?: Response,
  ) {
    const caller = await this.resolveCaller(authHeader);
    const data = await this.reportingService.getIvrOrderConversionReport(caller.userId, caller.role, caller.path, filter);
    const fileBuffer = await this.reportingService.generateIvrOrdersExcelExport(data.orders);

    if (res) {
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=ivr-orders-report-${Date.now()}.xlsx`);
      res.end(fileBuffer);
    }
  }
}

