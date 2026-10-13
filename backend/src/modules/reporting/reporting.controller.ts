import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import {
  ReportingService,
  CdrFilterDto,
  SalesReportFilterDto,
} from './reporting.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@Controller('reports')
export class ReportingController {
  constructor(private readonly reportingService: ReportingService) {}

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
    // If no userId provided, default to first customer in system
    return this.reportingService.getUsageReport(userId || 'customer-default', filter);
  }

  /**
   * 4. Call Detail Records (CDR)
   */
  @Get('cdr')
  async getCdrReport(
    @CurrentUser() user: AuthenticatedUser,
    @Query() filter: CdrFilterDto,
  ) {
    const userId = user?.id || 'admin-root';
    const role = user?.role || Role.SUPER_ADMIN;
    const path = user?.path || '1';
    return this.reportingService.getCdrReport(userId, role, path, filter);
  }

  /**
   * 5. Reseller Performance Leaderboard
   */
  @Get('resellers')
  async getResellerPerformance(@CurrentUser() user: AuthenticatedUser) {
    const userId = user?.id || 'admin-root';
    const role = user?.role || Role.SUPER_ADMIN;
    const path = user?.path || '1';
    return this.reportingService.getResellerPerformance(userId, role, path);
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
    @CurrentUser() user: AuthenticatedUser,
    @Query() filter: CdrFilterDto,
    @Res() res: Response,
  ) {
    const userId = user?.id || 'admin-root';
    const role = user?.role || Role.SUPER_ADMIN;
    const path = user?.path || '1';

    const data = await this.reportingService.getCdrReport(userId, role, path, {
      ...filter,
      limit: 5000,
      page: 1,
    });

    const fileBuffer = await this.reportingService.generateCdrExcelExport(data.records);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=cdr-report-${Date.now()}.xlsx`);
    res.end(fileBuffer);
  }
}
