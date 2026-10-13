import { Controller, Post, Body, Param } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(@Body('email') email: string, @Body('password') pass: string) {
    return this.authService.login(email, pass);
  }

  @Post('impersonate/:userId')
  async impersonate(@Param('userId') userId: string) {
    return this.authService.impersonate(userId);
  }
}
