import { Module, forwardRef } from '@nestjs/common';
import { AsteriskAriService } from './asterisk-ari.service';
import { FreeSwitchEslService } from './freeswitch-esl.service';
import { CallDispatcherService } from './call-dispatcher.service';
import { TelephonyController } from './telephony.controller';
import { WalletModule } from '../wallet/wallet.module';
import { PricingModule } from '../pricing/pricing.module';
import { RedisService } from '../../common/redis.service';
import { IvrModule } from '../ivr/ivr.module';
import { QueueModule } from '../queue/queue.module';

@Module({
  imports: [WalletModule, PricingModule, forwardRef(() => IvrModule), forwardRef(() => QueueModule)],
  controllers: [TelephonyController],
  providers: [FreeSwitchEslService, AsteriskAriService, CallDispatcherService, RedisService],
  exports: [FreeSwitchEslService, AsteriskAriService, CallDispatcherService, RedisService],
})
export class TelephonyModule {}
