import { Controller, Get, UseGuards, Req, Res } from '@nestjs/common';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { SpotifyAuthGuard } from './guards/spotify-auth.guard';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './strategies/jwt.guard';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private configService: ConfigService,
  ) {}

  @Get('spotify')
  @UseGuards(SpotifyAuthGuard)
  async spotifyAuth() {
    // Handled by guard
  }

  @Get('spotify/callback')
  @UseGuards(SpotifyAuthGuard)
  async spotifyAuthCallback(@Req() req, @Res() res: Response) {
    const user = await this.authService.validateUser(req.user);
    const token = this.authService.generateToken(user);

    res.redirect(
      `${this.configService.get('FRONTEND_URL')}/auth/callback?token=${token}`,
    );
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Req() req) {
    return this.authService.getUserProfile(req.user.sub);
  }
}
