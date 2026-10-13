import { Module } from '@nestjs/common';
import { AsteriskAriService } from './asterisk-ari.service';
import { CallDispatcherService } from './call-dispatcher.service';
import { TelephonyController } from './telephony.controller';
import { WalletModule } from '../wallet/wallet.module';
import { PricingModule } from '../pricing/pricing.module';

@Module({
  imports: [WalletModule, PricingModule],
  controllers: [TelephonyController],
  providers: [AsteriskAriService, CallDispatcherService],
  exports: [AsteriskAriService, CallDispatcherService],
})
export class TelephonyModule {}
