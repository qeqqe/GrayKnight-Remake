import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from 'src/auth/auth.service';

@Injectable()
export class SearchSpotifyService {
  constructor(private authService: AuthService) {}
  async search(userId: string, options: any) {
    try {
      const accessToken = await this.authService.refreshToken(userId);

      const response = await fetch(
        `https://api.spotify.com/v1/search?q=${options.query}&type=${options.type}&limit=${options.limit}&offset=${options.offset}&market=${options.market}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      if (!response.ok) {
        throw new UnauthorizedException('Failed to search for tracks');
      }

      return response;
    } catch (error) {
      console.error('Error searching for tracks:', error);
      throw error;
    }
  }
  async addToQueue(userId: string, endpoint: string) {
    try {
      if (!endpoint) {
        throw new Error('Endpoint is required');
      }

      const accessToken = await this.authService.refreshToken(userId);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new UnauthorizedException(
          error.error?.message || 'Failed to add to queue',
        );
      }

      return { success: true };
    } catch (error) {
      console.error('Error adding to queue:', error);
      throw new UnauthorizedException(
        error.message || 'Failed to add to queue',
      );
    }
  }

  async fetchTopTracks(userId: string, artistId: string) {
    try {
      const accessToken = await this.authService.refreshToken(userId);

      const response = await fetch(
        `https://api.spotify.com/v1/artists/${artistId}/top-tracks`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      if (!response.ok) {
        throw new UnauthorizedException('Failed to fetch top tracks');
      }

      return response;
    } catch (error) {
      console.error('Error fetching top tracks:', error);
      throw error;
    }
  }

  async fetchTopItems(userId: string, type: string, time: string) {
    try {
      const accessToken = await this.authService.refreshToken(userId);

      const response = await fetch(
        `https://api.spotify.com/v1/me/top/${type}?time_range=${time}&limit=50`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      if (!response.ok) {
        throw new UnauthorizedException('Failed to fetch top items');
      }

      return response;
    } catch (error) {
      console.error('Error fetching top items:', error);
      throw error;
    }
  }
}
