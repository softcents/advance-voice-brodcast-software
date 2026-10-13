import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async login(email: string, pass: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { wallet: true },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const match = await bcrypt.compare(pass, user.passwordHash);
    if (!match) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException(`Account is ${user.status}. Contact your provider.`);
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      path: user.path,
      depth: user.depth,
    };

    const token = this.jwtService.sign(payload);

    return {
      accessToken: token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        companyName: user.companyName,
        path: user.path,
        depth: user.depth,
        wallet: {
          balance: user.wallet?.balance || 0,
          currency: user.wallet?.currency || 'BDT',
        },
      },
    };
  }

  async impersonate(targetUserId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      include: { wallet: true },
    });

    if (!user) {
      throw new UnauthorizedException('Target customer not found');
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      path: user.path,
      depth: user.depth,
      impersonated: true,
    };

    const token = this.jwtService.sign(payload);

    return {
      accessToken: token,
      impersonated: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        companyName: user.companyName,
        path: user.path,
        depth: user.depth,
        wallet: {
          balance: user.wallet?.balance || 0,
          currency: user.wallet?.currency || 'BDT',
        },
      },
    };
  }
}
