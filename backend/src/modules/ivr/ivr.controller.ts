import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { IvrService, DispatchIvrOrderDto } from './ivr.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { IvrOrderStatus } from '@prisma/client';

@Controller('ivr')
@UseGuards(JwtAuthGuard)
export class IvrController {
  constructor(private readonly ivrService: IvrService) {}

  /**
   * Dispatch an Outbound IVR call to confirm an e-commerce order
   */
  @Post('orders/dispatch')
  async dispatchOrder(@Request() req: any, @Body() dto: DispatchIvrOrderDto) {
    const userId = req.user.id || req.user.sub;
    return this.ivrService.dispatchOrderCall(userId, dto);
  }

  /**
   * List IVR Order Confirmations with tenant isolation
   */
  @Get('orders')
  async listOrders(
    @Request() req: any,
    @Query('status') status?: IvrOrderStatus,
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.ivrService.listOrders(req.user, { status, search, page, limit });
  }

  /**
   * Get single order detail
   */
  @Get('orders/:id')
  async getOrder(@Request() req: any, @Param('id') id: string) {
    return this.ivrService.getOrderById(req.user, id);
  }

  /**
   * Retry Outbound IVR Call for an order
   */
  @Post('orders/:id/retry')
  async retryOrder(@Request() req: any, @Param('id') id: string) {
    const order = await this.ivrService.getOrderById(req.user, id);
    return this.ivrService.dispatchOrderCall(order.userId, {
      orderNumber: order.orderNumber,
      customerName: order.customerName || undefined,
      customerPhone: order.customerPhone,
      orderAmount: Number(order.orderAmount),
      currency: order.currency,
      itemsSummary: order.itemsSummary || undefined,
      metadata: order.metadata,
      flowId: order.flowId || undefined,
      webhookUrl: order.webhookUrl || undefined,
    });
  }

  /**
   * List configured IVR Flows for the user
   */
  @Get('flows')
  async listFlows(@Request() req: any) {
    const userId = req.user.id || req.user.sub;
    return this.ivrService.listFlows(userId);
  }

  /**
   * Create or update IVR Flow
   */
  @Post('flows')
  async saveFlow(@Request() req: any, @Body() data: any) {
    const userId = req.user.id || req.user.sub;
    return this.ivrService.saveFlow(userId, data);
  }

  /**
   * Delete IVR Flow
   */
  @Delete('flows/:id')
  async deleteFlow(@Request() req: any, @Param('id') id: string) {
    const userId = req.user.id || req.user.sub;
    return this.ivrService.deleteFlow(userId, id);
  }

  /**
   * List scheduled customer callbacks
   */
  @Get('callbacks')
  async listCallbacks(@Request() req: any) {
    return this.ivrService.listCallbacks(req.user);
  }

  /**
   * Mark a callback completed
   */
  @Post('callbacks/:id/complete')
  async completeCallback(@Param('id') id: string) {
    return this.ivrService.completeCallback(id);
  }
}
