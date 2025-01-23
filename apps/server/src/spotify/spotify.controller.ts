import {
  Body,
  Controller,
  Get,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { SpotifyService } from './spotify.service';
import { JwtAuthGuard } from 'src/auth/strategies/jwt.guard';

@Controller('spotify')
export class SpotifyController {
  constructor(private readonly spotifyService: SpotifyService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Req() req) {
    console.log('User from request:', req.user);
    return this.spotifyService.getUserProfile(req.user.id);
  }

  @Get('current-playing')
  @UseGuards(JwtAuthGuard)
  async getCurrentTrack(@Req() req) {
    return this.spotifyService.getCurrentTrack(req.user.id);
  }

  @Get('recent')
  @UseGuards(JwtAuthGuard)
  async getRecentTracks(@Req() req) {
    return this.spotifyService.getRecentTracks(req.user.id);
  }

  @Post('prev-track')
  @UseGuards(JwtAuthGuard)
  async prevTrack(@Req() req, @Body() body: { endpoint: string }) {
    return this.spotifyService.prevTrack(req.user.id, body.endpoint);
  }

  @Post('add-to-queue')
  @UseGuards(JwtAuthGuard)
  async addToQueue(@Req() req, endpoint: string) {
    return this.spotifyService.addToQueue(req.user.id, endpoint);
  }

  @Post('play-spotify-track')
  @UseGuards(JwtAuthGuard)
  async playTrack(
    @Req() req,
    @Body()
    body: {
      endpoint: string;
      body: {
        context_uri?: string;
        uris?: string[];
        position_ms?: number;
        offset?: {
          uri?: string;
          position?: number;
        };
      };
    },
  ) {
    return this.spotifyService.playTrack(req.user.id, body);
  }

  @Put('pause-spotify-track')
  @UseGuards(JwtAuthGuard)
  async pauseTrack(@Req() req, @Body() body: { endpoint: string }) {
    return this.spotifyService.pauseTrack(req.user.id, body.endpoint);
  }

  @Post('next-spotify-track')
  @UseGuards(JwtAuthGuard)
  async nextTrack(@Req() req, @Body() body: { endpoint: string }) {
    return this.spotifyService.nextTrack(req.user.id, body.endpoint);
  }

  @Get('search')
  @UseGuards(JwtAuthGuard)
  async search(@Req() req) {
    const { q, type, limit, offset, market } = req.query;
    return this.spotifyService.search(req.user.id, {
      query: q,
      type,
      limit: Number(limit),
      offset: Number(offset),
      market,
    });
  }

  @Get('fetch-top-tracks')
  @UseGuards(JwtAuthGuard)
  async fetchTopTracks(@Req() req) {
    const artistId = req.query.artistId;
    return this.spotifyService.fetchTopTracks(req.user.id, artistId);
  }

  @Get('fetch-top-items')
  @UseGuards(JwtAuthGuard)
  async fetchTopItems(@Req() req) {
    const { type, time } = req.query;
    return this.spotifyService.fetchTopItems(req.user.id, type, time);
  }
}
