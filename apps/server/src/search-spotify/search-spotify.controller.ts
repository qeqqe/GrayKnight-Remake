import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { SearchSpotifyService } from './search-spotify.service';
import { JwtAuthGuard } from 'src/auth/strategies/jwt.guard';

@Controller('search-spotify')
export class SearchSpotifyController {
  constructor(private searchSpotifyService: SearchSpotifyService) {}

  @Get('search')
  @UseGuards(JwtAuthGuard)
  async search(@Req() req) {
    const { q, type, limit, offset, market } = req.query;
    console.log('Search request:', { q, type, limit, offset, market });

    try {
      const result = await this.searchSpotifyService.search(req.user.id, {
        query: q,
        type,
        limit: Number(limit),
        offset: Number(offset),
        market,
      });

      const data = await result.json();
      console.log('Search response:', data);
      return data;
    } catch (error) {
      console.error('Search error:', error);
      throw error;
    }
  }

  @Post('add-to-queue')
  @UseGuards(JwtAuthGuard)
  async addToQueue(@Req() req, @Body() body: { endpoint: string }) {
    return this.searchSpotifyService.addToQueue(req.user.id, body.endpoint);
  }

  @Get('fetch-top-tracks')
  @UseGuards(JwtAuthGuard)
  async fetchTopTracks(@Req() req) {
    const artistId = req.query.artistId;
    return this.searchSpotifyService.fetchTopTracks(req.user.id, artistId);
  }

  @Get('fetch-top-items')
  @UseGuards(JwtAuthGuard)
  async fetchTopItems(@Req() req) {
    const { type, time } = req.query;
    return this.searchSpotifyService.fetchTopItems(req.user.id, type, time);
  }
}
