import { Test, TestingModule } from '@nestjs/testing';
import { IvrService } from '../src/modules/ivr/ivr.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { WalletService } from '../src/modules/wallet/wallet.service';
import { PricingService } from '../src/modules/pricing/pricing.service';
import { RedisService } from '../src/common/redis.service';
import { QueueService } from '../src/modules/queue/queue.service';
import { ForbiddenException } from '@nestjs/common';
import { Role } from '@prisma/client';

describe('TenantIsolationTest', () => {
  let ivrService: IvrService;

  const mockPrisma = {
    ivrOrder: {
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IvrService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: WalletService, useValue: {} },
        { provide: PricingService, useValue: {} },
        { provide: RedisService, useValue: {} },
        { provide: QueueService, useValue: {} },
      ],
    }).compile();

    ivrService = module.get<IvrService>(IvrService);
  });

  it('should strictly scope listOrders to the authenticated customer ID', async () => {
    const customerUser = {
      id: 'customer-alpha',
      role: 'CUSTOMER',
    };

    mockPrisma.ivrOrder.findMany.mockResolvedValue([]);
    mockPrisma.ivrOrder.count.mockResolvedValue(0);

    await ivrService.listOrders(customerUser, {});

    expect(mockPrisma.ivrOrder.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId: 'customer-alpha',
        }),
      }),
    );
  });

  it('should scope listOrders to reseller hierarchy path for resellers', async () => {
    const resellerUser = {
      id: 'reseller-beta',
      role: 'SUB_RESELLER',
      path: 'root/master-1/reseller-beta',
    };

    mockPrisma.ivrOrder.findMany.mockResolvedValue([]);
    mockPrisma.ivrOrder.count.mockResolvedValue(0);

    await ivrService.listOrders(resellerUser, {});

    expect(mockPrisma.ivrOrder.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: [
            { userId: 'reseller-beta' },
            { user: { path: { startsWith: 'root/master-1/reseller-beta' } } },
          ],
        }),
      }),
    );
  });

  it('should throw ForbiddenException if a customer tries to read another customer order', async () => {
    const customerUser = {
      id: 'customer-alpha',
      role: 'CUSTOMER',
    };

    mockPrisma.ivrOrder.findUnique.mockResolvedValue({
      id: 'order-victim',
      userId: 'customer-gamma', // Different user
      orderNumber: 'ORD-SEC-01',
    });

    await expect(ivrService.getOrderById(customerUser, 'order-victim')).rejects.toThrow(
      ForbiddenException,
    );
  });
});
