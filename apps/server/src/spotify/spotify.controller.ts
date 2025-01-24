import {
  Body,
  Controller,
  Get,
  Post,
  Put,
  Req,
  UseGuards,
  Param,
  Delete,
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

  @Put('play-spotify-track')
  @UseGuards(JwtAuthGuard)
  async playTrack(
    @Req() req,
    @Body()
    body: {
      endpoint: string;
      body: {
        uris?: string[];
        position_ms?: number;
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

  @Get('artists/:artistId')
  @UseGuards(JwtAuthGuard)
  async getArtistDetails(@Req() req, @Param('artistId') artistId: string) {
    return this.spotifyService.getArtistDetails(req.user.id, artistId);
  }

  @Get('available-devices')
  @UseGuards(JwtAuthGuard)
  async getAvailableDevices(@Req() req) {
    return this.spotifyService.getAvailableDevices(req.user.id);
  }

  @Put('transfer-playback')
  @UseGuards(JwtAuthGuard)
  async transferPlayback(@Req() req, @Body() body: { deviceId: string }) {
    const result = await this.spotifyService.transferPlayback(
      req.user.id,
      body.deviceId,
    );
    return result;
  }

  @Put('adjust-volume')
  @UseGuards(JwtAuthGuard)
  async adjustVolume(
    @Req() req,
    @Body() body: { deviceId: string; volume: number },
  ) {
    return this.spotifyService.adjustVolume(
      req.user.id,
      body.deviceId,
      body.volume,
    );
  }

  @Get('check-track-saved/:trackId')
  @UseGuards(JwtAuthGuard)
  async checkTrackSaved(@Req() req, @Param('trackId') trackId: string) {
    return this.spotifyService.checkTrackSaved(req.user.id, trackId);
  }

  @Delete('remove-from-library/:trackId')
  @UseGuards(JwtAuthGuard)
  async removeFromLibrary(@Req() req, @Param('trackId') trackId: string) {
    return this.spotifyService.removeFromLibrary(req.user.id, trackId);
  }

  @Put('save-to-library/:trackId')
  @UseGuards(JwtAuthGuard)
  async saveToLibrary(@Req() req, @Param('trackId') trackId: string) {
    return this.spotifyService.saveToLibrary(req.user.id, trackId);
  }

  @Put('seek')
  @UseGuards(JwtAuthGuard)
  async seek(
    @Req() req,
    @Body() body: { position_ms: number; device_id?: string },
  ) {
    return this.spotifyService.seek(
      req.user.id,
      body.position_ms,
      body.device_id,
    );
  }

  @Put('set-repeat-mode')
  @UseGuards(JwtAuthGuard)
  async setRepeatMode(
    @Req() req,
    @Body() body: { state: 'track' | 'context' | 'off' },
  ) {
    return this.spotifyService.setRepeatMode(req.user.id, body.state);
  }
}
