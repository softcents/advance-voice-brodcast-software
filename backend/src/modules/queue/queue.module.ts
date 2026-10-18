import { Module, forwardRef } from '@nestjs/common';
import { QueueService } from './queue.service';
import { QueueWorker } from './queue.worker';
import { QueueController } from './queue.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { RedisService } from '../../common/redis.service';
import { TelephonyModule } from '../telephony/telephony.module';
import { IvrModule } from '../ivr/ivr.module';

@Module({
  imports: [
    PrismaModule,
    forwardRef(() => TelephonyModule),
    forwardRef(() => IvrModule),
  ],
  controllers: [QueueController],
  providers: [QueueService, QueueWorker, RedisService],
  exports: [QueueService, QueueWorker],
})
export class QueueModule {}
