import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AsteriskAriService } from './asterisk-ari.service';
import { CallStatus } from '@prisma/client';

@Injectable()
export class CallDispatcherService {
  private readonly logger = new Logger(CallDispatcherService.name);

  constructor(
    private prisma: PrismaService,
    private ariService: AsteriskAriService,
  ) {}

  /**
   * Dispatch a pending call onto the Asterisk trunk while enforcing concurrency
   */
  async dispatchCall(callId: string) {
    const call = await this.prisma.callRecord.findUnique({
      where: { id: callId },
      include: {
        trunk: {
          include: { server: true },
        },
        user: true,
      },
    });

    if (!call || call.status !== CallStatus.PENDING) {
      this.logger.warn(`Call #${callId} is not in PENDING state. Skipping dispatch.`);
      return;
    }

    if (!call.trunk || !call.trunk.server) {
      this.logger.error(`Call #${callId} has no trunk or server configured`);
      await this.prisma.callRecord.update({
        where: { id: callId },
        data: { status: CallStatus.FAILED, hangupCause: 'NO_TRUNK_CONFIGURED' },
      });
      return;
    }

    const trunk = call.trunk;
    const server = trunk.server;

    // Check active concurrency limits
    if (trunk.activeCalls >= trunk.maxConcurrency || server.activeChannels >= server.maxConcurrency) {
      this.logger.warn(
        `Concurrency limit reached for Trunk ${trunk.name} (${trunk.activeCalls}/${trunk.maxConcurrency}) or Server (${server.activeChannels}/${server.maxConcurrency}). Re-queueing.`,
      );
      return { requeue: true };
    }

    try {
      // Increment active channels
      await this.prisma.$transaction([
        this.prisma.sipTrunk.update({
          where: { id: trunk.id },
          data: { activeCalls: { increment: 1 } },
        }),
        this.prisma.asteriskServer.update({
          where: { id: server.id },
          data: { activeChannels: { increment: 1 } },
        }),
        this.prisma.callRecord.update({
          where: { id: call.id },
          data: { status: CallStatus.INITIATED, initiatedAt: new Date() },
        }),
      ]);

      const originateRes = await this.ariService.originateCall({
        callId: call.id,
        phoneNumber: call.phoneNumber,
        trunkName: trunk.name,
        callerIdName: trunk.name,
        callerIdNumber: trunk.outboundCid || '999',
        ariBaseUrl: server.ariBaseUrl,
        ariUsername: server.ariUsername,
        ariPassword: server.ariPassword,
        appArgs: call.id,
      });

      await this.prisma.callRecord.update({
        where: { id: call.id },
        data: {
          uniqueId: originateRes.uniqueId,
          channelId: originateRes.channelId,
          status: CallStatus.RINGING,
        },
      });

      return { success: true, channelId: originateRes.channelId };
    } catch (err: any) {
      this.logger.error(`Dispatch failed for Call #${callId}: ${err.message}`);

      // Decrement counters on failure
      await this.prisma.$transaction([
        this.prisma.sipTrunk.update({
          where: { id: trunk.id },
          data: { activeCalls: { decrement: 1 } },
        }),
        this.prisma.asteriskServer.update({
          where: { id: server.id },
          data: { activeChannels: { decrement: 1 } },
        }),
        this.prisma.callRecord.update({
          where: { id: call.id },
          data: { status: CallStatus.FAILED, hangupCause: 'DISPATCH_EXCEPTION' },
        }),
      ]);

      throw err;
    }
  }
}
