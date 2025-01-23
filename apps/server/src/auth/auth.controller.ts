import { Controller, Get, UseGuards, Req, Res } from '@nestjs/common';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { SpotifyAuthGuard } from './guards/spotify-auth.guard';
import { AuthService } from './auth.service';

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
    try {
      const user = await this.authService.validateUser(req.user);
      const token = await this.authService.generateToken(user);

      // Add token expiry time to URL for client-side validation
      const expiresIn = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
      const expiryDate = Date.now() + expiresIn;

      res.redirect(
        `${this.configService.get('FRONTEND_URL')}/auth/callback?token=${token}&expires=${expiryDate}`,
      );
    } catch (error) {
      console.error('Auth callback error:', error);
      res.redirect(`${this.configService.get('FRONTEND_URL')}/error`);
    }
  }
}
