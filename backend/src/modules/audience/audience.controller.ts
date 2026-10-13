import { Controller, Get, Post, Delete, Body, Param, Query, Headers, BadRequestException } from '@nestjs/common';
import { AudienceService } from './audience.service';
import { extractAuthUser } from '../../common/auth-user.helper';

@Controller('audience')
export class AudienceController {
  constructor(private readonly audienceService: AudienceService) {}

  @Get('groups')
  async getGroups(
    @Query('userId') queryUserId?: string,
    @Headers('authorization') authHeader?: string,
  ) {
    const auth = extractAuthUser(authHeader, queryUserId);
    let targetUserId = auth.userId;
    if (auth.role === 'CUSTOMER') {
      targetUserId = auth.userId;
    }
    return this.audienceService.getGroups(targetUserId);
  }

  @Post('groups')
  async createGroup(
    @Body() body: { name: string; userId?: string },
    @Headers('authorization') authHeader?: string,
  ) {
    const auth = extractAuthUser(authHeader, body.userId);
    const userId = auth.userId;
    if (!userId) {
      throw new BadRequestException('User identification required to create contact group');
    }
    return this.audienceService.createGroup(userId, body.name);
  }

  @Delete('groups/:id')
  async deleteGroup(@Param('id') id: string) {
    return this.audienceService.deleteGroup(id);
  }

  @Get('contacts')
  async getContacts(
    @Query('groupId') groupId?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.audienceService.getContacts({
      groupId,
      search,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 50,
    });
  }

  @Post('contacts')
  async createContact(@Body() body: { groupId: string; name: string; phoneNumber: string }) {
    return this.audienceService.createContact(body.groupId, body.name, body.phoneNumber);
  }

  @Post('contacts/import')
  async importContacts(@Body() body: { groupId: string; contacts: { name?: string; phoneNumber: string }[] }) {
    return this.audienceService.importContacts(body.groupId, body.contacts);
  }

  @Delete('contacts/:id')
  async deleteContact(@Param('id') id: string) {
    return this.audienceService.deleteContact(id);
  }
}
