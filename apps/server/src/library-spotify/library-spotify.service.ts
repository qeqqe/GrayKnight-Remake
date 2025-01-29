import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from 'src/auth/auth.service';

@Injectable()
export class LibrarySpotifyService {
  constructor(private authService: AuthService) {}

  async getCurrentUserPlaylist(userId: string) {
    try {
      const token = await this.authService.refreshToken(userId);

      const response = await fetch('https://api.spotify.com/v1/me/playlists', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new UnauthorizedException(
          error.error?.message || 'Failed to fetch playlists',
        );
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting current user playlist:', error);
      throw error;
    }
  }

  async getPlaylistItem(userId: string, playlistId: string) {
    try {
      const token = await this.authService.refreshToken(userId);

      const response = await fetch(
        `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        const error = await response.json();
        throw new UnauthorizedException(
          error.error?.message || 'Failed to fetch playlist items',
        );
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting playlist item:', error);
      throw error;
    }
  }
}
