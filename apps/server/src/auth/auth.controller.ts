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
    // handled by guard
  }

  @Get('spotify/callback')
  @UseGuards(SpotifyAuthGuard)
  async spotifyAuthCallback(@Req() req, @Res() res: Response) {
    const user = await this.authService.validateUser(req.user);
    const token = await this.authService.generateToken(user);
    const frontendUrl = this.configService.get('FRONTEND_URL');

    console.log('Generated token:', token);
    console.log(
      'Redirecting to:',
      `${frontendUrl}/auth/callback?token=${token}`,
    );

    res.redirect(`${frontendUrl}/auth/callback?token=${token}`);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Req() req) {
    return this.authService.getUserProfile(req.user.sub);
  }
}
