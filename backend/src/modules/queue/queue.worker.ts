import { Injectable, Logger, OnModuleInit, OnModuleDestroy, Inject, forwardRef } from '@nestjs/common';
import * as amqp from 'amqplib';
import { QueueService, QUEUES } from './queue.service';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../common/redis.service';
import { CallDispatcherService } from '../telephony/call-dispatcher.service';
import { IvrService } from '../ivr/ivr.service';
import { CampaignStatus, IvrOrderStatus } from '@prisma/client';
import axios from 'axios';
import * as crypto from 'crypto';

@Injectable()
export class QueueWorker implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(QueueWorker.name);
  private campaignChannel: amqp.Channel | null = null;
  private ivrChannel: amqp.Channel | null = null;
  private webhookChannel: amqp.Channel | null = null;
  private isRunning = true;

  constructor(
    private readonly queueService: QueueService,
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
    private readonly callDispatcher: CallDispatcherService,
    @Inject(forwardRef(() => IvrService))
    private readonly ivrService: IvrService,
  ) {}

  async onModuleInit() {
    // Delay initialization slightly to ensure RabbitMQ broker connection is established
    setTimeout(() => {
      this.startWorkers().catch((err) => {
        this.logger.error(`Error starting queue workers: ${err.message}`);
      });
    }, 2000);
  }

  async onModuleDestroy() {
    this.isRunning = false;
    this.logger.log('Shutting down RabbitMQ background workers...');
    try {
      if (this.campaignChannel) await this.campaignChannel.close();
      if (this.ivrChannel) await this.ivrChannel.close();
      if (this.webhookChannel) await this.webhookChannel.close();
    } catch (e: any) {
      this.logger.warn(`Worker shutdown notice: ${e.message}`);
    }
  }

  private async startWorkers() {
    this.logger.log('🚀 Starting Enterprise RabbitMQ Background Workers...');
    await Promise.all([
      this.startCampaignWorker(),
      this.startIvrRetryWorker(),
      this.startWebhookWorker(),
    ]);
  }

  /**
   * 1. Voice Campaign Dispatch Worker
   */
  private async startCampaignWorker() {
    try {
      this.campaignChannel = await this.queueService.createDedicatedChannel();
      if (!this.campaignChannel) {
        this.logger.warn('Could not create campaign worker channel. Retrying in 5s...');
        setTimeout(() => this.startCampaignWorker(), 5000);
        return;
      }

      // Controlled worker concurrency: prefetch 15 jobs per worker
      await this.campaignChannel.prefetch(15);
      this.logger.log(`✅ Campaign Dispatch Worker listening on '${QUEUES.CAMPAIGN_DISPATCH}' (prefetch=15)`);

      await this.campaignChannel.consume(
        QUEUES.CAMPAIGN_DISPATCH,
        async (msg) => {
          if (!msg) return;
          try {
            await this.processCampaignJob(msg);
          } catch (err: any) {
            this.logger.error(`Unhandled error processing campaign message: ${err.message}`);
            // Reject and send to DLQ if unhandled
            this.campaignChannel?.nack(msg, false, false);
          }
        },
        { noAck: false },
      );
    } catch (e: any) {
      this.logger.error(`Failed to start campaign worker: ${e.message}`);
      setTimeout(() => this.startCampaignWorker(), 5000);
    }
  }

  private async processCampaignJob(msg: amqp.ConsumeMessage) {
    const rawContent = msg.content.toString();
    const data = JSON.parse(rawContent);
    const { campaignId, callId, tenantId } = data;

    // A. Check Campaign Status
    if (campaignId) {
      const campaign = await this.prisma.campaign.findUnique({
        where: { id: campaignId },
        select: { status: true },
      });

      if (!campaign || campaign.status === CampaignStatus.CANCELLED) {
        this.logger.warn(`Campaign #${campaignId} cancelled or deleted. Dropping call #${callId}`);
        this.campaignChannel?.ack(msg);
        return;
      }

      if (campaign.status === CampaignStatus.PAUSED) {
        this.logger.log(`Campaign #${campaignId} is PAUSED. Re-queueing call #${callId} with backoff...`);
        await new Promise((r) => setTimeout(r, 3000));
        this.campaignChannel?.nack(msg, false, true);
        return;
      }
    }

    // B. Per-Tenant Concurrency Protection (Redis atomic check)
    const tenantLockKey = `tenant:${tenantId}:active_calls`;
    const user = await this.prisma.user.findUnique({
      where: { id: tenantId },
      select: { role: true },
    });

    const tenantMaxConcurrency = user?.role === 'SUPER_ADMIN' ? 100 : 30;
    // Check if tenant active calls exceed limit
    // Note: We use Redis to check instantaneous active calls
    const currentActiveStr = await this.redisService.getTenantCache<string>(tenantId, 'active_calls_count');
    const currentActive = currentActiveStr ? parseInt(currentActiveStr, 10) : 0;

    if (currentActive >= tenantMaxConcurrency) {
      this.logger.warn(`Tenant ${tenantId} reached concurrency limit (${currentActive}/${tenantMaxConcurrency}). Pacing dispatch.`);
      await new Promise((r) => setTimeout(r, 1500));
      this.campaignChannel?.nack(msg, false, true);
      return;
    }

    // C. Distributed Idempotency Lock
    const dispatchLock = await this.redisService.acquireLock(`dispatch:${callId}`, 30);
    if (!dispatchLock) {
      this.logger.log(`Call #${callId} is already being dispatched by another worker. Dropping redundant message.`);
      this.campaignChannel?.ack(msg);
      return;
    }

    try {
      // D. Dispatch Call via CallDispatcherService
      const result = await this.callDispatcher.dispatchCall(callId);

      if (result?.requeue) {
        // Concurrency limit reached on trunk or PBX server, backoff and requeue
        await new Promise((r) => setTimeout(r, 2000));
        this.campaignChannel?.nack(msg, false, true);
      } else {
        // Success or terminal state reached
        this.campaignChannel?.ack(msg);
      }
    } catch (dispatchErr: any) {
      this.logger.error(`Dispatch failed for call #${callId}: ${dispatchErr.message}`);
      // If error is recoverable or network glitch, requeue up to 3 times
      const deathHeader = msg.properties.headers?.['x-death'];
      const retryCount = deathHeader ? deathHeader[0]?.count || 0 : 0;

      if (retryCount < 3) {
        this.campaignChannel?.nack(msg, false, true);
      } else {
        // Max retries exceeded: push to DLQ
        this.logger.error(`Max retries exceeded for call #${callId}. Moving to Dead-Letter Queue.`);
        this.campaignChannel?.nack(msg, false, false);
      }
    } finally {
      await this.redisService.releaseLock(`dispatch:${callId}`);
    }
  }

  /**
   * 2. Outbound IVR Auto-Retry Worker
   */
  private async startIvrRetryWorker() {
    try {
      this.ivrChannel = await this.queueService.createDedicatedChannel();
      if (!this.ivrChannel) {
        setTimeout(() => this.startIvrRetryWorker(), 5000);
        return;
      }

      await this.ivrChannel.prefetch(5);
      this.logger.log(`✅ Outbound IVR Retry Worker listening on '${QUEUES.IVR_RETRY}'`);

      await this.ivrChannel.consume(
        QUEUES.IVR_RETRY,
        async (msg) => {
          if (!msg) return;
          try {
            await this.processIvrRetryJob(msg);
          } catch (err: any) {
            this.logger.error(`IVR retry processing exception: ${err.message}`);
            this.ivrChannel?.nack(msg, false, false);
          }
        },
        { noAck: false },
      );
    } catch (e: any) {
      this.logger.error(`Failed to start IVR retry worker: ${e.message}`);
      setTimeout(() => this.startIvrRetryWorker(), 5000);
    }
  }

  private async processIvrRetryJob(msg: amqp.ConsumeMessage) {
    const rawContent = msg.content.toString();
    const data = JSON.parse(rawContent);
    const { orderId, attempt } = data;

    const order = await this.prisma.ivrOrder.findUnique({
      where: { id: orderId },
      include: { flow: true },
    });

    if (!order) {
      this.ivrChannel?.ack(msg);
      return;
    }

    // If order already reached a terminal state (CONFIRMED, CANCELLED, or manually resolved), dismiss retry
    if (
      order.status === IvrOrderStatus.CONFIRMED ||
      order.status === IvrOrderStatus.CANCELLED ||
      order.status === IvrOrderStatus.CANCELLATION_REQUESTED ||
      order.status === IvrOrderStatus.CALLBACK_SCHEDULED
    ) {
      this.logger.log(`Order #${order.orderNumber} is already in state '${order.status}'. Skipping retry.`);
      this.ivrChannel?.ack(msg);
      return;
    }

    const maxAttempts = order.flow?.maxRepeats ? order.flow.maxRepeats + 1 : 3;
    if (order.attempts >= maxAttempts) {
      this.logger.log(`Order #${order.orderNumber} reached max attempts (${order.attempts}/${maxAttempts}). Stopping retries.`);
      await this.prisma.ivrOrder.update({
        where: { id: order.id },
        data: { status: IvrOrderStatus.FAILED, notes: 'Max retry attempts exhausted without answer' },
      });
      this.ivrChannel?.ack(msg);
      return;
    }

    this.logger.log(`🔄 Retrying Outbound IVR call for Order #${order.orderNumber} (Attempt ${order.attempts + 1}/${maxAttempts})`);

    try {
      await this.ivrService.dispatchOrderCall(order.userId, {
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

      await this.prisma.ivrOrder.update({
        where: { id: order.id },
        data: { attempts: { increment: 1 }, lastAttemptAt: new Date() },
      });

      this.ivrChannel?.ack(msg);
    } catch (err: any) {
      this.logger.error(`Retry dispatch failed for order #${order.orderNumber}: ${err.message}`);
      this.ivrChannel?.nack(msg, false, false);
    }
  }

  /**
   * 3. Merchant Webhook Dispatch Worker with Exponential Backoff
   */
  private async startWebhookWorker() {
    try {
      this.webhookChannel = await this.queueService.createDedicatedChannel();
      if (!this.webhookChannel) {
        setTimeout(() => this.startWebhookWorker(), 5000);
        return;
      }

      await this.webhookChannel.prefetch(20);
      this.logger.log(`✅ Webhook Dispatch Worker listening on '${QUEUES.WEBHOOK_DISPATCH}' (prefetch=20)`);

      await this.webhookChannel.consume(
        QUEUES.WEBHOOK_DISPATCH,
        async (msg) => {
          if (!msg) return;
          try {
            await this.processWebhookJob(msg);
          } catch (err: any) {
            this.logger.error(`Webhook processing exception: ${err.message}`);
            this.webhookChannel?.nack(msg, false, false);
          }
        },
        { noAck: false },
      );
    } catch (e: any) {
      this.logger.error(`Failed to start webhook worker: ${e.message}`);
      setTimeout(() => this.startWebhookWorker(), 5000);
    }
  }

  private async processWebhookJob(msg: amqp.ConsumeMessage) {
    const rawContent = msg.content.toString();
    const { orderId, event, payload, attempt } = JSON.parse(rawContent);

    const order = await this.prisma.ivrOrder.findUnique({
      where: { id: orderId },
      select: { webhookUrl: true, orderNumber: true },
    });

    if (!order || !order.webhookUrl) {
      this.webhookChannel?.ack(msg);
      return;
    }

    const secret = process.env.JWT_SECRET || 'voice-pro-secret';
    const signature = crypto.createHmac('sha256', secret).update(JSON.stringify(payload)).digest('hex');

    try {
      this.logger.log(`🚀 Webhook delivery attempt ${attempt} for order #${order.orderNumber} to ${order.webhookUrl}`);
      const res = await axios.post(order.webhookUrl, payload, {
        headers: {
          'Content-Type': 'application/json',
          'X-VoicePro-Signature': signature,
          'X-VoicePro-Event': event,
          'X-VoicePro-Attempt': String(attempt),
        },
        timeout: 8000,
      });

      await this.prisma.ivrOrder.update({
        where: { id: orderId },
        data: {
          webhookStatus: 'DELIVERED',
          webhookAttempts: attempt,
          webhookResponse: `Status: ${res.status}`,
        },
      });

      this.webhookChannel?.ack(msg);
    } catch (err: any) {
      this.logger.warn(`Webhook attempt ${attempt} failed for order #${order.orderNumber}: ${err.message}`);

      if (attempt < 5) {
        // Exponential backoff: attempt 1 = 5s, 2 = 15s, 3 = 45s, 4 = 120s
        const backoffMs = Math.pow(3, attempt) * 5000;
        this.logger.log(`Re-scheduling webhook attempt ${attempt + 1} with ${backoffMs / 1000}s backoff...`);

        setTimeout(() => {
          this.queueService.publishWebhook(orderId, event, payload, attempt + 1);
        }, backoffMs);

        this.webhookChannel?.ack(msg); // Ack current message since next attempt is newly scheduled
      } else {
        // Max retries exceeded -> Dead Letter
        this.logger.error(`Webhook permanently failed after 5 attempts for order #${order.orderNumber}. Routing to DLQ.`);
        await this.prisma.ivrOrder.update({
          where: { id: orderId },
          data: {
            webhookStatus: 'FAILED_DLQ',
            webhookAttempts: attempt,
            webhookResponse: `Final failure: ${err.message}`,
          },
        });
        this.webhookChannel?.nack(msg, false, false); // Nack without requeue -> DLQ
      }
    }
  }
}
