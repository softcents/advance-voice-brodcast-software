import { Module, forwardRef } from '@nestjs/common';
import { CampaignService } from './campaign.service';
import { CampaignController } from './campaign.controller';
import { WalletModule } from '../wallet/wallet.module';
import { PricingModule } from '../pricing/pricing.module';

import { TelephonyModule } from '../telephony/telephony.module';
import { QueueModule } from '../queue/queue.module';

@Module({
  imports: [WalletModule, PricingModule, TelephonyModule, forwardRef(() => QueueModule)],
  controllers: [CampaignController],
  providers: [CampaignService],
  exports: [CampaignService],
})
export class CampaignModule {}
