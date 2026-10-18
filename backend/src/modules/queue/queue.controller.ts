import { Controller, Get, Post, Param, UseGuards, ForbiddenException } from '@nestjs/common';
import { QueueService } from './queue.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@Controller('queue')
@UseGuards(JwtAuthGuard)
export class QueueController {
  constructor(private readonly queueService: QueueService) {}

  /**
   * Health status of RabbitMQ broker
   */
  @Get('health')
  async getHealth() {
    return this.queueService.getQueueMetrics();
  }

  /**
   * Queue depth & active consumer metrics (Super Admin only)
   */
  @Get('metrics')
  async getMetrics(@CurrentUser() user: any) {
    if (user.role !== Role.SUPER_ADMIN) {
      throw new ForbiddenException('Super Admin access required to view queue internals');
    }
    return this.queueService.getQueueMetrics();
  }

  /**
   * Purge queue contents (Super Admin only)
   */
  @Post('purge/:queueName')
  async purgeQueue(@CurrentUser() user: any, @Param('queueName') queueName: string) {
    if (user.role !== Role.SUPER_ADMIN) {
      throw new ForbiddenException('Super Admin access required to purge queues');
    }
    const purgedCount = await this.queueService.purgeQueue(queueName);
    return { success: true, queue: queueName, purgedMessages: purgedCount };
  }
}
