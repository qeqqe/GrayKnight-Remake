import {
  Body,
  Controller,
  Get,
  Put,
  Req,
  UseGuards,
  Param,
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
}
