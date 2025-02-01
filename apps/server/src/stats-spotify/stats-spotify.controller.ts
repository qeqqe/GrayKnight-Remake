import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { StatsSpotifyService } from './stats-spotify.service';
import { JwtAuthGuard } from 'src/auth/strategies/jwt.guard';

@Controller('stats-spotify')
export class StatsSpotifyController {
  constructor(private statsService: StatsSpotifyService) {}

  @Get('listening-stats')
  @UseGuards(JwtAuthGuard)
  async getListeningStats(
    @Req() req,
    @Query('timeRange') timeRange: string = 'week',
  ) {
    return this.statsService.getListeningStats(req.user.id, timeRange);
  }

  @Get('debug')
  @UseGuards(JwtAuthGuard)
  async debugStats(@Req() req) {
    const userId = req.user.id;
    const raw = await this.statsService.debugRawData(userId);
    return raw;
  }
}
