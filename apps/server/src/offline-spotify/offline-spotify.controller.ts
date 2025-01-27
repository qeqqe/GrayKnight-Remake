import { Controller, Post, Get, UseGuards, Req } from '@nestjs/common';
import { OfflineSpotifyService } from './offline-spotify.service';
import { JwtAuthGuard } from 'src/auth/strategies/jwt.guard';

@Controller('offline-spotify')
export class OfflineSpotifyController {
  constructor(private readonly offlineSpotifyService: OfflineSpotifyService) {}

  @Post('enable')
  @UseGuards(JwtAuthGuard)
  async enableOfflineTracking(@Req() req) {
    return this.offlineSpotifyService.enableOfflineTracking(req.user.id);
  }

  @Post('disable')
  @UseGuards(JwtAuthGuard)
  async disableOfflineTracking(@Req() req) {
    return this.offlineSpotifyService.disableOfflineTracking(req.user.id);
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard)
  async getOfflineStats(@Req() req) {
    return this.offlineSpotifyService.getOfflineStats(req.user.id);
  }
}
