import { Injectable, Logger, OnModuleInit, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { PricingService } from '../pricing/pricing.service';
import { RedisService } from '../../common/redis.service';
import { IvrService } from '../ivr/ivr.service';
import { QueueService } from '../queue/queue.service';
import { CallStatus, IvrOrderStatus } from '@prisma/client';
import axios from 'axios';
import * as WebSocket from 'ws';

interface ActiveBridgeTransfer {
  bridgeId: string;
  customerChannelId: string;
  agentChannelId?: string;
  orderId?: string;
  agentAnswered: boolean;
  createdAt: Date;
  server: any;
}

@Injectable()
export class AsteriskAriService implements OnModuleInit {
  private readonly logger = new Logger(AsteriskAriService.name);
  private wsClient: WebSocket | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private activeBridges = new Map<string, ActiveBridgeTransfer>();
  private channelToBridge = new Map<string, string>();

  constructor(
    private prisma: PrismaService,
    private walletService: WalletService,
    private pricingService: PricingService,
    private redisService: RedisService,
    @Inject(forwardRef(() => IvrService))
    private ivrService: IvrService,
    @Inject(forwardRef(() => QueueService))
    private queueService: QueueService,
  ) {}

  async onModuleInit() {
    if (process.env.ENABLE_ASTERISK === 'true') {
      this.logger.log('Initializing Asterisk ARI WebSocket Stasis connection...');
      this.connectAriWebSocket();
    } else {
      this.logger.log('ℹ️ Asterisk ARI disabled. Telephony handled by FreeSWITCH ESL Engine.');
    }
  }

  /**
   * Register an active bridge transfer session between customer and live agent
   */
  registerBridgeTransfer(params: {
    bridgeId: string;
    customerChannelId: string;
    agentChannelId?: string;
    orderId?: string;
    server: any;
  }) {
    const session: ActiveBridgeTransfer = {
      bridgeId: params.bridgeId,
      customerChannelId: params.customerChannelId,
      agentChannelId: params.agentChannelId,
      orderId: params.orderId,
      agentAnswered: false,
      createdAt: new Date(),
      server: params.server,
    };
    this.activeBridges.set(params.bridgeId, session);
    this.channelToBridge.set(params.customerChannelId, params.bridgeId);
    if (params.agentChannelId) {
      this.channelToBridge.set(params.agentChannelId, params.bridgeId);
    }
    this.logger.log(`🔗 Registered active bridge transfer: bridge=${params.bridgeId}, customer=${params.customerChannelId}, agent=${params.agentChannelId}`);
  }

  /**
   * Handle bridge cleanup when either agent or customer channel disconnects
   */
  async handleBridgeHangup(channelId: string, server: any) {
    const bridgeId = this.channelToBridge.get(channelId);
    if (!bridgeId) return;

    const session = this.activeBridges.get(bridgeId);
    if (!session) {
      this.channelToBridge.delete(channelId);
      return;
    }

    this.logger.log(`Bridge participant hangup event: channel=${channelId}, bridgeId=${bridgeId}`);
    const serverToUse = session.server || server;
    const auth = Buffer.from(`${serverToUse.ariUsername}:${serverToUse.ariPassword}`).toString('base64');
    const axiosHeaders = { Authorization: `Basic ${auth}` };

    if (channelId === session.agentChannelId) {
      if (!session.agentAnswered) {
        // Agent did not answer / rejected call
        this.logger.warn(`Representative rejected or did not answer transfer call for Order #${session.orderId}`);
        // Stop ringing customer
        try {
          await axios.delete(`${serverToUse.ariBaseUrl}/ari/channels/${session.customerChannelId}/ring`, {
            headers: axiosHeaders,
          });
        } catch {}

        // Play polite message to customer
        try {
          await axios.post(
            `${serverToUse.ariBaseUrl}/ari/channels/${session.customerChannelId}/play`,
            null,
            {
              params: { media: 'sound:sounds/no-agent-available' },
              headers: axiosHeaders,
            },
          );
        } catch {}

        setTimeout(async () => {
          try {
            await axios.delete(`${serverToUse.ariBaseUrl}/ari/channels/${session.customerChannelId}`, {
              headers: axiosHeaders,
            });
            await axios.delete(`${serverToUse.ariBaseUrl}/ari/bridges/${bridgeId}`, {
              headers: axiosHeaders,
            });
          } catch {}
        }, 4000);

        if (session.orderId) {
          try {
            await this.prisma.ivrOrder.update({
              where: { id: session.orderId },
              data: {
                notes: `Transfer attempted: Representative phone unavailable or no answer`,
              },
            });
          } catch {}
        }
      } else {
        // Agent hung up after live conversation
        this.logger.log(`Representative hung up call. Terminating customer channel and bridge ${bridgeId}.`);
        try {
          await axios.delete(`${serverToUse.ariBaseUrl}/ari/channels/${session.customerChannelId}`, {
            headers: axiosHeaders,
          });
        } catch {}
        try {
          await axios.delete(`${serverToUse.ariBaseUrl}/ari/bridges/${bridgeId}`, {
            headers: axiosHeaders,
          });
        } catch {}
      }
    } else if (channelId === session.customerChannelId) {
      // Customer hung up
      this.logger.log(`Customer hung up call. Terminating agent channel and bridge ${bridgeId}.`);
      if (session.agentChannelId) {
        try {
          await axios.delete(`${serverToUse.ariBaseUrl}/ari/channels/${session.agentChannelId}`, {
            headers: axiosHeaders,
          });
        } catch {}
      }
      try {
        await axios.delete(`${serverToUse.ariBaseUrl}/ari/bridges/${bridgeId}`, {
          headers: axiosHeaders,
        });
      } catch {}
    }

    // Cleanup session maps
    this.activeBridges.delete(bridgeId);
    this.channelToBridge.delete(session.customerChannelId);
    if (session.agentChannelId) {
      this.channelToBridge.delete(session.agentChannelId);
    }
  }

  /**
   * Connect and maintain persistent WebSocket connection to Asterisk ARI
   * This registers the application "VoiceProStasis" inside Asterisk
   */
  private async connectAriWebSocket() {
    try {
      const server = await this.prisma.asteriskServer.findFirst();
      if (!server) {
        this.logger.warn('No Asterisk server in database to connect ARI WebSocket');
        return;
      }

      const host = server.ariBaseUrl.replace(/^http:\/\//, '').replace(/^https:\/\//, '');
      const wsUrl = `ws://${host}/ari/events?app=VoiceProStasis&api_key=${server.ariUsername}:${server.ariPassword}`;

      this.logger.log(`Connecting to Asterisk ARI WebSocket: ws://${host}/ari/events?app=VoiceProStasis`);

      this.wsClient = new WebSocket(wsUrl);

      this.wsClient.on('open', () => {
        this.logger.log('✅ Asterisk ARI WebSocket connected! Application "VoiceProStasis" is now registered with PBX.');
      });

      this.wsClient.on('message', async (data: WebSocket.Data) => {
        try {
          const event = JSON.parse(data.toString());
          await this.handleAriEvent(event, server);
        } catch (err: any) {
          this.logger.error(`Error processing ARI event message: ${err.message}`);
        }
      });

      this.wsClient.on('error', (err) => {
        this.logger.error(`Asterisk ARI WebSocket error: ${err.message}`);
      });

      this.wsClient.on('close', () => {
        this.logger.warn('Asterisk ARI WebSocket disconnected. Reconnecting in 5 seconds...');
        if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
        this.reconnectTimer = setTimeout(() => this.connectAriWebSocket(), 5000);
      });
    } catch (e: any) {
      this.logger.error(`Failed to initiate ARI WebSocket: ${e.message}`);
      if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
      this.reconnectTimer = setTimeout(() => this.connectAriWebSocket(), 5000);
    }
  }

  /**
   * Handle Asterisk Stasis events (StasisStart, PlaybackFinished, ChannelHangupRequest, StasisEnd, etc.)
   */
  async handleAriEvent(event: any, server: any) {
    const auth = Buffer.from(`${server.ariUsername}:${server.ariPassword}`).toString('base64');
    const axiosHeaders = { Authorization: `Basic ${auth}` };

    if (event.type === 'StasisStart') {
      const channelId = event.channel?.id;
      const uniqueId = event.channel?.id;
      const linkedId = event.channel?.linkedid || event.channel?.id;
      const appArgs = event.args || [];

      // Intercept Agent Transfer incoming answer leg
      if (appArgs[0] === 'AGENT_TRANSFER') {
        const bridgeId = appArgs[1];
        const customerChannelId = appArgs[2];
        const orderId = appArgs[3];

        this.logger.log(`🎧 Live Agent ANSWERED incoming transfer call: channel=${channelId}, bridge=${bridgeId}, orderId=${orderId}`);

        // 1. Answer agent channel
        if (channelId) {
          try {
            await axios.post(`${server.ariBaseUrl}/ari/channels/${channelId}/answer`, null, {
              headers: axiosHeaders,
            });
          } catch (err: any) {
            this.logger.warn(`Could not answer agent channel ${channelId}: ${err.message}`);
          }
        }

        // 2. Stop ringing tone and active media on customer channel
        if (customerChannelId) {
          try {
            await axios.delete(`${server.ariBaseUrl}/ari/channels/${customerChannelId}/ring`, {
              headers: axiosHeaders,
            });
          } catch {}
          try {
            await axios.delete(`${server.ariBaseUrl}/ari/channels/${customerChannelId}/play`, {
              headers: axiosHeaders,
            });
          } catch {}
        }

        // 3. Add agent channel into mixing bridge with customer
        if (bridgeId && channelId) {
          try {
            await axios.post(
              `${server.ariBaseUrl}/ari/bridges/${bridgeId}/addChannel`,
              null,
              {
                params: { channel: channelId },
                headers: axiosHeaders,
              },
            );
            this.logger.log(`🎉 SUCCESS! Customer (${customerChannelId}) and Agent (${channelId}) are now directly connected in Bridge ${bridgeId}`);
          } catch (bridgeErr: any) {
            this.logger.error(`Error adding agent to bridge ${bridgeId}: ${bridgeErr.message}`);
          }
        }

        // 4. Mark agent connected
        const session = this.activeBridges.get(bridgeId);
        if (session) {
          session.agentAnswered = true;
          session.agentChannelId = channelId;
        }
        if (channelId) {
          this.channelToBridge.set(channelId, bridgeId);
        }

        // 5. Update order notes
        if (orderId) {
          try {
            await this.prisma.ivrOrder.update({
              where: { id: orderId },
              data: {
                notes: `Live call connected with agent at ${new Date().toLocaleTimeString()}`,
              },
            });
          } catch {}
        }

        return;
      }

      let callId = appArgs[0];
      if (callId === 'IVR_ORDER' && appArgs[1]) {
        callId = appArgs[1];
      }

      this.logger.log(`📞 StasisStart received: channel=${channelId}, uniqueId=${uniqueId}, linkedId=${linkedId}, callId=${callId}`);

      if (!channelId && !callId) return;

      // 1. Answer channel
      if (channelId) {
        try {
          await axios.post(`${server.ariBaseUrl}/ari/channels/${channelId}/answer`, null, {
            headers: axiosHeaders,
          });
        } catch (err: any) {
          this.logger.warn(`Could not answer channel ${channelId}: ${err.message}`);
        }
      }

      // 2. Lookup call record strictly via ARI unique identifiers (NEVER by phone number alone)
      const lookupConditions: any[] = [];
      if (callId) lookupConditions.push({ id: callId });
      if (channelId) lookupConditions.push({ channelId });
      if (uniqueId) lookupConditions.push({ uniqueId });
      if (linkedId) lookupConditions.push({ linkedId });

      if (lookupConditions.length === 0) return;

      const call = await this.prisma.callRecord.findFirst({
        where: { OR: lookupConditions },
        include: {
          audio: true,
          ivrOrder: {
            include: {
              flow: {
                include: { welcomeAudio: true },
              },
            },
          },
        },
      });

      if (!call) {
        this.logger.warn(`No call record matching ARI identifiers: callId=${callId}, channelId=${channelId}`);
        return;
      }

      await this.prisma.callRecord.update({
        where: { id: call.id },
        data: {
          status: CallStatus.ANSWERED,
          answeredAt: new Date(),
          channelId: channelId || call.channelId,
          uniqueId: uniqueId || call.uniqueId,
          linkedId: linkedId || call.linkedId,
        },
      });

      // 3. Play audio strictly associated with this call
      try {
        if (call.ivrOrder) {
          // Outbound IVR Flow Audio / Prompt
          const flow = call.ivrOrder.flow;
          if (flow?.welcomeAudio?.convertedPath) {
            const soundName = flow.welcomeAudio.convertedPath.replace(/\.wav$/i, '');
            this.logger.log(`Playing IVR welcome audio sound:${soundName} for order #${call.ivrOrder.orderNumber} on channel ${channelId}`);
            await axios.post(`${server.ariBaseUrl}/ari/channels/${channelId}/play`, null, {
              params: { media: `sound:${soundName}` },
              headers: axiosHeaders,
            });
          } else {
            this.logger.log(`Playing standard IVR welcome prompt for order #${call.ivrOrder.orderNumber}`);
            await axios.post(`${server.ariBaseUrl}/ari/channels/${channelId}/play`, null, {
              params: { media: `sound:sounds/order-welcome` },
              headers: axiosHeaders,
            });
          }
        } else if (call.audio?.convertedPath) {
          const soundName = call.audio.convertedPath.replace(/\.wav$/i, '');
          this.logger.log(`Playing audio asset sound:${soundName} for call #${call.id} on channel ${channelId}`);
          await axios.post(
            `${server.ariBaseUrl}/ari/channels/${channelId}/play`,
            null,
            {
              params: { media: `sound:${soundName}` },
              headers: axiosHeaders,
            },
          );
        } else if (call.isOtp && call.otpCode) {
          this.logger.log(`Playing OTP sequence for digits ${call.otpCode} on channel ${channelId}`);
          await axios.post(
            `${server.ariBaseUrl}/ari/channels/${channelId}/play`,
            null,
            {
              params: {
                media: `sound:sounds/pre-otp,digits:${call.otpCode},sound:sounds/post-otp,digits:${call.otpCode}`,
              },
              headers: axiosHeaders,
            },
          );
        }
      } catch (err: any) {
        this.logger.error(`Error playing audio on channel ${channelId}: ${err.message}`);
      }
    } else if (event.type === 'ChannelDtmfReceived') {
      const channelId = event.channel?.id;
      const digit = event.digit;
      this.logger.log(`🎹 Keypad event ChannelDtmfReceived: '${digit}' on channel: ${channelId}`);
      if (channelId && digit) {
        await this.ivrService.handleDtmf(channelId, digit, server);
      }
    } else if (event.type === 'PlaybackFinished') {
      const targetUri = event.playback?.target_uri || '';
      const channelId = targetUri.replace('channel:', '');
      this.logger.log(`PlaybackFinished on channel: ${channelId}`);

      if (channelId) {
        // If this channel is part of an active transfer bridge, never auto-disconnect
        if (this.channelToBridge.has(channelId)) {
          this.logger.log(`Channel ${channelId} is in active bridge. Skipping auto-disconnect.`);
          return;
        }

        // Check if this channel is an active IVR call
        const ivrCall = await this.prisma.callRecord.findFirst({
          where: { OR: [{ channelId }, { uniqueId: channelId }] },
          include: { ivrOrder: { include: { flow: true } } },
        });

        if (ivrCall?.ivrOrder) {
          // For IVR calls, give customer time to press keypad
          const timeoutMs = (ivrCall.ivrOrder.flow?.timeoutSeconds || 6) * 1000;
          this.logger.log(`IVR prompt complete. Waiting ${timeoutMs / 1000}s for keypad response on channel ${channelId}...`);
          setTimeout(async () => {
            if (this.channelToBridge.has(channelId)) return;

            const freshOrder = await this.prisma.ivrOrder.findUnique({
              where: { id: ivrCall.ivrOrder!.id },
            });
            if (freshOrder && !freshOrder.dtmfPressed && freshOrder.status === IvrOrderStatus.CALLING) {
              this.logger.log(`IVR timeout elapsed with no customer input on channel ${channelId}. Disconnecting.`);
              try {
                await axios.delete(`${server.ariBaseUrl}/ari/channels/${channelId}`, { headers: axiosHeaders });
              } catch {}
            }
          }, timeoutMs);
        } else {
          // Standard Voice SMS / OTP call: hang up gracefully after audio completes
          setTimeout(async () => {
            try {
              await axios.delete(`${server.ariBaseUrl}/ari/channels/${channelId}`, {
                headers: axiosHeaders,
              });
            } catch (err: any) {
              // Ignore hangup if already disconnected
            }
          }, 1200);
        }
      }
    } else if (event.type === 'ChannelHangupRequest' || event.type === 'StasisEnd' || event.type === 'ChannelDestroyed') {
      const channelId = event.channel?.id;
      const uniqueId = event.channel?.id;
      const linkedId = event.channel?.linkedid || event.channel?.id;
      const duration = event.channel?.duration || 0;
      const billable = Math.max(0, duration);
      const cause = String(event.cause_txt || event.cause || 'NORMAL_CLEARING');

      if (channelId) {
        await this.handleBridgeHangup(channelId, server);
      }

      if (channelId || uniqueId || linkedId) {
        await this.handleChannelHangup(channelId, uniqueId, linkedId, billable, cause);
      }
    }
  }

  /**
   * Originate Call via Asterisk ARI HTTP Endpoint
   */
  async originateCall(params: {
    callId: string;
    phoneNumber: string;
    trunkName: string;
    callerIdName: string;
    callerIdNumber: string;
    ariBaseUrl: string;
    ariUsername: string;
    ariPassword: string;
    appArgs: string;
  }) {
    const auth = Buffer.from(`${params.ariUsername}:${params.ariPassword}`).toString('base64');
    const endpoint = `PJSIP/${params.phoneNumber}@${params.trunkName}`;

    try {
      const response = await axios.post(
        `${params.ariBaseUrl}/ari/channels`,
        null,
        {
          params: {
            endpoint,
            app: 'VoiceProStasis',
            callerId: `${params.callerIdName} <${params.callerIdNumber}>`,
            appArgs: params.appArgs,
            timeout: 120,
          },
          headers: {
            Authorization: `Basic ${auth}`,
          },
        },
      );

      const returnedId = response.data?.id;
      const returnedLinkedId = response.data?.linkedid || returnedId;

      return {
        success: true,
        channelId: returnedId,
        uniqueId: returnedId,
        linkedId: returnedLinkedId,
      };
    } catch (error: any) {
      this.logger.error(`Asterisk ARI originate failed for call ${params.callId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Handle Stasis Hangup and settle CDR & ledger idempotently
   */
  async handleChannelHangup(
    channelId: string | undefined,
    uniqueId: string | undefined,
    linkedId: string | undefined,
    billableSeconds: number,
    cause: string,
  ) {
    this.logger.log(`Handling Hangup: channel=${channelId}, uniqueId=${uniqueId}, linkedId=${linkedId}, billable=${billableSeconds}s, cause=${cause}`);

    const lookupConditions: any[] = [];
    if (uniqueId) lookupConditions.push({ uniqueId });
    if (channelId) lookupConditions.push({ channelId });
    if (linkedId) lookupConditions.push({ linkedId });

    if (lookupConditions.length === 0) return;

    const callRecord = await this.prisma.callRecord.findFirst({
      where: { OR: lookupConditions },
      include: { user: true, trunk: true },
    });

    if (!callRecord) {
      return;
    }

    // Always decrement active concurrency counters safely
    if (callRecord.trunkId) {
      await this.prisma.sipTrunk.updateMany({
        where: { id: callRecord.trunkId, activeCalls: { gt: 0 } },
        data: { activeCalls: { decrement: 1 } },
      });
    }
    const server = await this.prisma.asteriskServer.findFirst();
    if (server) {
      await this.prisma.asteriskServer.updateMany({
        where: { id: server.id, activeChannels: { gt: 0 } },
        data: { activeChannels: { decrement: 1 } },
      });
    }

    // 1. Acquire Redis distributed lock per callRecord to prevent double-settlement race conditions
    const lockKey = `settle:${callRecord.id}`;
    const acquired = await this.redisService.acquireLock(lockKey, 15);
    if (!acquired) {
      this.logger.log(`Settlement already locked/in-progress for Call #${callRecord.id}. Skipping duplicate hangup.`);
      return;
    }

    try {
      // 2. Fetch fresh state inside lock
      const freshCall = await this.prisma.callRecord.findUnique({
        where: { id: callRecord.id },
        include: { ivrOrder: true },
      });

      if (
        !freshCall ||
        freshCall.status === CallStatus.COMPLETED ||
        freshCall.status === CallStatus.BUSY ||
        freshCall.status === CallStatus.NO_ANSWER ||
        freshCall.status === CallStatus.FAILED
      ) {
        this.logger.log(`Call #${callRecord.id} is already settled (${freshCall?.status}). Skipping.`);
        return;
      }

      const answeredAt = freshCall.answeredAt ? new Date(freshCall.answeredAt).getTime() : null;
      const initiatedAt = freshCall.initiatedAt
        ? new Date(freshCall.initiatedAt).getTime()
        : new Date(freshCall.createdAt).getTime();

      // Total duration includes ringing and connection time
      const totalDuration = Math.max(0, Math.round((Date.now() - initiatedAt) / 1000));

      // Billable talk duration is STRICTLY from answer until hangup
      const talkSeconds = answeredAt ? Math.max(0, Math.floor((Date.now() - answeredAt) / 1000)) : 0;
      const finalBillable = talkSeconds;

      const finalStatus =
        answeredAt
          ? CallStatus.COMPLETED
          : cause === 'USER_BUSY'
          ? CallStatus.BUSY
          : cause === 'NO_ANSWER'
          ? CallStatus.NO_ANSWER
          : CallStatus.FAILED;

      // Calculate actual cost & margin via Pricing engine
      const pricing = await this.pricingService.calculateCallCost(
        freshCall.userId,
        freshCall.phoneNumber,
        finalBillable,
      );

      // Update Call Record
      await this.prisma.callRecord.update({
        where: { id: freshCall.id },
        data: {
          status: finalStatus,
          hangupCause: cause,
          endedAt: new Date(),
          duration: totalDuration,
          billableSeconds: finalBillable,
          costPrice: pricing.costPrice,
          sellingPrice: pricing.sellingPrice,
          grossProfit: pricing.grossProfit,
          resellerMargin: pricing.resellerMargin,
        },
      });

      // If call is tied to an IVR Order and wasn't confirmed/cancelled, update order state
      if (freshCall.ivrOrderId && freshCall.ivrOrder?.status === IvrOrderStatus.CALLING) {
        if (!answeredAt) {
          await this.prisma.ivrOrder.update({
            where: { id: freshCall.ivrOrderId },
            data: {
              status: IvrOrderStatus.FAILED,
              notes: `Call ended with no answer / ${cause}`,
            },
          });

          // Schedule automated IVR retry via RabbitMQ if attempts remaining
          try {
            const currentAttempts = freshCall.ivrOrder.attempts || 1;
            const retryDelayMs = Math.min(currentAttempts * 5 * 60 * 1000, 30 * 60 * 1000); // 5m, 10m, 15m
            await this.queueService.publishIvrRetry(freshCall.ivrOrderId, currentAttempts + 1, retryDelayMs);
            this.logger.log(`Scheduled automated IVR retry for Order #${freshCall.ivrOrder.orderNumber} in ${retryDelayMs / 1000}s`);
          } catch (retryErr: any) {
            this.logger.warn(`Could not schedule IVR retry: ${retryErr.message}`);
          }
        }
      }

      // Reconcile and Settle Wallet Idempotently
      try {
        await this.walletService.settleCallUsage({
          callId: freshCall.id,
          userId: freshCall.userId,
          billableSeconds: finalBillable,
          pulseDuration: pricing.pulseDuration,
          pulseRate: pricing.pulseRate,
          costRate: pricing.buyRate,
          reservedCost: freshCall.sellingPrice.toNumber(),
          idempotencyKey: `IDEMP-SETTLE-${freshCall.id}`,
        });
        this.logger.log(`Successfully settled Call #${freshCall.id}. Status: ${finalStatus}`);
      } catch (settleErr: any) {
        this.logger.warn(`Settlement notice for Call #${freshCall.id}: ${settleErr.message}`);
      }
    } finally {
      await this.redisService.releaseLock(lockKey);
    }
  }
}
