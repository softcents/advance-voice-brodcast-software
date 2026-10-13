import { Controller, Get, Post, Body, Patch, Param, Query, Headers, BadRequestException } from '@nestjs/common';
import { CampaignService, CreateCampaignDto, SendOtpDto } from './campaign.service';
import { PrismaService } from '../../prisma/prisma.service';
import { extractAuthUser } from '../../common/auth-user.helper';

@Controller('campaigns')
export class CampaignController {
  constructor(
    private readonly campaignService: CampaignService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  async getCampaigns(
    @Query('userId') queryUserId?: string,
    @Headers('authorization') authHeader?: string,
  ) {
    const auth = extractAuthUser(authHeader, queryUserId);
    let targetUserId = auth.userId;
    if (auth.role === 'CUSTOMER') {
      targetUserId = auth.userId;
    }
    return this.campaignService.getCampaigns(targetUserId);
  }

  @Post()
  async createCampaign(
    @Body() dto: CreateCampaignDto & { userId?: string },
    @Headers('authorization') authHeader?: string,
  ) {
    const auth = extractAuthUser(authHeader, dto.userId);
    let userId = auth.userId;

    if (!userId) {
      const user = await this.prisma.user.findFirst({ where: { role: 'SUPER_ADMIN' } });
      userId = user?.id;
    }

    if (!userId) {
      throw new BadRequestException('User identification required to create campaign');
    }

    return this.campaignService.createCampaign(userId, dto);
  }

  @Post('otp')
  async sendOtp(
    @Body() dto: SendOtpDto & { userId?: string },
    @Headers('authorization') authHeader?: string,
  ) {
    const auth = extractAuthUser(authHeader, dto.userId);
    let userId = auth.userId;

    if (!userId) {
      const user = await this.prisma.user.findFirst({ where: { role: 'SUPER_ADMIN' } });
      userId = user?.id;
    }

    if (!userId) {
      throw new BadRequestException('User identification required to send OTP');
    }

    return this.campaignService.sendOtp(userId, dto);
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
