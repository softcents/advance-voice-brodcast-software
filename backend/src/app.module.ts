import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { ResellerModule } from './modules/reseller/reseller.module';
import { WalletModule } from './modules/wallet/wallet.module';
import { PricingModule } from './modules/pricing/pricing.module';
import { ReportingModule } from './modules/reporting/reporting.module';
import { TelephonyModule } from './modules/telephony/telephony.module';
import { CampaignModule } from './modules/campaign/campaign.module';
import { AudienceModule } from './modules/audience/audience.module';
import { AudioModule } from './modules/audio/audio.module';
import { IvrModule } from './modules/ivr/ivr.module';
import { QueueModule } from './modules/queue/queue.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    ResellerModule,
    WalletModule,
    PricingModule,
    CampaignModule,
    ReportingModule,
    TelephonyModule,
    AudienceModule,
    AudioModule,
    IvrModule,
    QueueModule,
  ],
})
export class AppModule {}
