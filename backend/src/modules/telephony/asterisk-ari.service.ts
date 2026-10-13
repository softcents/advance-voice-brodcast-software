import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { PricingService } from '../pricing/pricing.service';
import { CallStatus } from '@prisma/client';
import axios from 'axios';
import * as WebSocket from 'ws';

@Injectable()
export class AsteriskAriService implements OnModuleInit {
  private readonly logger = new Logger(AsteriskAriService.name);
  private wsClient: WebSocket | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;

  constructor(
    private prisma: PrismaService,
    private walletService: WalletService,
    private pricingService: PricingService,
  ) {}

  async onModuleInit() {
    this.logger.log('Initializing Asterisk ARI WebSocket Stasis connection...');
    this.connectAriWebSocket();
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
          this.logger.error(`Error parsing ARI event message: ${err.message}`);
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
   * Handle Asterisk Stasis events (StasisStart, PlaybackFinished, ChannelHangupRequest, etc.)
   */
  private async handleAriEvent(event: any, server: any) {
    const auth = Buffer.from(`${server.ariUsername}:${server.ariPassword}`).toString('base64');
    const axiosHeaders = { Authorization: `Basic ${auth}` };

    if (event.type === 'StasisStart') {
      const channelId = event.channel?.id;
      const callId = event.args?.[0];
      this.logger.log(`📞 StasisStart event received: channel=${channelId}, callId=${callId}`);

      if (!channelId) return;

      // 1. Answer channel
      try {
        await axios.post(`${server.ariBaseUrl}/ari/channels/${channelId}/answer`, null, {
          headers: axiosHeaders,
        });
      } catch (err: any) {
        this.logger.warn(`Could not answer channel ${channelId}: ${err.message}`);
      }

      // 2. Lookup call record
      const call = await this.prisma.callRecord.findFirst({
        where: { OR: [{ id: callId }, { channelId }] },
        include: { audio: true },
      });

      if (!call) {
        this.logger.warn(`No call record matching ${callId} or ${channelId}`);
        return;
      }

      await this.prisma.callRecord.update({
        where: { id: call.id },
        data: { status: CallStatus.ANSWERED, answeredAt: new Date() },
      });

      // 3. Play audio
      try {
        if (call.isOtp && call.otpCode) {
          // Play OTP sequence
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
        } else if (call.audio?.convertedPath) {
          const soundName = call.audio.convertedPath.replace(/\.wav$/i, '');
          this.logger.log(`Playing audio asset sound:${soundName} on channel ${channelId}`);
          await axios.post(
            `${server.ariBaseUrl}/ari/channels/${channelId}/play`,
            null,
            {
              params: { media: `sound:${soundName}` },
              headers: axiosHeaders,
            },
          );
        }
      } catch (err: any) {
        this.logger.error(`Error playing audio on channel ${channelId}: ${err.message}`);
      }
    } else if (event.type === 'PlaybackFinished') {
      const targetUri = event.playback?.target_uri || '';
      const channelId = targetUri.replace('channel:', '');
      this.logger.log(`PlaybackFinished on channel: ${channelId}. Hanging up channel.`);

      if (channelId) {
        try {
          await axios.delete(`${server.ariBaseUrl}/ari/channels/${channelId}`, {
            headers: axiosHeaders,
          });
        } catch (err: any) {
          // Ignore hangup if already disconnected
        }
      }
    } else if (event.type === 'ChannelHangupRequest' || event.type === 'StasisEnd') {
      const channelId = event.channel?.id;
      const duration = event.channel?.duration || 0;
      const billable = Math.max(0, duration);
      const cause = event.cause_txt || 'NORMAL_CLEARING';

      if (channelId) {
        await this.handleChannelHangup(channelId, channelId, billable, cause);
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

      return {
        success: true,
        channelId: response.data?.id,
        uniqueId: response.data?.id,
      };
    } catch (error: any) {
      this.logger.error(`Asterisk ARI originate failed for call ${params.callId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Handle Stasis Hangup and settle CDR & ledger
   */
  async handleChannelHangup(channelId: string, uniqueId: string, billableSeconds: number, cause: string) {
    this.logger.log(`Handling Hangup for channel: ${channelId}, billable: ${billableSeconds}s, cause: ${cause}`);

    const callRecord = await this.prisma.callRecord.findFirst({
      where: {
        OR: [{ uniqueId }, { channelId }],
      },
      include: { user: true },
    });

    if (!callRecord) {
      return;
    }

    if (
      callRecord.status === CallStatus.COMPLETED ||
      callRecord.status === CallStatus.BUSY ||
      callRecord.status === CallStatus.NO_ANSWER ||
      callRecord.status === CallStatus.FAILED
    ) {
      this.logger.log(`Call #${callRecord.id} is already finalized with status ${callRecord.status}. Skipping.`);
      return;
    }

    const answeredAt = callRecord.answeredAt ? new Date(callRecord.answeredAt).getTime() : null;
    const elapsedSeconds = answeredAt ? Math.max(1, Math.round((Date.now() - answeredAt) / 1000)) : 0;
    const finalBillable = billableSeconds > 0 ? billableSeconds : elapsedSeconds;

    const finalStatus =
      callRecord.answeredAt || finalBillable > 0
        ? CallStatus.COMPLETED
        : cause === 'USER_BUSY'
          ? CallStatus.BUSY
          : cause === 'NO_ANSWER'
            ? CallStatus.NO_ANSWER
            : CallStatus.FAILED;

    // Calculate actual cost & margin via Pricing engine
    const pricing = await this.pricingService.calculateCallCost(
      callRecord.userId,
      callRecord.phoneNumber,
      finalBillable,
    );

    // Update Call Record
    await this.prisma.callRecord.update({
      where: { id: callRecord.id },
      data: {
        status: finalStatus,
        hangupCause: cause,
        endedAt: new Date(),
        duration: finalBillable,
        billableSeconds: finalBillable,
        costPrice: pricing.costPrice,
        sellingPrice: pricing.sellingPrice,
        grossProfit: pricing.grossProfit,
        resellerMargin: pricing.resellerMargin,
      },
    });

    // Reconcile and Settle Wallet
    await this.walletService.settleCallUsage({
      callId: callRecord.id,
      userId: callRecord.userId,
      billableSeconds: finalBillable,
      pulseDuration: pricing.pulseDuration,
      pulseRate: pricing.pulseRate,
      costRate: pricing.buyRate,
      reservedCost: callRecord.sellingPrice.toNumber(),
      idempotencyKey: `IDEMP-SETTLE-${callRecord.id}`,
    });

    this.logger.log(`Successfully settled Call #${callRecord.id}. Status: ${finalStatus}`);
  }
}
