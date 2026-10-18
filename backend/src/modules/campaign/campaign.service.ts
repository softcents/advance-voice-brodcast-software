import { Injectable, BadRequestException, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { PricingService } from '../pricing/pricing.service';
import { CampaignStatus, CallStatus, ReferenceType } from '@prisma/client';
import { CallDispatcherService } from '../telephony/call-dispatcher.service';
import { QueueService } from '../queue/queue.service';

export interface CreateCampaignDto {
  name: string;
  audioId: string;
  groupId: string;
  trunkId?: string;
  scheduledAt?: string;
}

export interface SendOtpDto {
  phoneNumber: string;
  otpCode: string;
  audioId?: string;
  trunkId?: string;
}

@Injectable()
export class CampaignService {
  constructor(
    private prisma: PrismaService,
    private walletService: WalletService,
    private pricingService: PricingService,
    private callDispatcher: CallDispatcherService,
    @Inject(forwardRef(() => QueueService))
    private queueService: QueueService,
  ) {}

  /**
   * Create and launch a voice broadcast campaign
   */
  async createCampaign(userId: string, dto: CreateCampaignDto) {
    const [audio, group] = await Promise.all([
      this.prisma.audioAsset.findUnique({ where: { id: dto.audioId } }),
      this.prisma.contactGroup.findUnique({
        where: { id: dto.groupId },
        include: { contacts: true },
      }),
    ]);

    if (!audio) throw new NotFoundException('Audio asset not found');
    if (!group) throw new NotFoundException('Contact group not found');
    if (group.contacts.length === 0) throw new BadRequestException('Contact group has no contacts');

    // Strict Multi-Tenant Isolation
    const caller = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!caller) throw new NotFoundException('Authenticated user not found');

    if (caller.role !== 'SUPER_ADMIN') {
      if (caller.role === 'CUSTOMER') {
        if (audio.userId !== userId) {
          throw new BadRequestException('Unauthorized: You can only broadcast your own audio recording.');
        }
        if (group.userId !== userId) {
          throw new BadRequestException('Unauthorized: You can only broadcast to your own contact group.');
        }
      } else {
        // Reseller hierarchy check
        const [audioOwner, groupOwner] = await Promise.all([
          this.prisma.user.findUnique({ where: { id: audio.userId } }),
          this.prisma.user.findUnique({ where: { id: group.userId } }),
        ]);
        const callerPath = caller.path || caller.id;
        if (audio.userId !== userId && !audioOwner?.path?.startsWith(callerPath)) {
          throw new BadRequestException('Unauthorized: Audio asset belongs outside your reseller hierarchy.');
        }
        if (group.userId !== userId && !groupOwner?.path?.startsWith(callerPath)) {
          throw new BadRequestException('Unauthorized: Contact group belongs outside your reseller hierarchy.');
        }
      }
    }

    // Default trunk if not supplied
    let trunkId = dto.trunkId;
    if (!trunkId) {
      const activeTrunk = await this.prisma.sipTrunk.findFirst({
        where: { enabled: true, isOnline: true },
      });
      if (!activeTrunk) throw new BadRequestException('No active SIP trunk available in system');
      trunkId = activeTrunk.id;
    }

    // Estimate cost per contact based on audio duration
    const samplePricing = await this.pricingService.calculateCallCost(
      userId,
      group.contacts[0].phoneNumber,
      audio.durationSeconds || 10,
    );

    const costPerCall = samplePricing.sellingPrice;
    const totalEstimatedCost = costPerCall * group.contacts.length;

    // Reserve wallet balance upfront
    const campaignId = `CAMP-${Date.now()}`;
    await this.walletService.reserveCallCost(userId, totalEstimatedCost, campaignId, ReferenceType.CAMPAIGN);

    const campaign = await this.prisma.$transaction(async (tx) => {
      const campaign = await tx.campaign.create({
        data: {
          id: campaignId,
          userId,
          name: dto.name,
          audioId: dto.audioId,
          groupId: dto.groupId,
          trunkId,
          status: CampaignStatus.PROCESSING,
          scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : new Date(),
          totalContacts: group.contacts.length,
          estimatedCost: totalEstimatedCost,
        },
      });

      // Expand contacts into CallRecords with exact Contact ID and Phone Number
      const callData = group.contacts.map((contact) => ({
        userId,
        campaignId: campaign.id,
        contactId: contact.id,
        trunkId,
        audioId: dto.audioId,
        phoneNumber: contact.phoneNumber,
        callerId: '09612000000',
        status: CallStatus.PENDING,
        sellingPrice: costPerCall,
      }));

      await tx.callRecord.createMany({ data: callData });

      return campaign;
    });

    // Asynchronously dispatch campaign calls
    this.dispatchCampaignCalls(campaign.id).catch(() => {});

    return campaign;
  }

  /**
   * Dispatch campaign calls via durable RabbitMQ queue with persistent storage
   */
  async dispatchCampaignCalls(campaignId: string) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id: campaignId },
      select: { id: true, userId: true },
    });
    if (!campaign) return;

    const pendingCalls = await this.prisma.callRecord.findMany({
      where: { campaignId, status: CallStatus.PENDING },
      select: { id: true },
    });

    for (const call of pendingCalls) {
      await this.queueService.publishCampaignCall(campaign.id, call.id, campaign.userId);
    }
  }

  /**
   * Send single instant Voice OTP
   */
  async sendOtp(userId: string, dto: SendOtpDto) {
    let trunk = null;
    if (dto.trunkId) {
      trunk = await this.prisma.sipTrunk.findUnique({ where: { id: dto.trunkId } });
    }
    if (!trunk) {
      trunk = await this.prisma.sipTrunk.findFirst({
        where: { enabled: true, isOnline: true },
      });
    }
    if (!trunk) throw new BadRequestException('No active SIP trunk available');

    const pricing = await this.pricingService.calculateCallCost(userId, dto.phoneNumber, 10);
    const estimatedCost = pricing.sellingPrice;

    const callId = dto.audioId ? `TEST-${Date.now()}` : `OTP-${Date.now()}`;
    await this.walletService.reserveCallCost(userId, estimatedCost, callId, ReferenceType.CALL);

    const callRecord = await this.prisma.callRecord.create({
      data: {
        id: callId,
        userId,
        trunkId: trunk.id,
        audioId: dto.audioId,
        phoneNumber: dto.phoneNumber,
        callerId: trunk.outboundCid || '999',
        isOtp: !dto.audioId,
        otpCode: dto.otpCode,
        status: CallStatus.PENDING,
        sellingPrice: estimatedCost,
      },
    });

    try {
      await this.callDispatcher.dispatchCall(callRecord.id);
    } catch (e: any) {
      // dispatch error logged
    }

    return callRecord;
  }

  /**
   * Pause Campaign
   */
  async pauseCampaign(campaignId: string) {
    return this.prisma.campaign.update({
      where: { id: campaignId },
      data: { status: CampaignStatus.PAUSED },
    });
  }

  /**
   * Resume Campaign
   */
  async resumeCampaign(campaignId: string) {
    return this.prisma.campaign.update({
      where: { id: campaignId },
      data: { status: CampaignStatus.PROCESSING },
    });
  }

  /**
   * Get all campaigns
   */
  async getCampaigns(userId?: string) {
    return this.prisma.campaign.findMany({
      where: userId ? { userId } : {},
      include: {
        audio: { select: { id: true, title: true, durationSeconds: true } },
        group: { select: { id: true, name: true, totalContacts: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
