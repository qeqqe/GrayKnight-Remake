import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { OverviewSpotifyService } from './overview-spotify.service';
import { JwtAuthGuard } from 'src/auth/strategies/jwt.guard';

@Controller('overview-spotify')
export class OverviewSpotifyController {
  constructor(private overviewSpotifyService: OverviewSpotifyService) {}

  @Get('total-tracks')
  @UseGuards(JwtAuthGuard)
  async getTotalTracks(@Req() req) {
    return this.overviewSpotifyService.totalTracks(req.user.id);
  }

  @Get('top-genres')
  @UseGuards(JwtAuthGuard)
  async getTopGenres(@Req() req) {
    return this.overviewSpotifyService.topGenres(req.user.id);
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
    return this.overviewSpotifyService.playTrack(req.user.id, body);
  }

  @Put('pause-spotify-track')
  @UseGuards(JwtAuthGuard)
  async pauseTrack(@Req() req, @Body() body: { endpoint: string }) {
    return this.overviewSpotifyService.pauseTrack(req.user.id, body.endpoint);
  }

  @Post('next-spotify-track')
  @UseGuards(JwtAuthGuard)
  async nextTrack(@Req() req, @Body() body: { endpoint: string }) {
    return this.overviewSpotifyService.nextTrack(req.user.id, body.endpoint);
  }
  @Post('prev-track')
  @UseGuards(JwtAuthGuard)
  async prevTrack(@Req() req, @Body() body: { endpoint: string }) {
    return this.overviewSpotifyService.prevTrack(req.user.id, body.endpoint);
  }

  @Get('check-track-saved/:trackId')
  @UseGuards(JwtAuthGuard)
  async checkTrackSaved(@Req() req, @Param('trackId') trackId: string) {
    return this.overviewSpotifyService.checkTrackSaved(req.user.id, trackId);
  }

  @Delete('remove-from-library/:trackId')
  @UseGuards(JwtAuthGuard)
  async removeFromLibrary(@Req() req, @Param('trackId') trackId: string) {
    return this.overviewSpotifyService.removeFromLibrary(req.user.id, trackId);
  }

  @Put('save-to-library/:trackId')
  @UseGuards(JwtAuthGuard)
  async saveToLibrary(@Req() req, @Param('trackId') trackId: string) {
    return this.overviewSpotifyService.saveToLibrary(req.user.id, trackId);
  }

  @Put('seek')
  @UseGuards(JwtAuthGuard)
  async seek(
    @Req() req,
    @Body() body: { position_ms: number; device_id?: string },
  ) {
    return this.overviewSpotifyService.seek(
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
    return this.overviewSpotifyService.setRepeatMode(req.user.id, body.state);
  }

  @Put('set-volume')
  @UseGuards(JwtAuthGuard)
  async setVolume(
    @Req() req,
    @Body() body: { volume_percent: number; device_id?: string },
  ) {
    return this.overviewSpotifyService.setVolume(
      req.user.id,
      body.volume_percent,
      body.device_id,
    );
  }

  @Put('toggle-shuffle')
  @UseGuards(JwtAuthGuard)
  async toggleShuffle(@Req() req, @Body() body: { state: boolean }) {
    return this.overviewSpotifyService.toggleShuffle(req.user.id, body.state);
  }

  @Get('get-queue')
  @UseGuards(JwtAuthGuard)
  async getQueue(@Req() req) {
    return this.overviewSpotifyService.getQueue(req.user.id);
  }
}
