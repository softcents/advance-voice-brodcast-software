import { Test, TestingModule } from '@nestjs/testing';
import { IvrService } from '../src/modules/ivr/ivr.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { WalletService } from '../src/modules/wallet/wallet.service';
import { PricingService } from '../src/modules/pricing/pricing.service';
import { RedisService } from '../src/common/redis.service';
import { QueueService } from '../src/modules/queue/queue.service';
import { IvrOrderStatus } from '@prisma/client';

describe('IvrOrderFlowTest', () => {
  let ivrService: IvrService;

  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
    },
    ivrFlow: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    ivrOrder: {
      create: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
    },
    ivrCallback: {
      create: jest.fn(),
    },
    callRecord: {
      create: jest.fn(),
      update: jest.fn(),
      findFirst: jest.fn(),
    },
    sipTrunk: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    callerId: {
      findFirst: jest.fn(),
    },
    asteriskServer: {
      findFirst: jest.fn(),
    },
  };

  const mockWalletService = {
    reserveCallCost: jest.fn().mockResolvedValue(true),
    settleCallUsage: jest.fn().mockResolvedValue(true),
  };

  const mockPricingService = {
    calculateCallCost: jest.fn().mockResolvedValue({
      pulses: 5,
      costPrice: 0.75,
      sellingPrice: 1.50,
      grossProfit: 0.75,
      resellerMargin: 0.525,
      buyRate: 0.15,
      sellRate: 0.30,
      pulseDuration: 10,
      pulseRate: 0.30,
    }),
  };

  const mockRedisService = {
    acquireLock: jest.fn().mockResolvedValue(true),
    releaseLock: jest.fn().mockResolvedValue(true),
    checkAndSetIdempotency: jest.fn().mockResolvedValue(true),
    getTenantCache: jest.fn().mockResolvedValue(null),
    setTenantCache: jest.fn().mockResolvedValue(true),
  };

  const mockQueueService = {
    publishIvrRetry: jest.fn().mockResolvedValue(true),
    publishWebhook: jest.fn().mockResolvedValue(true),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IvrService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: WalletService, useValue: mockWalletService },
        { provide: PricingService, useValue: mockPricingService },
        { provide: RedisService, useValue: mockRedisService },
        { provide: QueueService, useValue: mockQueueService },
      ],
    }).compile();

    ivrService = module.get<IvrService>(IvrService);
  });

  it('should handle DTMF Key 1 as CONFIRMED and trigger merchant webhook', async () => {
    const channelId = 'PJSIP-channel-test-101';
    const fakeServer = {
      ariBaseUrl: 'http://127.0.0.1:8088',
      ariUsername: 'asterisk',
      ariPassword: 'StrongPass123',
    };

    mockPrisma.callRecord.findFirst.mockResolvedValue({
      id: 'call-101',
      channelId,
      ivrOrder: {
        id: 'ord-101',
        orderNumber: 'ORD-9999',
        userId: 'cust-1',
        customerPhone: '01712345678',
        flow: {
          confirmKey: '1',
          cancelKey: '2',
          callbackKey: '3',
          transferKey: '0',
          autoCancelPolicy: false,
        },
      },
    });

    mockPrisma.ivrOrder.update.mockResolvedValue({
      id: 'ord-101',
      status: IvrOrderStatus.CONFIRMED,
      dtmfPressed: '1',
    });

    mockPrisma.ivrOrder.findUnique.mockResolvedValue({
      id: 'ord-101',
      orderNumber: 'ORD-9999',
      webhookUrl: 'https://webhook.site/test',
      status: IvrOrderStatus.CONFIRMED,
      user: { id: 'cust-1' },
    });

    await ivrService.handleDtmf(channelId, '1', fakeServer);

    expect(mockPrisma.ivrOrder.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'ord-101' },
        data: expect.objectContaining({
          status: IvrOrderStatus.CONFIRMED,
          dtmfPressed: '1',
        }),
      }),
    );
  });

  it('should handle DTMF Key 2 as CANCELLATION_REQUESTED when autoCancelPolicy is false', async () => {
    const channelId = 'PJSIP-channel-test-102';
    const fakeServer = {
      ariBaseUrl: 'http://127.0.0.1:8088',
      ariUsername: 'asterisk',
      ariPassword: 'StrongPass123',
    };

    mockPrisma.callRecord.findFirst.mockResolvedValue({
      id: 'call-102',
      channelId,
      ivrOrder: {
        id: 'ord-102',
        orderNumber: 'ORD-8888',
        userId: 'cust-1',
        flow: {
          confirmKey: '1',
          cancelKey: '2',
          callbackKey: '3',
          transferKey: '0',
          autoCancelPolicy: false,
        },
      },
    });

    await ivrService.handleDtmf(channelId, '2', fakeServer);

    expect(mockPrisma.ivrOrder.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'ord-102' },
        data: expect.objectContaining({
          status: IvrOrderStatus.CANCELLATION_REQUESTED,
          dtmfPressed: '2',
        }),
      }),
    );
  });

  it('should handle DTMF Key 3 as CALLBACK_SCHEDULED and record an IvrCallback', async () => {
    const channelId = 'PJSIP-channel-test-103';
    const fakeServer = {
      ariBaseUrl: 'http://127.0.0.1:8088',
      ariUsername: 'asterisk',
      ariPassword: 'StrongPass123',
    };

    mockPrisma.callRecord.findFirst.mockResolvedValue({
      id: 'call-103',
      channelId,
      ivrOrder: {
        id: 'ord-103',
        orderNumber: 'ORD-7777',
        userId: 'cust-1',
        customerPhone: '01812345678',
        flow: {
          confirmKey: '1',
          cancelKey: '2',
          callbackKey: '3',
          transferKey: '0',
          autoCancelPolicy: false,
        },
      },
    });

    await ivrService.handleDtmf(channelId, '3', fakeServer);

    expect(mockPrisma.ivrOrder.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'ord-103' },
        data: expect.objectContaining({
          status: IvrOrderStatus.CALLBACK_SCHEDULED,
          dtmfPressed: '3',
        }),
      }),
    );

    expect(mockPrisma.ivrCallback.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'cust-1',
          orderId: 'ord-103',
          customerPhone: '01812345678',
        }),
      }),
    );
  });
});
