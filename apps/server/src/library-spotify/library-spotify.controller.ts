import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { LibrarySpotifyService } from './library-spotify.service';
import { JwtAuthGuard } from 'src/auth/strategies/jwt.guard';

@Controller('library-spotify')
export class LibrarySpotifyController {
  constructor(private librarySpotifyService: LibrarySpotifyService) {}
  @Get('current-user-playlist')
  @UseGuards(JwtAuthGuard)
  async getCurrentUser(@Req() req) {
    return this.librarySpotifyService.getCurrentUserPlaylist(req.user.id);
  }

  @Get('get-playlist-item/:playlistId')
  @UseGuards(JwtAuthGuard)
  async getPlaylistItem(@Req() req) {
    return this.librarySpotifyService.getPlaylistItem(
      req.user.id,
      req.params.playlistId,
    );
  }

  @Get('get-top-items/:type/:time_range')
  @UseGuards(JwtAuthGuard)
  async getTopItems(@Req() req) {
    return this.librarySpotifyService.getTopItems(
      req.user.id,
      req.params.type,
      req.params.time_range,
    );
  }
}
