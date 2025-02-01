import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { StatsSpotifyService } from './stats-spotify.service';
import { JwtAuthGuard } from 'src/auth/strategies/jwt.guard';

@Controller('stats-spotify')
export class StatsSpotifyController {
  constructor(private statsService: StatsSpotifyService) {}

  @Get('overview')
  @UseGuards(JwtAuthGuard)
  async getListeningStats(@Req() req) {
    return this.statsService.getOverviewStats(req.user.id);
  }

  @Get('genres')
  @UseGuards(JwtAuthGuard)
  async getGenreStats(@Req() req) {
    return this.statsService.getGenereStats(req.user.id);
  }
}
