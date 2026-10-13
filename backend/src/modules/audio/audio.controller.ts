import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseInterceptors,
  UploadedFile,
  Res,
  NotFoundException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { AudioService } from './audio.service';

@Controller('audio')
export class AudioController {
  constructor(private readonly audioService: AudioService) {}

  @Get()
  async getAudios(@Query('userId') userId?: string) {
    return this.audioService.getAudios(userId);
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadAudio(
    @UploadedFile() file: any,
    @Body('title') title: string,
    @Body('userId') userId?: string,
  ) {
    if (!file) {
      throw new NotFoundException('No audio file provided');
    }
    return this.audioService.uploadAndConvertAudio(file, title, userId);
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
  ) {
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
