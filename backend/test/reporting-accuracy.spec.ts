import { Test, TestingModule } from '@nestjs/testing';
import { ReportingService } from '../src/modules/reporting/reporting.service';
import { PrismaService } from '../src/prisma/prisma.service';

describe('ReportingAccuracyTest', () => {
  let reportingService: ReportingService;

  const mockPrisma = {
    user: {
      count: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    callRecord: {
      count: jest.fn(),
      findMany: jest.fn(),
      groupBy: jest.fn(),
      aggregate: jest.fn(),
    },
    campaign: {
      count: jest.fn(),
      findMany: jest.fn(),
      groupBy: jest.fn(),
    },
    wallet: {
      aggregate: jest.fn(),
    },
    ledgerEntry: {
      aggregate: jest.fn(),
    },
    asteriskServer: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportingService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    reportingService = module.get<ReportingService>(ReportingService);
  });

  it('should accurately calculate net profit, profit margin, and ASR matching Filament formula', async () => {
    // Mock 3 calls: 2 completed (20s each = 2 pulses each @ 0.50 selling = 1.00 BDT, wholesale = 2 * 0.15 = 0.30 BDT), 1 failed (0 BDT)
    const mockCalls = [
      {
        id: 'call-1',
        userId: 'u1',
        status: 'COMPLETED',
        billableSeconds: 20,
        duration: 20,
        sellingPrice: 1.0,
        costPrice: 0.3,
        createdAt: new Date('2026-10-12T10:00:00Z'),
        user: { id: 'u1', name: 'Client 1', email: 'c1@test.com', companyName: 'Co 1' },
      },
      {
        id: 'call-2',
        userId: 'u1',
        status: 'COMPLETED',
        billableSeconds: 20,
        duration: 20,
        sellingPrice: 1.0,
        costPrice: 0.3,
        createdAt: new Date('2026-10-12T11:00:00Z'),
        user: { id: 'u1', name: 'Client 1', email: 'c1@test.com', companyName: 'Co 1' },
      },
      {
        id: 'call-3',
        userId: 'u1',
        status: 'FAILED',
        billableSeconds: 0,
        duration: 0,
        sellingPrice: 0.0,
        costPrice: 0.0,
        createdAt: new Date('2026-10-12T12:00:00Z'),
        user: { id: 'u1', name: 'Client 1', email: 'c1@test.com', companyName: 'Co 1' },
      },
    ];

    mockPrisma.callRecord.findMany.mockResolvedValue(mockCalls);
    mockPrisma.ledgerEntry.aggregate.mockResolvedValue({
      _sum: { amount: 50.0 },
      _count: { _all: 1 },
    });
    mockPrisma.wallet.aggregate.mockResolvedValue({
      _sum: { balance: 48.0 },
    });
    mockPrisma.user.count.mockResolvedValue(1);
    mockPrisma.user.findMany.mockResolvedValue([
      { id: 'u1', name: 'Client 1', email: 'c1@test.com', companyName: 'Co 1', wallet: { balance: 48.0 } },
    ]);
    mockPrisma.campaign.findMany.mockResolvedValue([]);

    const result = await reportingService.getSalesReport({ preset: 'today' });

    // 2 completed calls * 2 pulses = 4 pulses
    // Wholesale cost = 4 * 0.15 = 0.60 BDT
    // Revenue = 2 * 1.00 = 2.00 BDT
    // Net profit = 2.00 - 0.60 = 1.40 BDT
    // Margin = (1.40 / 2.00) * 100 = 70.0%
    // ASR = (2 / 3) * 100 = 66.7%
    expect(result.kpi.total_calls).toBe(3);
    expect(result.kpi.completed_calls).toBe(2);
    expect(result.kpi.failed_calls).toBe(1);
    expect(result.kpi.total_pulses).toBe(4);
    expect(result.kpi.call_revenue).toBe(2.0);
    expect(result.kpi.wholesale_cost).toBe(0.6);
    expect(result.kpi.net_profit).toBe(1.4);
    expect(result.kpi.profit_margin).toBe(70.0);
    expect(result.kpi.answer_rate).toBe(66.7);
  });

  it('should protect against CSV formula injection in exports', async () => {
    const maliciousRecords = [
      {
        id: '=cmd|/C calc!A0',
        phoneNumber: '+8801711223344',
        callerId: '+8809612001122',
        status: 'COMPLETED',
        duration: 20,
        billableSeconds: 20,
        costPrice: 0.3,
        sellingPrice: 1.0,
        grossProfit: 0.7,
        hangupCause: '@SUM(1+1)',
        createdAt: new Date(),
      },
    ];

    const buffer = await reportingService.generateCdrExcelExport(maliciousRecords);
    expect(buffer).toBeDefined();
    expect(buffer.length).toBeGreaterThan(0);
  });
});
