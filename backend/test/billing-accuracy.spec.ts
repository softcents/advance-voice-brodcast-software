import { Test, TestingModule } from '@nestjs/testing';
import { PricingService } from '../src/modules/pricing/pricing.service';
import { WalletService } from '../src/modules/wallet/wallet.service';
import { PrismaService } from '../src/prisma/prisma.service';

describe('BillingAccuracyTest', () => {
  let pricingService: PricingService;

  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
    },
    wallet: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    ledgerEntry: {
      create: jest.fn(),
    },
    $transaction: jest.fn((cb) => cb(mockPrisma)),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PricingService,
        WalletService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    pricingService = module.get<PricingService>(PricingService);
  });

  it('should accurately calculate pulses, cost, sell price and reseller margins', async () => {
    // Mock user with 10s pulse rate
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'cust-123',
      pricingPlan: {
        rateCards: [
          {
            id: 'card-1',
            destinationPrefix: 'DEFAULT',
            buyRate: { toNumber: () => 0.15 }, // SP cost
            sellRate: { toNumber: () => 0.30 }, // Customer sell rate
            pulseDuration: 10,
            pulseRate: { toNumber: () => 0.30 },
            isActive: true,
          },
        ],
      },
    });

    // 25 billable seconds should round up to 3 pulses (ceil(25/10) = 3)
    const result = await pricingService.calculateCallCost('cust-123', '+8801712345678', 25);

    expect(result.pulses).toBe(3);
    expect(result.sellingPrice).toBe(0.90); // 3 * 0.30
    expect(result.costPrice).toBe(0.45);    // 3 * 0.15
    expect(result.grossProfit).toBe(0.45);  // 0.90 - 0.45
    expect(result.resellerMargin).toBeCloseTo(0.315); // 70% share of gross profit
  });

  it('should return 0 charges for zero-duration non-connected calls', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'cust-123',
      pricingPlan: {
        rateCards: [
          {
            id: 'card-1',
            destinationPrefix: 'DEFAULT',
            buyRate: { toNumber: () => 0.15 },
            sellRate: { toNumber: () => 0.30 },
            pulseDuration: 10,
            pulseRate: { toNumber: () => 0.30 },
            isActive: true,
          },
        ],
      },
    });

    const result = await pricingService.calculateCallCost('cust-123', '+8801712345678', 0);

    expect(result.pulses).toBe(0);
    expect(result.sellingPrice).toBe(0);
    expect(result.costPrice).toBe(0);
    expect(result.grossProfit).toBe(0);
  });
});
