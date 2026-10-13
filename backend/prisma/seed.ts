import { PrismaClient, Role, AccountStatus, TransactionType, ReferenceType, CallStatus, CampaignStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting comprehensive database seeding...');

  // 1. Password hash
  const defaultPassword = await bcrypt.hash('Secret123!', 10);

  // 2. Clean up existing tables
  await prisma.reportExport.deleteMany();
  await prisma.callRecord.deleteMany();
  await prisma.campaign.deleteMany();
  await prisma.contact.deleteMany();
  await prisma.contactGroup.deleteMany();
  await prisma.audioAsset.deleteMany();
  await prisma.sipTrunk.deleteMany();
  await prisma.asteriskServer.deleteMany();
  await prisma.rateCard.deleteMany();
  await prisma.pricingPlan.deleteMany();
  await prisma.rechargeRequest.deleteMany();
  await prisma.balanceTransfer.deleteMany();
  await prisma.ledgerEntry.deleteMany();
  await prisma.wallet.deleteMany();
  await prisma.user.deleteMany();

  console.log('🧹 Cleaned existing tables.');

  // -------------------------------------------------------------
  // 3. Reseller Hierarchy Setup
  // Super Admin -> Service Provider (SP) -> Master Reseller -> Sub-Reseller -> Customer
  // -------------------------------------------------------------
  const superAdmin = await prisma.user.create({
    data: {
      name: 'Global Super Admin',
      email: 'admin@voicepro.com',
      phone: '+8801700000001',
      passwordHash: defaultPassword,
      role: Role.SUPER_ADMIN,
      companyName: 'VoiceBroadcast Enterprise Inc.',
      status: AccountStatus.ACTIVE,
      path: '1',
      depth: 0,
      creditLimit: 1000000,
      wallet: {
        create: {
          currency: 'BDT',
          balance: 500000.0,
          creditLimit: 1000000.0,
        },
      },
    },
  });

  const serviceProvider = await prisma.user.create({
    data: {
      name: 'Telecom Service Provider (SP)',
      email: 'sp@telecombd.com',
      phone: '+8801700000002',
      passwordHash: defaultPassword,
      role: Role.SERVICE_PROVIDER,
      companyName: 'Dhaka VoIP Telco Ltd.',
      status: AccountStatus.ACTIVE,
      parentId: superAdmin.id,
      path: `${superAdmin.id}/sp`,
      depth: 1,
      creditLimit: 250000,
      wallet: {
        create: {
          currency: 'BDT',
          balance: 150000.0,
          creditLimit: 250000.0,
        },
      },
    },
  });

  const masterReseller = await prisma.user.create({
    data: {
      name: 'Prime Master Reseller',
      email: 'master@reseller.com',
      phone: '+8801700000003',
      passwordHash: defaultPassword,
      role: Role.MASTER_RESELLER,
      companyName: 'Prime Voice Solutions',
      status: AccountStatus.ACTIVE,
      parentId: serviceProvider.id,
      path: `${superAdmin.id}/sp/master`,
      depth: 2,
      creditLimit: 50000,
      wallet: {
        create: {
          currency: 'BDT',
          balance: 35000.0,
          creditLimit: 50000.0,
        },
      },
    },
  });

  const subReseller = await prisma.user.create({
    data: {
      name: 'FastDial Sub-Reseller',
      email: 'sub@reseller.com',
      phone: '+8801700000004',
      passwordHash: defaultPassword,
      role: Role.SUB_RESELLER,
      companyName: 'FastDial Agency',
      status: AccountStatus.ACTIVE,
      parentId: masterReseller.id,
      path: `${superAdmin.id}/sp/master/sub`,
      depth: 3,
      creditLimit: 10000,
      wallet: {
        create: {
          currency: 'BDT',
          balance: 8500.0,
          creditLimit: 10000.0,
        },
      },
    },
  });

  const customer = await prisma.user.create({
    data: {
      name: 'Apex Retailer Customer',
      email: 'client@demo.com',
      phone: '+8801700000005',
      passwordHash: defaultPassword,
      role: Role.CUSTOMER,
      companyName: 'Apex Electronics BD',
      status: AccountStatus.ACTIVE,
      parentId: subReseller.id,
      path: `${superAdmin.id}/sp/master/sub/customer`,
      depth: 4,
      creditLimit: 0,
      wallet: {
        create: {
          currency: 'BDT',
          balance: 2450.0,
          creditLimit: 0.0,
        },
      },
    },
  });

  console.log('✅ Created 5-tier Reseller Hierarchy with Wallets.');

  // -------------------------------------------------------------
  // 4. Pricing Plans & Rate Cards (Buy/Sell, Pulse, Margins)
  // -------------------------------------------------------------
  const spPlan = await prisma.pricingPlan.create({
    data: {
      name: 'Telco Standard Wholesale 10s',
      description: 'Standard wholesale pulse plan with 10s billing increment',
      creatorId: serviceProvider.id,
      isDefault: true,
      rateCards: {
        create: [
          {
            destinationPrefix: 'DEFAULT',
            destinationName: 'All Bangladesh Operators (GP/BL/Robi/Teletalk)',
            buyRate: 0.12, // SP costs 0.12 BDT per 10s pulse from Telco
            sellRate: 0.20, // SP sells to Master Reseller at 0.20 BDT
            pulseDuration: 10,
            pulseRate: 0.20,
            isActive: true,
          },
        ],
      },
    },
  });

  const resellerPlan = await prisma.pricingPlan.create({
    data: {
      name: 'Reseller Commercial Retail 10s',
      description: 'Retail markup plan for end-customers and sub-resellers',
      creatorId: masterReseller.id,
      isDefault: false,
      rateCards: {
        create: [
          {
            destinationPrefix: 'DEFAULT',
            destinationName: 'All Bangladesh Operators',
            buyRate: 0.20, // Master reseller cost
            sellRate: 0.35, // Charged to end customers
            pulseDuration: 10,
            pulseRate: 0.35,
            isActive: true,
          },
        ],
      },
    },
  });

  // Assign plans
  await prisma.user.update({
    where: { id: masterReseller.id },
    data: { pricingPlanId: spPlan.id },
  });
  await prisma.user.update({
    where: { id: customer.id },
    data: { pricingPlanId: resellerPlan.id },
  });

  console.log('✅ Configured Pricing Plans & Rate Cards with Buy/Sell Margins.');

  // -------------------------------------------------------------
  // 5. Asterisk Servers & SIP Trunks
  // -------------------------------------------------------------
  const asteriskServer = await prisma.asteriskServer.create({
    data: {
      name: 'Production Asterisk Cloud-01',
      ariBaseUrl: 'http://103.234.119.204:8088',
      ariUsername: 'asterisk',
      ariPassword: 'StrongPass123',
      maxConcurrency: 120,
      activeChannels: 4,
      isOnline: true,
      enabled: true,
    },
  });

  const trunk1 = await prisma.sipTrunk.create({
    data: {
      serverId: asteriskServer.id,
      name: 'GP-VOIP-TRUNK-01',
      host: '103.234.119.204',
      outboundCid: '+8809612001122',
      maxConcurrency: 60,
      activeCalls: 2,
      isOnline: true,
      enabled: true,
    },
  });

  const trunk2 = await prisma.sipTrunk.create({
    data: {
      serverId: asteriskServer.id,
      name: 'ROBI-VOIP-TRUNK-02',
      host: '103.234.119.205',
      outboundCid: '+8809612003344',
      maxConcurrency: 40,
      activeCalls: 1,
      isOnline: true,
      enabled: true,
    },
  });

  console.log('✅ Configured Asterisk ARI Server and SIP Trunks.');

  // -------------------------------------------------------------
  // 6. Audio Assets & Contact Groups
  // -------------------------------------------------------------
  const audio1 = await prisma.audioAsset.create({
    data: {
      userId: customer.id,
      title: 'Eid Mega Sale Promo (Bangla)',
      originalPath: 'audio/promos/eid_sale_original.mp3',
      convertedPath: 'audio/converted/eid_sale_8k_pcm.wav',
      durationSeconds: 28,
      isTTS: false,
      isApproved: true,
    },
  });

  const audio2 = await prisma.audioAsset.create({
    data: {
      userId: customer.id,
      title: 'Customer Authentication Voice OTP',
      originalPath: 'audio/otp/auth_otp.wav',
      convertedPath: 'audio/converted/auth_otp_8k_pcm.wav',
      durationSeconds: 12,
      isTTS: true,
      ttsText: 'আপনার ওটিপি কোডটি হলো...',
      language: 'bn-BD',
      isApproved: true,
    },
  });

  const group1 = await prisma.contactGroup.create({
    data: {
      userId: customer.id,
      name: 'Dhaka VIP Customers',
      totalContacts: 10,
    },
  });

  const sampleNumbers = [
    '+8801711223344',
    '+8801819283746',
    '+8801912345678',
    '+8801671122334',
    '+8801552345678',
    '+8801733445566',
    '+8801844556677',
    '+8801955667788',
    '+8801688990011',
    '+8801722334455',
  ];

  for (let i = 0; i < sampleNumbers.length; i++) {
    await prisma.contact.create({
      data: {
        groupId: group1.id,
        name: `VIP Customer ${i + 1}`,
        phoneNumber: sampleNumbers[i],
      },
    });
  }

  // -------------------------------------------------------------
  // 7. Realistic Campaigns, Calls (CDR), and Financial Ledgers
  // -------------------------------------------------------------
  const customerWallet = await prisma.wallet.findUnique({ where: { userId: customer.id } });

  // Initial recharge ledger
  await prisma.ledgerEntry.create({
    data: {
      walletId: customerWallet!.id,
      userId: customer.id,
      type: TransactionType.CREDIT,
      amount: 3000.0,
      balanceBefore: 0.0,
      balanceAfter: 3000.0,
      referenceType: ReferenceType.RECHARGE,
      referenceId: 'REC-INIT-001',
      idempotencyKey: 'IDEMP-REC-001',
      description: 'Initial Wallet Balance Recharge via bKash',
    },
  });

  const campaign = await prisma.campaign.create({
    data: {
      userId: customer.id,
      name: 'Eid Mega Discount Voice Broadcast',
      audioId: audio1.id,
      groupId: group1.id,
      trunkId: trunk1.id,
      status: CampaignStatus.COMPLETED,
      totalContacts: 10,
      processedCalls: 10,
      answeredCalls: 8,
      failedCalls: 2,
      totalDuration: 224, // 224 billable seconds across 8 connected calls
      estimatedCost: 10.5,
      actualCost: 8.4,
      resellerProfit: 3.36,
    },
  });

  const statuses = [
    { status: CallStatus.COMPLETED, duration: 28, billable: 28, cause: 'NORMAL_CLEARING' },
    { status: CallStatus.COMPLETED, duration: 30, billable: 30, cause: 'NORMAL_CLEARING' },
    { status: CallStatus.COMPLETED, duration: 25, billable: 25, cause: 'NORMAL_CLEARING' },
    { status: CallStatus.COMPLETED, duration: 28, billable: 28, cause: 'NORMAL_CLEARING' },
    { status: CallStatus.COMPLETED, duration: 29, billable: 29, cause: 'NORMAL_CLEARING' },
    { status: CallStatus.COMPLETED, duration: 27, billable: 27, cause: 'NORMAL_CLEARING' },
    { status: CallStatus.COMPLETED, duration: 28, billable: 28, cause: 'NORMAL_CLEARING' },
    { status: CallStatus.COMPLETED, duration: 29, billable: 29, cause: 'NORMAL_CLEARING' },
    { status: CallStatus.BUSY, duration: 0, billable: 0, cause: 'USER_BUSY' },
    { status: CallStatus.NO_ANSWER, duration: 0, billable: 0, cause: 'NO_ANSWER' },
  ];

  let currentCustomerBal = 3000.0;

  for (let i = 0; i < sampleNumbers.length; i++) {
    const item = statuses[i];
    const pulses = Math.ceil(item.billable / 10);
    const costPrice = pulses * 0.20; // Master reseller cost
    const sellingPrice = item.billable > 0 ? pulses * 0.35 : 0.0;
    const profit = sellingPrice - costPrice;

    const callRecord = await prisma.callRecord.create({
      data: {
        userId: customer.id,
        campaignId: campaign.id,
        trunkId: trunk1.id,
        audioId: audio1.id,
        phoneNumber: sampleNumbers[i],
        callerId: trunk1.outboundCid || '+8809612001122',
        uniqueId: `asterisk-171999.${1000 + i}`,
        channelId: `PJSIP/${trunk1.name}-0000000${i}`,
        status: item.status,
        hangupCause: item.cause,
        initiatedAt: new Date(Date.now() - (600 - i * 30) * 1000),
        answeredAt: item.billable > 0 ? new Date(Date.now() - (590 - i * 30) * 1000) : null,
        endedAt: new Date(Date.now() - (560 - i * 30) * 1000),
        duration: item.duration,
        billableSeconds: item.billable,
        costPrice: costPrice,
        sellingPrice: sellingPrice,
        grossProfit: profit,
        resellerMargin: profit * 0.6,
      },
    });

    if (sellingPrice > 0) {
      const beforeBal = currentCustomerBal;
      currentCustomerBal -= sellingPrice;

      await prisma.ledgerEntry.create({
        data: {
          walletId: customerWallet!.id,
          userId: customer.id,
          type: TransactionType.DEBIT,
          amount: sellingPrice,
          balanceBefore: beforeBal,
          balanceAfter: currentCustomerBal,
          referenceType: ReferenceType.CALL,
          referenceId: callRecord.id,
          idempotencyKey: `IDEMP-CALL-${callRecord.id}`,
          description: `Call charge for ${sampleNumbers[i]} (${item.billable}s / ${pulses} pulses)`,
        },
      });
    }
  }

  // Update customer wallet balance
  await prisma.wallet.update({
    where: { userId: customer.id },
    data: { balance: currentCustomerBal },
  });

  console.log('✅ Generated Sample CDR Records, Campaigns & Double-Entry Ledger Entries.');
  console.log('🎉 Seeding successfully finished!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
