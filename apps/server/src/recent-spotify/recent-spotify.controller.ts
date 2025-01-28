import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { RecentSpotifyService } from './recent-spotify.service';
import { JwtAuthGuard } from 'src/auth/strategies/jwt.guard';

@Controller('recent-spotify')
export class RecentSpotifyController {
  constructor(private recentSpotifyService: RecentSpotifyService) {}

  @Get('recently-played')
  @UseGuards(JwtAuthGuard)
  async getRecentlyPlayed(
    @Req() req,
    @Query('after') after?: string,
    @Query('limit') limit?: number,
  ) {
    return this.recentSpotifyService.getRecentlyPlayed(
      req.user.id,
      after,
      limit,
    );
  }
}
