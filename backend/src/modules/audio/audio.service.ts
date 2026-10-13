import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { execSync } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import { randomUUID } from 'crypto';

@Injectable()
export class AudioService {
  constructor(private prisma: PrismaService) {}

  async getAudios(userId?: string) {
    return this.prisma.audioAsset.findMany({
      where: userId ? { userId } : {},
      orderBy: { createdAt: 'desc' },
    });
  }

  async createAudio(data: {
    userId?: string;
    title: string;
    originalPath: string;
    durationSeconds: number;
    isTTS?: boolean;
    ttsText?: string;
    language?: string;
  }) {
    let userId = data.userId;
    if (!userId) {
      const admin = await this.prisma.user.findFirst({ where: { role: 'SUPER_ADMIN' } });
      userId = admin?.id || (await this.prisma.user.findFirst())?.id;
    }

    if (!userId) {
      throw new NotFoundException('No valid user found to associate with audio asset');
    }

    return this.prisma.audioAsset.create({
      data: {
        userId,
        title: data.title,
        originalPath: data.originalPath,
        convertedPath: data.originalPath.replace(/\.(mp3|ogg)$/i, '.wav'),
        durationSeconds: data.durationSeconds,
        isTTS: data.isTTS || false,
        ttsText: data.ttsText,
        language: data.language || 'bn-BD',
        isApproved: true,
      },
    });
  }

  /**
   * Upload audio file and auto-convert to Asterisk 8kHz mono WAV format
   */
  async uploadAndConvertAudio(file: any, title: string, userId?: string) {
    let resolvedUserId = userId;
    if (!resolvedUserId) {
      const admin = await this.prisma.user.findFirst({ where: { role: 'SUPER_ADMIN' } });
      resolvedUserId = admin?.id || (await this.prisma.user.findFirst())?.id;
    }

    if (!resolvedUserId) {
      throw new NotFoundException('No user found');
    }

    const uuid = randomUUID();
    const ext = path.extname(file.originalname).toLowerCase() || '.wav';
    const baseDir = '/www/wwwroot/vsms.ominaz.com/storage/app/public/audios';
    const originalsDir = path.join(baseDir, 'originals');
    const conversionsDir = path.join(baseDir, 'conversions');

    if (!fs.existsSync(originalsDir)) fs.mkdirSync(originalsDir, { recursive: true });
    if (!fs.existsSync(conversionsDir)) fs.mkdirSync(conversionsDir, { recursive: true });

    const originalFilename = `${uuid}${ext}`;
    const convertedFilename = `${uuid}.wav`;

    const originalFilePath = path.join(originalsDir, originalFilename);
    const convertedFilePath = path.join(conversionsDir, convertedFilename);

    // Write original file
    fs.writeFileSync(originalFilePath, file.buffer);

    // Convert via ffmpeg to 8kHz, mono, 16-bit PCM (Telephony standard)
    let durationSeconds = 10;
    try {
      execSync(
        `ffmpeg -y -i "${originalFilePath}" -ac 1 -ar 8000 -c:a pcm_s16le "${convertedFilePath}" 2>/dev/null`,
      );

      // Probe duration
      const durationOut = execSync(
        `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${convertedFilePath}" 2>/dev/null`,
      )
        .toString()
        .trim();
      const parsedDuration = Math.round(parseFloat(durationOut));
      if (!isNaN(parsedDuration) && parsedDuration > 0) {
        durationSeconds = parsedDuration;
      }
    } catch (err: any) {
      // Fallback: copy file directly if ffmpeg fails
      try {
        fs.copyFileSync(originalFilePath, convertedFilePath);
      } catch (copyErr) {
        // ignore
      }
    }

    // Relative paths matching legacy system conventions
    const relativeOriginal = `audios/originals/${originalFilename}`;
    const relativeConverted = `audios/conversions/${convertedFilename}`;

    return this.prisma.audioAsset.create({
      data: {
        userId: resolvedUserId,
        title: title || file.originalname,
        originalPath: relativeOriginal,
        convertedPath: relativeConverted,
        durationSeconds,
        isTTS: false,
        isApproved: true,
      },
    });
  }

  /**
   * Get physical audio file path for browser streaming and playback
   */
  async getAudioFilePath(id: string): Promise<string> {
    const audio = await this.prisma.audioAsset.findUnique({ where: { id } });
    if (!audio) throw new NotFoundException('Audio asset not found');

    const searchPaths = [
      audio.convertedPath ? path.join('/www/wwwroot/vsms.ominaz.com/storage/app/public', audio.convertedPath) : null,
      audio.originalPath ? path.join('/www/wwwroot/vsms.ominaz.com/storage/app/public', audio.originalPath) : null,
      audio.convertedPath ? path.join('/www/wwwroot/vsms.ominaz.com/public', audio.convertedPath) : null,
      audio.originalPath ? path.join('/www/wwwroot/vsms.ominaz.com/public', audio.originalPath) : null,
    ].filter(Boolean) as string[];

    for (const p of searchPaths) {
      if (fs.existsSync(p)) return p;
    }

    throw new NotFoundException(`Audio file could not be located on disk`);
  }

  async deleteAudio(id: string) {
    const audio = await this.prisma.audioAsset.findUnique({ where: { id } });
    if (!audio) throw new NotFoundException('Audio not found');

    // Optionally cleanup files
    try {
      if (audio.originalPath) {
        const orig = path.join('/www/wwwroot/vsms.ominaz.com/storage/app/public', audio.originalPath);
        if (fs.existsSync(orig)) fs.unlinkSync(orig);
      }
      if (audio.convertedPath) {
        const conv = path.join('/www/wwwroot/vsms.ominaz.com/storage/app/public', audio.convertedPath);
        if (fs.existsSync(conv)) fs.unlinkSync(conv);
      }
    } catch (e) {
      // Ignore unlink errors
    }

    return this.prisma.audioAsset.delete({ where: { id } });
  }

  async setApproval(id: string, isApproved: boolean) {
    const audio = await this.prisma.audioAsset.findUnique({ where: { id } });
    if (!audio) throw new NotFoundException('Audio not found');
    return this.prisma.audioAsset.update({
      where: { id },
      data: { isApproved },
    });
  }
}
