import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import * as amqp from 'amqplib';
import { RedisService } from '../../common/redis.service';

export const QUEUES = {
  CAMPAIGN_DISPATCH: 'voice.campaign.dispatch',
  CAMPAIGN_DLQ: 'voice.campaign.dlq',
  IVR_RETRY: 'voice.ivr.retry',
  IVR_DLQ: 'voice.ivr.dlq',
  WEBHOOK_DISPATCH: 'voice.webhook.dispatch',
  WEBHOOK_DLQ: 'voice.webhook.dlq',
};

export const EXCHANGES = {
  CAMPAIGN_DLX: 'voice.campaign.dlx',
  IVR_DLX: 'voice.ivr.dlx',
  WEBHOOK_DLX: 'voice.webhook.dlx',
};

@Injectable()
export class QueueService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(QueueService.name);
  private connection: amqp.ChannelModel | null = null;
  private channel: amqp.ConfirmChannel | null = null;
  private isConnected = false;
  private reconnecting = false;

  constructor(private readonly redisService: RedisService) {}

  async onModuleInit() {
    await this.initRabbitMQ();
  }

  async onModuleDestroy() {
    this.logger.log('Gracefully disconnecting RabbitMQ channels and connection...');
    try {
      if (this.channel) {
        await this.channel.close();
      }
      if (this.connection) {
        await this.connection.close();
      }
    } catch (e: any) {
      this.logger.warn(`Error during RabbitMQ shutdown: ${e.message}`);
    }
  }

  private async initRabbitMQ() {
    const rabbitUrl = process.env.RABBITMQ_URL || 'amqp://guest:guest@127.0.0.1:5672';
    try {
      this.logger.log(`Connecting to RabbitMQ broker at ${rabbitUrl}...`);
      this.connection = await amqp.connect(rabbitUrl);
      this.channel = await this.connection.createConfirmChannel();
      this.isConnected = true;
      this.reconnecting = false;

      this.logger.log('✅ Connected to RabbitMQ. Setting up durable queues and dead-letter exchanges...');
      await this.setupQueues();

      this.connection.on('error', (err) => {
        this.logger.error(`RabbitMQ connection error: ${err.message}`);
        this.handleDisconnect();
      });

      this.connection.on('close', () => {
        this.logger.warn('RabbitMQ connection closed. Attempting reconnect in 5 seconds...');
        this.handleDisconnect();
      });
    } catch (err: any) {
      this.logger.error(`Failed to connect to RabbitMQ: ${err.message}. Will retry in 5s.`);
      this.handleDisconnect();
    }
  }

  private handleDisconnect() {
    this.isConnected = false;
    this.channel = null;
    this.connection = null;
    if (!this.reconnecting) {
      this.reconnecting = true;
      setTimeout(() => this.initRabbitMQ(), 5000);
    }
  }

  /**
   * Declare durable queues, DLXs, and bindings
   */
  private async setupQueues() {
    if (!this.channel) return;

    // 1. Campaign DLQ & Exchange
    await this.channel.assertExchange(EXCHANGES.CAMPAIGN_DLX, 'direct', { durable: true });
    await this.channel.assertQueue(QUEUES.CAMPAIGN_DLQ, { durable: true });
    await this.channel.bindQueue(QUEUES.CAMPAIGN_DLQ, EXCHANGES.CAMPAIGN_DLX, 'dead-letter');

    // Campaign Dispatch Queue with DLX
    await this.channel.assertQueue(QUEUES.CAMPAIGN_DISPATCH, {
      durable: true,
      arguments: {
        'x-dead-letter-exchange': EXCHANGES.CAMPAIGN_DLX,
        'x-dead-letter-routing-key': 'dead-letter',
      },
    });

    // 2. IVR Retry DLQ & Exchange
    await this.channel.assertExchange(EXCHANGES.IVR_DLX, 'direct', { durable: true });
    await this.channel.assertQueue(QUEUES.IVR_DLQ, { durable: true });
    await this.channel.bindQueue(QUEUES.IVR_DLQ, EXCHANGES.IVR_DLX, 'dead-letter');

    // IVR Retry Queue
    await this.channel.assertQueue(QUEUES.IVR_RETRY, {
      durable: true,
      arguments: {
        'x-dead-letter-exchange': EXCHANGES.IVR_DLX,
        'x-dead-letter-routing-key': 'dead-letter',
      },
    });

    // 3. Webhook Dispatch DLQ & Exchange
    await this.channel.assertExchange(EXCHANGES.WEBHOOK_DLX, 'direct', { durable: true });
    await this.channel.assertQueue(QUEUES.WEBHOOK_DLQ, { durable: true });
    await this.channel.bindQueue(QUEUES.WEBHOOK_DLQ, EXCHANGES.WEBHOOK_DLX, 'dead-letter');

    // Webhook Dispatch Queue
    await this.channel.assertQueue(QUEUES.WEBHOOK_DISPATCH, {
      durable: true,
      arguments: {
        'x-dead-letter-exchange': EXCHANGES.WEBHOOK_DLX,
        'x-dead-letter-routing-key': 'dead-letter',
      },
    });

    this.logger.log('✅ RabbitMQ Queues & Dead-Letter Exchanges asserted successfully.');
  }

  /**
   * Get an active AMQP Channel for workers or internal consumers
   */
  async getChannel(): Promise<amqp.ConfirmChannel | null> {
    if (this.channel && this.isConnected) {
      return this.channel;
    }
    if (this.connection) {
      this.channel = await this.connection.createConfirmChannel();
      return this.channel;
    }
    return null;
  }

  /**
   * Get dedicated channel for worker consumer
   */
  async createDedicatedChannel(): Promise<amqp.Channel | null> {
    if (!this.connection) return null;
    return this.connection.createChannel();
  }

  /**
   * Publish a campaign call to the durable RabbitMQ dispatch queue
   */
  async publishCampaignCall(campaignId: string, callId: string, tenantId: string, priority: number = 0): Promise<boolean> {
    if (!this.channel || !this.isConnected) {
      this.logger.warn(`Cannot publish to RabbitMQ: connection offline. Call #${callId}`);
      return false;
    }

    const payload = {
      campaignId,
      callId,
      tenantId,
      enqueuedAt: new Date().toISOString(),
      attempts: 0,
    };

    const buffer = Buffer.from(JSON.stringify(payload));
    return new Promise((resolve) => {
      this.channel!.sendToQueue(
        QUEUES.CAMPAIGN_DISPATCH,
        buffer,
        {
          persistent: true,
          messageId: `call-${callId}`,
          priority,
          timestamp: Date.now(),
        },
        (err) => {
          if (err) {
            this.logger.error(`RabbitMQ Nack on campaign call #${callId}: ${err.message}`);
            resolve(false);
          } else {
            resolve(true);
          }
        },
      );
    });
  }

  /**
   * Publish an Outbound IVR retry job
   */
  async publishIvrRetry(orderId: string, attempt: number, delayMs: number = 0): Promise<boolean> {
    if (!this.channel || !this.isConnected) {
      return false;
    }

    const payload = {
      orderId,
      attempt,
      scheduledFor: new Date(Date.now() + delayMs).toISOString(),
    };

    const buffer = Buffer.from(JSON.stringify(payload));
    return new Promise((resolve) => {
      this.channel!.sendToQueue(
        QUEUES.IVR_RETRY,
        buffer,
        {
          persistent: true,
          messageId: `ivr-retry-${orderId}-${attempt}`,
          headers: { 'x-delay': delayMs },
        },
        (err) => {
          if (err) {
            this.logger.error(`RabbitMQ Nack on IVR retry order #${orderId}: ${err.message}`);
            resolve(false);
          } else {
            resolve(true);
          }
        },
      );
    });
  }

  /**
   * Publish merchant webhook delivery job
   */
  async publishWebhook(orderId: string, event: string, payload: any, attempt: number = 1): Promise<boolean> {
    if (!this.channel || !this.isConnected) {
      return false;
    }

    const message = {
      orderId,
      event,
      payload,
      attempt,
      timestamp: new Date().toISOString(),
    };

    const buffer = Buffer.from(JSON.stringify(message));
    return new Promise((resolve) => {
      this.channel!.sendToQueue(
        QUEUES.WEBHOOK_DISPATCH,
        buffer,
        {
          persistent: true,
          messageId: `wh-${orderId}-${event}-${attempt}`,
        },
        (err) => {
          if (err) {
            this.logger.error(`RabbitMQ Nack on webhook for order #${orderId}: ${err.message}`);
            resolve(false);
          } else {
            resolve(true);
          }
        },
      );
    });
  }

  /**
   * Query queue metrics and message counts for monitoring
   */
  async getQueueMetrics() {
    if (!this.channel || !this.isConnected) {
      return {
        connected: false,
        queues: {},
      };
    }

    const metrics: Record<string, { messageCount: number; consumerCount: number }> = {};
    for (const queueName of Object.values(QUEUES)) {
      try {
        const info = await this.channel.checkQueue(queueName);
        metrics[queueName] = {
          messageCount: info.messageCount,
          consumerCount: info.consumerCount,
        };
      } catch (err: any) {
        metrics[queueName] = { messageCount: -1, consumerCount: -1 };
      }
    }

    return {
      connected: true,
      queues: metrics,
    };
  }

  /**
   * Purge a specific queue (Admin only)
   */
  async purgeQueue(queueName: string): Promise<number> {
    if (!this.channel || !this.isConnected) return 0;
    const res = await this.channel.purgeQueue(queueName);
    return res.messageCount;
  }
}
