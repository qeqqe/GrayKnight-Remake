import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { SpotifyAuthGuard } from '../guards/spotify-auth.guard';

@Controller('auth')
export class AuthController {
  @Get('spotify')
  @UseGuards(SpotifyAuthGuard)
  spotifyAuth() {
    return 'something';
  }

  @Get('spotify/callback')
  @UseGuards(SpotifyAuthGuard)
  spotifyAuthCallback(@Req() req) {
    return req.user;
  }
}
