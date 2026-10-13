import { Module } from '@nestjs/common';
import { AudienceService } from './audience.service';
import { AudienceController } from './audience.controller';

@Module({
  controllers: [AudienceController],
  providers: [AudienceService],
  exports: [AudienceService],
})
export class AudienceModule {}
