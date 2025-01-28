import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from 'src/auth/auth.service';

@Injectable()
export class RecentSpotifyService {
  constructor(private authService: AuthService) {}
  async getRecentlyPlayed(userId: string, after?: string, limit: number = 20) {
    try {
      const accessToken = await this.authService.refreshToken(userId);
      const params = new URLSearchParams({
        limit: limit.toString(),
        ...(after && { after }),
      });

      const response = await fetch(
        `https://api.spotify.com/v1/me/player/recently-played?${params}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      if (!response.ok) {
        throw new UnauthorizedException('Failed to fetch recently played');
      }

      const data = await response.json();

      // Get the timestamp of the last item for the next cursor
      const lastItem = data.items[data.items.length - 1];
      const nextCursor = lastItem
        ? new Date(lastItem.played_at).getTime()
        : null;

      return {
        items: data.items,
        cursors: {
          after: nextCursor ? nextCursor.toString() : null,
        },
        next: data.items.length >= limit,
      };
    } catch (error) {
      console.error('Error fetching recently played:', error);
      throw error;
    }
  }
}
