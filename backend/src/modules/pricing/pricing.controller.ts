import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { PricingService, CreatePlanDto } from './pricing.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@Controller('pricing')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PricingController {
  constructor(private readonly pricingService: PricingService) {}

  @Get('plans')
  async getPlans(@CurrentUser() user: AuthenticatedUser) {
    return this.pricingService.getPlans(user.id);
  }

  @Post('plans')
  @Roles(Role.SUPER_ADMIN, Role.SERVICE_PROVIDER, Role.MASTER_RESELLER)
  async createPlan(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreatePlanDto,
  ) {
    return this.pricingService.createPlan(user.id, dto);
  }

  @Post('users/:userId/assign-plan')
  @Roles(Role.SUPER_ADMIN, Role.SERVICE_PROVIDER, Role.MASTER_RESELLER)
  async assignPlan(
    @Param('userId') targetUserId: string,
    @Body('planId') planId: string,
  ) {
    return this.pricingService.assignPlan(targetUserId, planId);
  }
}
