import { Controller, Get, Post, Body, Patch, Param, Query } from '@nestjs/common';
import { CampaignService, CreateCampaignDto, SendOtpDto } from './campaign.service';

import { PrismaService } from '../../prisma/prisma.service';

@Controller('campaigns')
export class CampaignController {
  constructor(
    private readonly campaignService: CampaignService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  async getCampaigns(@Query('userId') userId?: string) {
    return this.campaignService.getCampaigns(userId);
  }

  @Post()
  async createCampaign(
    @Body() dto: CreateCampaignDto & { userId?: string },
  ) {
    let userId = dto.userId;
    if (!userId) {
      const user = await this.prisma.user.findFirst();
      userId = user?.id;
    }
    return this.campaignService.createCampaign(userId!, dto);
  }

  @Post('otp')
  async sendOtp(
    @Body() dto: SendOtpDto & { userId?: string },
  ) {
    let userId = dto.userId;
    if (!userId) {
      const user = await this.prisma.user.findFirst();
      userId = user?.id;
    }
    return this.campaignService.sendOtp(userId!, dto);
  }

  @Patch(':id/pause')
  async pauseCampaign(@Param('id') id: string) {
    return this.campaignService.pauseCampaign(id);
  }

  @Patch(':id/resume')
  async resumeCampaign(@Param('id') id: string) {
    return this.campaignService.resumeCampaign(id);
  }
}
