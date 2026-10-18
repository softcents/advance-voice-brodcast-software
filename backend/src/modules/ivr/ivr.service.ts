import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { PricingService } from '../pricing/pricing.service';
import { RedisService } from '../../common/redis.service';
import { QueueService } from '../queue/queue.service';
import { AsteriskAriService } from '../telephony/asterisk-ari.service';
import { IvrOrderStatus, ReferenceType, CallStatus, Role } from '@prisma/client';
import axios from 'axios';
import * as crypto from 'crypto';

export interface DispatchIvrOrderDto {
  orderNumber: string;
  customerName?: string;
  customerPhone: string;
  orderAmount?: number;
  currency?: string;
  itemsSummary?: string;
  metadata?: any;
  flowId?: string;
  webhookUrl?: string;
  trunkId?: string;
}

@Injectable()
export class IvrService {
  private readonly logger = new Logger(IvrService.name);

  constructor(
    private prisma: PrismaService,
    private walletService: WalletService,
    private pricingService: PricingService,
    private redisService: RedisService,
    @Inject(forwardRef(() => QueueService))
    private queueService: QueueService,
    @Inject(forwardRef(() => AsteriskAriService))
    private ariService: AsteriskAriService,
  ) {}

  /**
   * Dispatch Outbound IVR Order Confirmation Call
   */
  async dispatchOrderCall(userId: string, dto: DispatchIvrOrderDto) {
    if (!dto.orderNumber || !dto.customerPhone) {
      throw new BadRequestException('Order number and customer phone number are required');
    }

    // Clean phone number (e.g. "017XXXXXXXX" or "88017XXXXXXXX")
    const cleanPhone = dto.customerPhone.replace(/[^0-9]/g, '');
    if (cleanPhone.length < 10) {
      throw new BadRequestException('Invalid phone number format');
    }

    // Check user & tenant permissions
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { wallet: true },
    });
    if (!user) throw new NotFoundException('User not found');

    // 1. Resolve IVR Flow
    let flow: any = null;
    if (dto.flowId) {
      flow = await this.prisma.ivrFlow.findFirst({
        where: { id: dto.flowId, userId },
        include: { welcomeAudio: true, confirmAudio: true, cancelAudio: true, callbackAudio: true },
      });
    }
    if (!flow) {
      flow = await this.prisma.ivrFlow.findFirst({
        where: { userId, isActive: true },
        include: { welcomeAudio: true, confirmAudio: true, cancelAudio: true, callbackAudio: true },
      });
    }

    // If no custom flow exists, create a default Bengali Outbound IVR Flow
    if (!flow) {
      flow = await this.prisma.ivrFlow.create({
        data: {
          userId,
          name: 'Live Agent Forwarding (1: Forward to 01713252758, 2: Hangup)',
          description: '১ চাপলে কল ফরওয়ার্ড হবে ০১৭১৩২৫২৭৫৮ নম্বরে, ২ চাপলে কল কেটে যাবে',
          welcomeTtsText: 'আসসালামু আলাইকুম। আমাদের প্রতিনিধির সাথে সরাসরি কথা বলতে ১ চাপুন, অথবা কলটি কেটে দিতে ২ চাপুন।',
          confirmKey: '9',
          cancelKey: '2',
          callbackKey: '3',
          transferKey: '1',
          transferDestination: '01713252758',
          maxRepeats: 2,
          timeoutSeconds: 6,
          autoCancelPolicy: true,
          isDefault: true,
          isActive: true,
        },
      });
    }

    // 2. Select SIP Trunk & Caller ID
    const trunk = dto.trunkId
      ? await this.prisma.sipTrunk.findFirst({ where: { id: dto.trunkId, enabled: true } })
      : (await this.prisma.sipTrunk.findFirst({ where: { name: 'bdpbx-999', enabled: true } }))
        || (await this.prisma.sipTrunk.findFirst({ where: { enabled: true, isOnline: true } }));

    if (!trunk) {
      throw new BadRequestException('No available or active SIP Trunk found for outbound call dispatch');
    }

    const callerId = await this.prisma.callerId.findFirst({
      where: { sipTrunkId: trunk.id, enabled: true },
    }) || await this.prisma.callerId.findFirst({ where: { enabled: true } });

    const callerName = callerId?.callerName || trunk.name || 'Order Support';
    const callerNumber = callerId?.callerNumber || trunk.outboundCid || '999';

    // 3. Pricing Calculation & Balance Reservation upfront
    const estimatedSeconds = 45; // Standard IVR prompt + customer DTMF deliberation window
    const pricing = await this.pricingService.calculateCallCost(userId, cleanPhone, estimatedSeconds);

    await this.walletService.reserveCallCost(
      userId,
      Number(pricing.sellingPrice),
      dto.orderNumber,
      ReferenceType.CALL,
    );

    // 4. Create IvrOrder Record
    const order = await this.prisma.ivrOrder.create({
      data: {
        userId,
        resellerId: user.parentId,
        orderNumber: dto.orderNumber,
        customerName: dto.customerName || 'Valued Customer',
        customerPhone: cleanPhone,
        orderAmount: dto.orderAmount || 0,
        currency: dto.currency || 'BDT',
        itemsSummary: dto.itemsSummary,
        metadata: dto.metadata,
        flowId: flow.id,
        webhookUrl: dto.webhookUrl,
        status: IvrOrderStatus.CALLING,
        attempts: 1,
        lastAttemptAt: new Date(),
      },
    });

    // 5. Create CallRecord linked with IvrOrder
    const callRecord = await this.prisma.callRecord.create({
      data: {
        userId,
        phoneNumber: cleanPhone,
        callerId: `${callerName} <${callerNumber}>`,
        trunkId: trunk.id,
        ivrOrderId: order.id,
        audioId: flow.welcomeAudioId || undefined,
        status: CallStatus.INITIATED,
        initiatedAt: new Date(),
        costPrice: pricing.costPrice,
        sellingPrice: pricing.sellingPrice,
        grossProfit: pricing.grossProfit,
        resellerMargin: pricing.resellerMargin,
      },
    });

    // 6. Originate Call via Asterisk ARI
    const server = await this.prisma.asteriskServer.findFirst({ where: { enabled: true } });
    if (!server) {
      throw new BadRequestException('No active Asterisk server found in system');
    }

    const auth = Buffer.from(`${server.ariUsername}:${server.ariPassword}`).toString('base64');
    const dialPhone = cleanPhone.startsWith('01') && cleanPhone.length === 11
      ? `+88${cleanPhone}`
      : (cleanPhone.startsWith('8801') ? `+${cleanPhone}` : cleanPhone);
    const endpoint = `PJSIP/${dialPhone}@${trunk.name}`;

    try {
      this.logger.log(`📞 Originating Outbound IVR Call for Order #${dto.orderNumber} to ${dialPhone} via ${trunk.name}`);
      const resp = await axios.post(
        `${server.ariBaseUrl}/ari/channels`,
        null,
        {
          params: {
            endpoint,
            app: 'VoiceProStasis',
            callerId: `${callerName} <${callerNumber}>`,
            appArgs: `IVR_ORDER,${callRecord.id},${order.id}`,
            timeout: 60,
          },
          headers: {
            Authorization: `Basic ${auth}`,
          },
        },
      );

      const returnedId = resp.data?.id;
      const returnedLinkedId = resp.data?.linkedid || returnedId;

      await this.prisma.callRecord.update({
        where: { id: callRecord.id },
        data: {
          channelId: returnedId,
          uniqueId: returnedId,
          linkedId: returnedLinkedId,
        },
      });

      // Update trunk concurrency counters
      await this.prisma.sipTrunk.update({
        where: { id: trunk.id },
        data: { activeCalls: { increment: 1 } },
      });

      return {
        success: true,
        orderId: order.id,
        callId: callRecord.id,
        channelId: returnedId,
        orderNumber: dto.orderNumber,
        status: IvrOrderStatus.CALLING,
      };
    } catch (err: any) {
      this.logger.error(`Asterisk origination failed for order #${dto.orderNumber}: ${err.message}`);
      await this.prisma.ivrOrder.update({
        where: { id: order.id },
        data: { status: IvrOrderStatus.FAILED, notes: `Origination failure: ${err.message}` },
      });
      await this.prisma.callRecord.update({
        where: { id: callRecord.id },
        data: { status: CallStatus.FAILED, hangupCause: 'ORIGINATION_FAILED' },
      });
      throw new BadRequestException(`Asterisk call origination failed: ${err.message}`);
    }
  }

  /**
   * Handle incoming DTMF key press from Asterisk ARI
   */
  async handleDtmf(channelId: string, digit: string, server: any) {
    this.logger.log(`🎹 DTMF Key Pressed: '${digit}' on channel: ${channelId}`);

    // Lookup CallRecord
    const call = await this.prisma.callRecord.findFirst({
      where: { OR: [{ channelId }, { uniqueId: channelId }] },
      include: {
        ivrOrder: {
          include: {
            flow: {
              include: {
                welcomeAudio: true,
                confirmAudio: true,
                cancelAudio: true,
                callbackAudio: true,
              },
            },
          },
        },
        trunk: true,
      },
    });

    if (!call || !call.ivrOrder || !call.ivrOrder.flow) {
      this.logger.warn(`No active IVR Order associated with DTMF on channel ${channelId}`);
      return;
    }

    const order = call.ivrOrder;
    const flow = order.flow;
    const auth = Buffer.from(`${server.ariUsername}:${server.ariPassword}`).toString('base64');
    const axiosHeaders = { Authorization: `Basic ${auth}` };

    // Stop current playback to give instant feedback
    try {
      await axios.delete(`${server.ariBaseUrl}/ari/channels/${channelId}/play`, {
        headers: axiosHeaders,
      });
    } catch {
      // ignore
    }

    const rawTransferDest = (flow.transferDestination && flow.transferDestination.trim()) || '01713252758';

    // 1. Check for Live Agent Transfer (Key 1 or configured transferKey)
    if (digit === flow.transferKey || (digit === '1' && (flow.transferKey === '1' || rawTransferDest))) {
      // -------------------------------------------------------------
      // Press 1 (or configured transferKey): Live Agent Forwarding (Incoming Call Bridge to 01713252758)
      // -------------------------------------------------------------
      this.logger.log(`👤 Customer pressed Key ${digit} for AGENT TRANSFER to ${rawTransferDest} on channel ${channelId} for Order #${order.orderNumber}`);

      await this.prisma.ivrOrder.update({
        where: { id: order.id },
        data: {
          dtmfPressed: digit,
          notes: `Call forwarding initiated to ${rawTransferDest} via Key ${digit}`,
        },
      });

      // 1. Resolve agent target endpoint
      let targetEndpoint = '';

      if (rawTransferDest.includes('/') || rawTransferDest.includes('@')) {
        targetEndpoint = rawTransferDest;
      } else if (rawTransferDest.length <= 5 && /^\d+$/.test(rawTransferDest)) {
        targetEndpoint = `PJSIP/${rawTransferDest}`;
      } else {
        let cleanDest = rawTransferDest.replace(/[^0-9]/g, '');
        const dialDest = cleanDest.startsWith('01') && cleanDest.length === 11
          ? `+88${cleanDest}`
          : (cleanDest.startsWith('8801') ? `+${cleanDest}` : cleanDest);
        let trunkName = call.trunk?.name;
        if (!trunkName) {
          const activeTrunk =
            (await this.prisma.sipTrunk.findFirst({ where: { name: 'bdpbx-999', enabled: true } })) ||
            (await this.prisma.sipTrunk.findFirst({ where: { enabled: true, isOnline: true } }));
          trunkName = activeTrunk?.name || 'bdpbx-999';
        }
        targetEndpoint = `PJSIP/${dialDest}@${trunkName}`;
      }

      try {
        // 2. Create Asterisk mixing bridge
        const bridgeRes = await axios.post(
          `${server.ariBaseUrl}/ari/bridges`,
          null,
          {
            params: {
              type: 'mixing',
              name: `transfer-${order.id}-${Date.now()}`,
            },
            headers: axiosHeaders,
          },
        );
        const bridgeId = bridgeRes.data?.id;

        // 3. Add customer channel to mixing bridge
        await axios.post(
          `${server.ariBaseUrl}/ari/bridges/${bridgeId}/addChannel`,
          null,
          {
            params: { channel: channelId },
            headers: axiosHeaders,
          },
        );

        // 4. Send ringing indication to customer so they hear ringing while agent phone rings
        try {
          await axios.post(`${server.ariBaseUrl}/ari/channels/${channelId}/ring`, null, {
            headers: axiosHeaders,
          });
        } catch {}

        // 5. Originate call to agent (01713252758)
        const outboundCid = call.trunk?.outboundCid || '999';
        const agentCallerId = `Customer <${outboundCid}>`;

        this.logger.log(`📞 Calling representative at ${targetEndpoint} to forward customer ${order.customerPhone} (Order #${order.orderNumber})`);

        const originateRes = await axios.post(
          `${server.ariBaseUrl}/ari/channels`,
          null,
          {
            params: {
              endpoint: targetEndpoint,
              app: 'VoiceProStasis',
              appArgs: `AGENT_TRANSFER,${bridgeId},${channelId},${order.id}`,
              callerId: agentCallerId,
              timeout: 60,
            },
            headers: axiosHeaders,
          },
        );

        const agentChannelId = originateRes.data?.id;
        this.logger.log(`Agent channel originated: ${agentChannelId} for Bridge ${bridgeId}`);

        // 6. Register active bridge transfer session in AsteriskAriService
        this.ariService.registerBridgeTransfer({
          bridgeId,
          customerChannelId: channelId,
          agentChannelId,
          orderId: order.id,
          server,
        });

        await this.prisma.ivrOrder.update({
          where: { id: order.id },
          data: {
            notes: `Forwarding: Calling agent (${rawTransferDest})`,
          },
        });

        this.dispatchWebhook(order.id, 'CALL_FORWARDING_INITIATED');
      } catch (transferErr: any) {
        this.logger.error(`Failed to initiate agent transfer on channel ${channelId}: ${transferErr.message}`);
        try {
          await axios.delete(`${server.ariBaseUrl}/ari/channels/${channelId}/ring`, { headers: axiosHeaders });
        } catch {}
        await this.playAudioOnChannel(server, channelId, `sound:sounds/no-agent-available`, axiosHeaders);
        setTimeout(async () => {
          try {
            await axios.delete(`${server.ariBaseUrl}/ari/channels/${channelId}`, { headers: axiosHeaders });
          } catch {}
        }, 3000);
      }
    } else if (digit === flow.cancelKey || digit === '2') {
      // -------------------------------------------------------------
      // Press 2: Immediate Hangup & Cancellation ("কেটে যাবে")
      // -------------------------------------------------------------
      this.logger.log(`🛑 Customer pressed Key ${digit} (Hangup/Cancel) on channel ${channelId}. Disconnecting immediately.`);

      await this.prisma.ivrOrder.update({
        where: { id: order.id },
        data: {
          status: IvrOrderStatus.CANCELLED,
          dtmfPressed: digit,
          cancelledAt: new Date(),
          notes: 'Call ended by customer via Key 2',
        },
      });

      // Disconnect channel immediately as requested ("কেটে যাবে")
      try {
        await axios.delete(`${server.ariBaseUrl}/ari/channels/${channelId}`, { headers: axiosHeaders });
      } catch (err: any) {
        this.logger.warn(`Could not hangup channel ${channelId}: ${err.message}`);
      }

      this.dispatchWebhook(order.id, 'ORDER_CANCELLED');
    } else if (digit === flow.confirmKey) {
      // -------------------------------------------------------------
      // Press 9 / Confirm Key: Confirm Order
      // -------------------------------------------------------------
      this.logger.log(`✅ Customer CONFIRMED Order #${order.orderNumber} via DTMF ${digit}`);

      await this.prisma.ivrOrder.update({
        where: { id: order.id },
        data: {
          status: IvrOrderStatus.CONFIRMED,
          dtmfPressed: digit,
          confirmedAt: new Date(),
        },
      });

      // Play Confirmation Audio / TTS
      if (flow.confirmAudio?.convertedPath) {
        const soundName = flow.confirmAudio.convertedPath.replace(/\.wav$/i, '');
        await this.playAudioOnChannel(server, channelId, `sound:${soundName}`, axiosHeaders);
      } else {
        await this.playAudioOnChannel(server, channelId, `sound:sounds/order-confirmed`, axiosHeaders);
      }

      setTimeout(async () => {
        try {
          await axios.delete(`${server.ariBaseUrl}/ari/channels/${channelId}`, { headers: axiosHeaders });
        } catch {}
      }, 4000);

      this.dispatchWebhook(order.id, 'ORDER_CONFIRMED');
    } else if (digit === flow.callbackKey) {
      // -------------------------------------------------------------
      // Press 3: Schedule Callback
      // -------------------------------------------------------------
      this.logger.log(`📅 Customer REQUESTED CALLBACK for Order #${order.orderNumber} via DTMF 3`);

      const scheduledTime = new Date(Date.now() + 30 * 60 * 1000); // 30 mins later
      await this.prisma.ivrOrder.update({
        where: { id: order.id },
        data: {
          status: IvrOrderStatus.CALLBACK_SCHEDULED,
          dtmfPressed: '3',
        },
      });

      await this.prisma.ivrCallback.create({
        data: {
          userId: order.userId,
          orderId: order.id,
          customerPhone: order.customerPhone,
          scheduledAt: scheduledTime,
          notes: `Callback scheduled via Outbound IVR keypad selection for Order #${order.orderNumber}`,
        },
      });

      if (flow.callbackAudio?.convertedPath) {
        const soundName = flow.callbackAudio.convertedPath.replace(/\.wav$/i, '');
        await this.playAudioOnChannel(server, channelId, `sound:${soundName}`, axiosHeaders);
      } else {
        await this.playAudioOnChannel(server, channelId, `sound:sounds/callback-scheduled`, axiosHeaders);
      }

      setTimeout(async () => {
        try {
          await axios.delete(`${server.ariBaseUrl}/ari/channels/${channelId}`, { headers: axiosHeaders });
        } catch {}
      }, 4000);

      this.dispatchWebhook(order.id, 'CALLBACK_SCHEDULED');
      // End of DTMF processing
    } else {
      // Invalid input
      this.logger.warn(`Invalid DTMF '${digit}' received on channel ${channelId}`);
      await this.playAudioOnChannel(server, channelId, `sound:sounds/invalid-input`, axiosHeaders);
    }
  }

  private async playAudioOnChannel(server: any, channelId: string, media: string, headers: any) {
    try {
      await axios.post(
        `${server.ariBaseUrl}/ari/channels/${channelId}/play`,
        null,
        {
          params: { media },
          headers,
        },
      );
    } catch (e: any) {
      this.logger.warn(`Playback warning on channel ${channelId}: ${e.message}`);
    }
  }

  /**
   * Merchant Webhook Dispatcher with HMAC Signature
   */
  async dispatchWebhook(orderId: string, event: string) {
    const order = await this.prisma.ivrOrder.findUnique({
      where: { id: orderId },
      include: { user: true },
    });
    if (!order || !order.webhookUrl) return;

    const payload = {
      event,
      timestamp: new Date().toISOString(),
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        orderAmount: order.orderAmount,
        currency: order.currency,
        status: order.status,
        dtmfPressed: order.dtmfPressed,
        confirmedAt: order.confirmedAt,
        cancelledAt: order.cancelledAt,
        metadata: order.metadata,
      },
    };

    // Calculate HMAC SHA-256 signature
    const secret = process.env.JWT_SECRET || 'voice-pro-secret';
    const signature = crypto.createHmac('sha256', secret).update(JSON.stringify(payload)).digest('hex');

    // Enqueue webhook dispatch via RabbitMQ with exponential backoff & DLQ
    try {
      const enqueued = await this.queueService.publishWebhook(order.id, event, payload, 1);
      if (enqueued) {
        this.logger.log(`📥 Webhook job enqueued into RabbitMQ for Order #${order.orderNumber}`);
        return;
      }
    } catch (e: any) {
      this.logger.warn(`Queue publish warning: ${e.message}. Falling back to direct HTTP delivery.`);
    }

    // Direct HTTP fallback if Queue offline
    try {
      this.logger.log(`🚀 Dispatching merchant webhook directly to ${order.webhookUrl} for Order #${order.orderNumber}`);
      const res = await axios.post(order.webhookUrl, payload, {
        headers: {
          'Content-Type': 'application/json',
          'X-VoicePro-Signature': signature,
          'X-VoicePro-Event': event,
        },
        timeout: 10000,
      });

      await this.prisma.ivrOrder.update({
        where: { id: order.id },
        data: {
          webhookStatus: 'DELIVERED',
          webhookAttempts: { increment: 1 },
          webhookResponse: `Status: ${res.status}`,
        },
      });
    } catch (err: any) {
      this.logger.warn(`Webhook delivery failed for Order #${order.orderNumber}: ${err.message}`);
      await this.prisma.ivrOrder.update({
        where: { id: order.id },
        data: {
          webhookStatus: 'FAILED',
          webhookAttempts: { increment: 1 },
          webhookResponse: err.message,
        },
      });
    }
  }

  /**
   * List orders with tenant scoping
   */
  async listOrders(user: any, query: { status?: IvrOrderStatus; search?: string; page?: number; limit?: number }) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    // Tenant Isolation
    if (user.role === Role.CUSTOMER) {
      where.userId = user.id;
    } else if (user.role === Role.MASTER_RESELLER || user.role === Role.SUB_RESELLER) {
      where.OR = [
        { userId: user.id },
        { user: { path: { startsWith: user.path } } },
      ];
    }
    // SUPER_ADMIN has platform-wide visibility

    if (query.status) {
      where.status = query.status;
    }

    if (query.search) {
      where.OR = [
        { orderNumber: { contains: query.search, mode: 'insensitive' } },
        { customerPhone: { contains: query.search } },
        { customerName: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [total, items] = await Promise.all([
      this.prisma.ivrOrder.count({ where }),
      this.prisma.ivrOrder.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          flow: { select: { id: true, name: true } },
          callRecords: {
            select: {
              id: true,
              status: true,
              duration: true,
              billableSeconds: true,
              sellingPrice: true,
              answeredAt: true,
              hangupCause: true,
            },
          },
        },
      }),
    ]);

    return {
      items,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get single order detail
   */
  async getOrderById(user: any, orderId: string) {
    const order = await this.prisma.ivrOrder.findUnique({
      where: { id: orderId },
      include: {
        user: { select: { id: true, name: true, email: true } },
        flow: true,
        callRecords: true,
        callbacks: true,
      },
    });

    if (!order) throw new NotFoundException('Order not found');

    // Tenant authorization check
    if (user.role === Role.CUSTOMER && order.userId !== user.id) {
      throw new ForbiddenException('Access denied to this order record');
    }

    return order;
  }

  /**
   * List IVR Flows
   */
  async listFlows(userId: string) {
    return this.prisma.ivrFlow.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        welcomeAudio: { select: { id: true, title: true, durationSeconds: true } },
        confirmAudio: { select: { id: true, title: true } },
        cancelAudio: { select: { id: true, title: true } },
      },
    });
  }

  /**
   * Create or update IVR Flow
   */
  async saveFlow(userId: string, data: any) {
    if (data.id) {
      const existing = await this.prisma.ivrFlow.findFirst({ where: { id: data.id, userId } });
      if (!existing) throw new NotFoundException('IVR flow not found');

      return this.prisma.ivrFlow.update({
        where: { id: data.id },
        data: {
          name: data.name,
          description: data.description,
          welcomeAudioId: data.welcomeAudioId || null,
          welcomeTtsText: data.welcomeTtsText,
          confirmAudioId: data.confirmAudioId || null,
          confirmTtsText: data.confirmTtsText,
          cancelAudioId: data.cancelAudioId || null,
          cancelTtsText: data.cancelTtsText,
          callbackAudioId: data.callbackAudioId || null,
          callbackTtsText: data.callbackTtsText,
          confirmKey: data.confirmKey || '9',
          cancelKey: data.cancelKey || '2',
          callbackKey: data.callbackKey || '3',
          transferKey: data.transferKey || '1',
          transferDestination: data.transferDestination || '01713252758',
          maxRepeats: data.maxRepeats || 2,
          timeoutSeconds: data.timeoutSeconds || 6,
          autoCancelPolicy: Boolean(data.autoCancelPolicy),
          fallbackAction: data.fallbackAction || 'HANGUP',
          isActive: data.isActive !== undefined ? Boolean(data.isActive) : true,
        },
      });
    }

    return this.prisma.ivrFlow.create({
      data: {
        userId,
        name: data.name || 'Live Agent Forwarding (1: Forward to 01713252758, 2: Hangup)',
        description: data.description || '১ চাপলে কল ফরওয়ার্ড হবে ০১৭১৩২৫২৭৫৮ নম্বরে, ২ চাপলে কল কেটে যাবে',
        welcomeAudioId: data.welcomeAudioId || null,
        welcomeTtsText: data.welcomeTtsText || 'আসসালামু আলাইকুম। আমাদের প্রতিনিধির সাথে সরাসরি কথা বলতে ১ চাপুন, অথবা কলটি কেটে দিতে ২ চাপুন।',
        confirmAudioId: data.confirmAudioId || null,
        confirmTtsText: data.confirmTtsText || 'আপনার অনুরোধ সফলভাবে গ্রহণ করা হয়েছে। ধন্যবাদ।',
        cancelAudioId: data.cancelAudioId || null,
        cancelTtsText: data.cancelTtsText || 'কলটি বাতিল করা হয়েছে।',
        callbackAudioId: data.callbackAudioId || null,
        callbackTtsText: data.callbackTtsText || 'আপনার কলব্যাক অনুরোধ রেকর্ড করা হয়েছে।',
        confirmKey: data.confirmKey || '9',
        cancelKey: data.cancelKey || '2',
        callbackKey: data.callbackKey || '3',
        transferKey: data.transferKey || '1',
        transferDestination: data.transferDestination || '01713252758',
        maxRepeats: data.maxRepeats || 2,
        timeoutSeconds: data.timeoutSeconds || 6,
        autoCancelPolicy: Boolean(data.autoCancelPolicy),
        fallbackAction: data.fallbackAction || 'HANGUP',
        isActive: true,
      },
    });
  }

  /**
   * Delete IVR Flow
   */
  async deleteFlow(userId: string, flowId: string) {
    const existing = await this.prisma.ivrFlow.findFirst({ where: { id: flowId, userId } });
    if (!existing) throw new NotFoundException('Flow not found');

    return this.prisma.ivrFlow.delete({ where: { id: flowId } });
  }

  /**
   * List Callbacks
   */
  async listCallbacks(user: any) {
    const where: any = {};
    if (user.role === Role.CUSTOMER) {
      where.userId = user.id;
    } else if (user.role !== Role.SUPER_ADMIN) {
      where.OR = [{ userId: user.id }, { user: { path: { startsWith: user.path } } }];
    }

    return this.prisma.ivrCallback.findMany({
      where,
      orderBy: { scheduledAt: 'asc' },
      include: {
        order: { select: { id: true, orderNumber: true, customerName: true, orderAmount: true } },
      },
    });
  }

  /**
   * Complete a callback
   */
  async completeCallback(callbackId: string) {
    return this.prisma.ivrCallback.update({
      where: { id: callbackId },
      data: { status: 'COMPLETED' },
    });
  }
}
