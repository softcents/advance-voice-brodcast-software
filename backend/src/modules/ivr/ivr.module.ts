import { Module, forwardRef } from '@nestjs/common';
import { IvrController } from './ivr.controller';
import { IvrService } from './ivr.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { WalletModule } from '../wallet/wallet.module';
import { PricingModule } from '../pricing/pricing.module';
import { RedisService } from '../../common/redis.service';
import { TelephonyModule } from '../telephony/telephony.module';
import { QueueModule } from '../queue/queue.module';

@Module({
  imports: [
    PrismaModule,
    WalletModule,
    PricingModule,
    forwardRef(() => TelephonyModule),
    forwardRef(() => QueueModule),
  ],
  controllers: [IvrController],
  providers: [IvrService, RedisService],
  exports: [IvrService],
})
export class IvrModule {}
