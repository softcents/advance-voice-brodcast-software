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
   * Dispatch a pending call onto the Asterisk trunk while enforcing concurrency and strict idempotency
   */
  async dispatchCall(callId: string) {
    // 1. Atomic state check & transition: Only one worker can acquire this call
    const lockAcquired = await this.prisma.callRecord.updateMany({
      where: { id: callId, status: CallStatus.PENDING },
      data: { status: CallStatus.INITIATED, initiatedAt: new Date() },
    });

    if (lockAcquired.count === 0) {
      this.logger.warn(`Call #${callId} is not in PENDING state or already acquired by another worker. Skipping.`);
      return { skipped: true, reason: 'ALREADY_DISPATCHED' };
    }

    const call = await this.prisma.callRecord.findUnique({
      where: { id: callId },
      include: {
        trunk: {
          include: { server: true },
        },
        user: true,
      },
    });

    if (!call) {
      return { skipped: true, reason: 'NOT_FOUND' };
    }

    if (!call.trunk || !call.trunk.server) {
      this.logger.error(`Call #${callId} has no trunk or server configured`);
      await this.prisma.callRecord.update({
        where: { id: callId },
        data: { status: CallStatus.FAILED, hangupCause: 'NO_TRUNK_CONFIGURED' },
      });
      return { skipped: true, reason: 'NO_TRUNK' };
    }

    const trunk = call.trunk;
    const server = trunk.server;

    // 2. Check active concurrency limits
    if (trunk.activeCalls >= trunk.maxConcurrency || server.activeChannels >= server.maxConcurrency) {
      this.logger.warn(
        `Concurrency limit reached for Trunk ${trunk.name} (${trunk.activeCalls}/${trunk.maxConcurrency}) or Server (${server.activeChannels}/${server.maxConcurrency}). Re-queueing.`,
      );
      // Revert status to PENDING for subsequent batch pickup
      await this.prisma.callRecord.update({
        where: { id: callId },
        data: { status: CallStatus.PENDING, initiatedAt: null },
      });
      return { requeue: true };
    }

    try {
      // 3. Atomically increment active channel counters
      await this.prisma.$transaction([
        this.prisma.sipTrunk.update({
          where: { id: trunk.id },
          data: { activeCalls: { increment: 1 } },
        }),
        this.prisma.asteriskServer.update({
          where: { id: server.id },
          data: { activeChannels: { increment: 1 } },
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
          linkedId: originateRes.linkedId,
          status: CallStatus.RINGING,
        },
      });

      return { success: true, channelId: originateRes.channelId, uniqueId: originateRes.uniqueId };
    } catch (err: any) {
      this.logger.error(`Dispatch failed for Call #${callId}: ${err.message}`);

      // Decrement counters on originate failure
      await this.prisma.$transaction([
        this.prisma.sipTrunk.updateMany({
          where: { id: trunk.id, activeCalls: { gt: 0 } },
          data: { activeCalls: { decrement: 1 } },
        }),
        this.prisma.asteriskServer.updateMany({
          where: { id: server.id, activeChannels: { gt: 0 } },
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
