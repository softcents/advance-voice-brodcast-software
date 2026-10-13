import { Controller, Post, Get, Body, Param, Headers, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private jwtService: JwtService,
  ) {}

  @Post('login')
  async login(@Body('email') email: string, @Body('password') pass: string) {
    return this.authService.login(email, pass);
  }

  @Post('register')
  async register(@Body() body: any) {
    return this.authService.register(body);
  }

  @Post('impersonate/:userId')
  async impersonate(@Param('userId') userId: string) {
    return this.authService.impersonate(userId);
  }

  @Get('me')
  async me(@Headers('authorization') authHeader: string) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing token');
    }
    const token = authHeader.split(' ')[1];
    try {
      const decoded: any = this.jwtService.verify(token);
      return this.authService.getMe(decoded.sub);
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
