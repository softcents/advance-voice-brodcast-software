import { Controller, Get, Post, Put, Patch, Body, Param, UseGuards, Res } from '@nestjs/common';
import { Response } from 'express';
import { ResellerService, CreateResellerDto } from './reseller.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { HierarchyGuard } from '../../common/guards/hierarchy.guard';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { AccountStatus } from '@prisma/client';

@Controller('resellers')
export class ResellerController {
  constructor(private readonly resellerService: ResellerService) {}

  @Get('customers')
  async getCustomers() {
    return this.resellerService.getAllCustomers();
  }

  @Put('customers/:id')
  async updateCustomer(
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.resellerService.updateCustomer(id, body);
  }

  @Post('customers/:id/deposit')
  async depositToCustomer(
    @Param('id') id: string,
    @Body('amount') amount: number,
    @Body('notes') notes?: string,
  ) {
    return this.resellerService.depositToCustomer(id, Number(amount), notes);
  }

  @Get('customers/:id/documents/:type')
  async getCustomerDocument(
    @Param('id') id: string,
    @Param('type') type: 'front' | 'back',
    @Res() res: Response,
  ) {
    const filePath = await this.resellerService.getCustomerDocumentPath(id, type);
    return res.sendFile(filePath);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('tree')
  async getTree(@CurrentUser() user: AuthenticatedUser) {
    return this.resellerService.getHierarchyTree(user.id, user.role, user.path);
  }

  @Post()
  async createChild(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateResellerDto,
  ) {
    return this.resellerService.createChild(user.id, dto);
  }

  @Patch(':id/status')
  @UseGuards(HierarchyGuard)
  async updateStatus(
    @Param('id') targetId: string,
    @Body('status') status: AccountStatus,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.resellerService.updateStatus(targetId, status, user.role);
  }
}
