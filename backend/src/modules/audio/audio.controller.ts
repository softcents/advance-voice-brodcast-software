import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  Headers,
  UseInterceptors,
  UploadedFile,
  Res,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { AudioService } from './audio.service';
import { extractAuthUser } from '../../common/auth-user.helper';

@Controller('audio')
export class AudioController {
  constructor(private readonly audioService: AudioService) {}

  @Get()
  async getAudios(
    @Query('userId') queryUserId?: string,
    @Headers('authorization') authHeader?: string,
  ) {
    const auth = extractAuthUser(authHeader, queryUserId);
    let targetUserId = auth.userId;
    if (auth.role === 'CUSTOMER') {
      targetUserId = auth.userId;
    }
    return this.audioService.getAudios(targetUserId);
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadAudio(
    @UploadedFile() file: any,
    @Body('title') title: string,
    @Body('userId') bodyUserId?: string,
    @Headers('authorization') authHeader?: string,
  ) {
    if (!file) {
      throw new NotFoundException('No audio file provided');
    }
    const auth = extractAuthUser(authHeader, bodyUserId);
    const resolvedUserId = auth.userId;
    if (!resolvedUserId) {
      throw new BadRequestException('User identification required for audio upload');
    }
    return this.audioService.uploadAndConvertAudio(file, title, resolvedUserId);
  }

  @Get(':id/stream')
  async streamAudio(@Param('id') id: string, @Res() res: Response) {
    const filePath = await this.audioService.getAudioFilePath(id);
    return res.sendFile(filePath);
  }

  @Post()
  async createAudio(
    @Body()
    body: {
      userId?: string;
      title: string;
      originalPath: string;
      durationSeconds: number;
      isTTS?: boolean;
      ttsText?: string;
      language?: string;
    },
    @Headers('authorization') authHeader?: string,
  ) {
    const auth = extractAuthUser(authHeader, body.userId);
    if (auth.userId) {
      body.userId = auth.userId;
    }
    return this.audioService.createAudio(body);
  }

  @Post(':id/approve')
  async approveAudioPost(
    @Param('id') id: string,
    @Body('isApproved') isApproved: boolean = true,
  ) {
    return this.audioService.setApproval(id, isApproved);
  }

  @Delete(':id')
  async deleteAudio(@Param('id') id: string) {
    return this.audioService.deleteAudio(id);
  }
}
