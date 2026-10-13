import { Test, TestingModule } from '@nestjs/testing';
import { ResellerService } from '../src/modules/reseller/reseller.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { Role, AccountStatus } from '@prisma/client';
import { BadRequestException } from '@nestjs/common';

describe('HierarchyPermissionsTest', () => {
  let resellerService: ResellerService;

  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    $transaction: jest.fn((cb) => cb(mockPrisma)),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ResellerService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    resellerService = module.get<ResellerService>(ResellerService);
  });

  it('should prevent Sub-Reseller from creating Master Reseller (role hierarchy enforcement)', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'sub-reseller-1',
      role: Role.SUB_RESELLER,
      path: '1/2/3',
      depth: 3,
    });

    await expect(
      resellerService.createChild('sub-reseller-1', {
        name: 'Invalid Master',
        email: 'invalid@test.com',
        phone: '+8801700000099',
        password: 'password123',
        role: Role.MASTER_RESELLER, // Disallowed: Sub-Reseller cannot create Master Reseller
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should allow Master Reseller to create Sub-Reseller and calculate correct lineage depth', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'master-1',
      role: Role.MASTER_RESELLER,
      path: '1/2',
      depth: 2,
    });

    mockPrisma.user.findFirst.mockResolvedValue(null); // No collision
    mockPrisma.user.create.mockResolvedValue({
      id: 'new-sub-reseller',
      role: Role.SUB_RESELLER,
      depth: 3,
    });

    const created = await resellerService.createChild('master-1', {
      name: 'Valid Sub Reseller',
      email: 'sub@valid.com',
      phone: '+8801700000088',
      password: 'password123',
      role: Role.SUB_RESELLER,
    });

    expect(created).toBeDefined();
    expect(created.depth).toBe(3);
  });
});
