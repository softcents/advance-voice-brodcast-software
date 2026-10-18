import { Test, TestingModule } from '@nestjs/testing';
import { QueueService, QUEUES, EXCHANGES } from '../src/modules/queue/queue.service';
import { RedisService } from '../src/common/redis.service';

describe('RabbitMqQueueTest', () => {
  let queueService: QueueService;

  const mockChannel = {
    assertExchange: jest.fn().mockResolvedValue(true),
    assertQueue: jest.fn().mockResolvedValue({ messageCount: 0, consumerCount: 1 }),
    bindQueue: jest.fn().mockResolvedValue(true),
    sendToQueue: jest.fn((queue, buffer, options, callback) => {
      if (callback) callback(null);
      return true;
    }),
    checkQueue: jest.fn().mockResolvedValue({ messageCount: 5, consumerCount: 2 }),
    purgeQueue: jest.fn().mockResolvedValue({ messageCount: 10 }),
    close: jest.fn().mockResolvedValue(true),
  };

  const mockConnection = {
    createConfirmChannel: jest.fn().mockResolvedValue(mockChannel),
    createChannel: jest.fn().mockResolvedValue(mockChannel),
    close: jest.fn().mockResolvedValue(true),
    on: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QueueService,
        { provide: RedisService, useValue: {} },
      ],
    }).compile();

    queueService = module.get<QueueService>(QueueService);
    // Inject mock connection & channel
    (queueService as any).connection = mockConnection;
    (queueService as any).channel = mockChannel;
    (queueService as any).isConnected = true;
  });

  it('should publish a campaign call to the durable dispatch queue with persistent delivery', async () => {
    const result = await queueService.publishCampaignCall('camp-1', 'call-99', 'tenant-alpha', 2);

    expect(result).toBe(true);
    expect(mockChannel.sendToQueue).toHaveBeenCalledWith(
      QUEUES.CAMPAIGN_DISPATCH,
      expect.any(Buffer),
      expect.objectContaining({
        persistent: true,
        messageId: 'call-call-99',
        priority: 2,
      }),
      expect.any(Function),
    );
  });

  it('should publish an IVR retry with custom delay header', async () => {
    const result = await queueService.publishIvrRetry('ord-55', 2, 300000);

    expect(result).toBe(true);
    expect(mockChannel.sendToQueue).toHaveBeenCalledWith(
      QUEUES.IVR_RETRY,
      expect.any(Buffer),
      expect.objectContaining({
        persistent: true,
        messageId: 'ivr-retry-ord-55-2',
        headers: { 'x-delay': 300000 },
      }),
      expect.any(Function),
    );
  });

  it('should query queue metrics accurately across all durable queues', async () => {
    const metrics = await queueService.getQueueMetrics();

    expect(metrics.connected).toBe(true);
    expect(metrics.queues[QUEUES.CAMPAIGN_DISPATCH]).toEqual({
      messageCount: 5,
      consumerCount: 2,
    });
  });
});
