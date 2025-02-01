import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import { AuthService } from 'src/auth/auth.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class OverviewSpotifyService {
  private logger = new Logger(OverviewSpotifyService.name);

  constructor(
    private prisma: PrismaService,
    private authService: AuthService,
  ) {}
  private volumeRateLimiter: RateLimiterMemory;
  private activePlaybackStates = new Map<
    string,
    {
      trackId: string;
      startTime: number;
      lastProgress: number;
      duration: number;
      scrobbled: boolean;
    }
  >();

  async totalTracks(userID: string) {
    try {
      const response = await this.prisma.artistGenreCache.aggregate({
        where: {
          userId: userID,
        },
        _sum: { playCount: true },
      });
      this.logger.log(`Got the response: ${response}`);
      return response;
    } catch (error) {
      console.error('Error recording track play:', error);
      throw error;
    }
  }

  async topGenres(userId: string) {
    try {
      const genreCaches = await this.prisma.artistGenreCache.findMany({
        where: {
          userId: userId,
        },
        select: {
          genres: true,
          playCount: true,
        },
        orderBy: {
          playCount: 'desc',
        },
      });

      const genreFrequencyMap = new Map<string, number>();

      genreCaches.forEach((cache) => {
        // Some artists don't have any generes so they must be excluded
        if (cache.genres && Array.isArray(cache.genres)) {
          cache.genres.forEach((genre) => {
            const cleanGenre = genre
              .trim()
              .toLowerCase()
              .replace(/["[\]]/g, ''); // Common regex to convert ["Hip Hop","Pop"] to Hip Hop, Pop
            if (cleanGenre) {
              const currentCount = genreFrequencyMap.get(cleanGenre) || 0;
              genreFrequencyMap.set(
                cleanGenre,
                currentCount + (cache.playCount || 1),
              );
            }
          });
        }
      });

      const sortedGenres = Array.from(genreFrequencyMap.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([genre, count]) => ({
          genre: genre
            .split(' ')
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' '),
          count,
        }))
        .slice(0, 10);

      return sortedGenres;
    } catch (error) {
      this.logger.error('Error getting top genres:', error);
      throw error;
    }
  }
  async getAvailableDevices(userId: string) {
    try {
      const accessToken = await this.authService.refreshToken(userId);

      const response = await fetch(
        'https://api.spotify.com/v1/me/player/devices',
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      if (!response.ok) {
        throw new UnauthorizedException('Failed to fetch available devices');
      }

      return response.json();
    } catch (error) {
      console.error('Error fetching available devices:', error);
      throw error;
    }
  }
  async playTrack(
    userId: string,
    body: {
      endpoint: string;
      body: {
        uris?: string[];
        position_ms?: number;
      };
    },
  ) {
    try {
      const accessToken = await this.authService.refreshToken(userId);

      // First, check for available devices
      const devices = await this.getAvailableDevices(userId);
      if (!devices.devices || devices.devices.length === 0) {
        throw new UnauthorizedException(
          'No available devices found. Please open Spotify on any device.',
        );
      }

      // Find active device or use the first available one
      const targetDevice =
        devices.devices.find((d) => d.is_active) || devices.devices[0];

      // Add device_id to endpoint if not present
      const endpoint = body.endpoint.includes('?')
        ? `${body.endpoint}&device_id=${targetDevice.id}`
        : `${body.endpoint}?device_id=${targetDevice.id}`;

      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body.body),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new UnauthorizedException(
          errorData.error?.message || 'Failed to play track',
        );
      }

      return response.ok;
    } catch (error) {
      console.error('Error playing track:', error);
      throw error;
    }
  }
  async pauseTrack(userId: string, endpoint: string) {
    try {
      const accessToken = await this.authService.refreshToken(userId);

      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new UnauthorizedException('Failed to pause track');
      }

      return response;
    } catch (error) {
      console.error('Error pausing track:', error);
      throw error;
    }
  }
  async nextTrack(userId: string, endpoint: string) {
    try {
      const accessToken = await this.authService.refreshToken(userId);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new UnauthorizedException('Failed to play next track');
      }

      return response;
    } catch (error) {
      console.error('Error playing next track:', error);
      throw error;
    }
  }

  async prevTrack(userId: string, endpoint: string) {
    try {
      const accessToken = await this.authService.refreshToken(userId);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new UnauthorizedException('Failed to play previous track');
      }

      return response;
    } catch (error) {
      console.error('Error playing previous track:', error);
      throw error;
    }
  }

  async checkTrackSaved(userId: string, trackId: string) {
    try {
      const accessToken = await this.authService.refreshToken(userId);

      const response = await fetch(
        `https://api.spotify.com/v1/me/tracks/contains?ids=${trackId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      if (!response.ok) {
        throw new UnauthorizedException('Failed to check if track is saved');
      }

      return await response.json();
    } catch (error) {
      console.error('Error checking if track is saved:', error);
      throw error;
    }
  }

  async removeFromLibrary(userId: string, trackId: string) {
    try {
      const accessToken = await this.authService.refreshToken(userId);

      const response = await fetch(
        `https://api.spotify.com/v1/me/tracks?ids=${trackId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ ids: [trackId] }),
        },
      );

      if (!response.ok) {
        throw new UnauthorizedException('Failed to remove track from library');
      }

      return { success: true };
    } catch (error) {
      console.error('Error removing track from library:', error);
      throw error;
    }
  }

  async saveToLibrary(userId: string, trackId: string) {
    try {
      const accessToken = await this.authService.refreshToken(userId);

      const response = await fetch(
        `https://api.spotify.com/v1/me/tracks?ids=${trackId}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ ids: [trackId] }),
        },
      );

      if (!response.ok) {
        throw new UnauthorizedException('Failed to save track to library');
      }

      return { success: true };
    } catch (error) {
      console.error('Error saving track to library:', error);
      throw error;
    }
  }

  async seek(userId: string, position_ms: number, device_id?: string) {
    try {
      const accessToken = await this.authService.refreshToken(userId);
      const queryParams = new URLSearchParams({
        position_ms: position_ms.toString(),
        ...(device_id && { device_id }),
      });

      const response = await fetch(
        `https://api.spotify.com/v1/me/player/seek?${queryParams}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      if (!response.ok) {
        throw new UnauthorizedException('Failed to seek track');
      }

      return { success: true };
    } catch (error) {
      console.error('Error seeking track:', error);
      throw error;
    }
  }

  async setRepeatMode(
    userId: string,
    state: 'track' | 'context' | 'off',
    deviceId?: string,
  ) {
    try {
      const accessToken = await this.authService.refreshToken(userId);

      if (!deviceId) {
        const devices = await this.getAvailableDevices(userId);
        const activeDevice = devices.devices?.find((d) => d.is_active);
        if (activeDevice) {
          deviceId = activeDevice.id;
        }
      }

      const params = new URLSearchParams({
        state,
        ...(deviceId && { device_id: deviceId }),
      });

      const response = await fetch(
        `https://api.spotify.com/v1/me/player/repeat?${params.toString()}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new UnauthorizedException(
          errorData.error?.message || 'Failed to set repeat mode',
        );
      }

      return { success: true, state };
    } catch (error) {
      console.error('Error setting repeat mode:', error);
      throw error;
    }
  }

  async setVolume(userId: string, volume_percent: number, device_id?: string) {
    try {
      await this.volumeRateLimiter.consume(userId);

      const accessToken = await this.authService.refreshToken(userId);

      const response = await fetch(
        `https://api.spotify.com/v1/me/player/volume?volume_percent=${volume_percent}${
          device_id ? `&device_id=${device_id}` : ''
        }`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      if (!response.ok) {
        if (response.status === 429) {
          throw new UnauthorizedException('Too many requests. Please wait.');
        }
        throw new UnauthorizedException('Failed to set volume');
      }

      return { success: true };
    } catch (error) {
      if (error.message === 'Too Many Requests') {
        throw new UnauthorizedException(
          'Too many volume adjustment requests. Please wait.',
        );
      }
      console.error('Error setting volume:', error);
      throw error;
    }
  }

  async toggleShuffle(userId: string, state: boolean) {
    try {
      const accessToken = await this.authService.refreshToken(userId);

      const response = await fetch(
        `https://api.spotify.com/v1/me/player/shuffle?state=${state}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      if (!response.ok) {
        throw new UnauthorizedException('Failed to toggle shuffle');
      }

      return { success: true };
    } catch (error) {
      console.error('Error toggling shuffle:', error);
      throw error;
    }
  }

  async getQueue(userId: string) {
    try {
      const token = await this.authService.refreshToken(userId);
      const response = await fetch(
        'https://api.spotify.com/v1/me/player/queue',
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        throw new UnauthorizedException('Failed to fetch queue');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching queue:', error);
      throw error;
    }
  }

  async getOverviewStats(userId: string) {
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const trackStats = await this.prisma.trackPlay.aggregate({
        where: {
          userId,
          timestamp: {
            gte: sevenDaysAgo,
          },
        },
        _sum: {
          playCount: true,
          playedDurationMs: true,
        },
      });

      const genreCaches = await this.prisma.artistGenreCache.findMany({
        where: {
          userId,
          updatedAt: {
            gte: sevenDaysAgo,
          },
        },
        select: {
          genres: true,
          playCount: true,
        },
        orderBy: {
          playCount: 'desc',
        },
        take: 1,
      });

      const topGenre = genreCaches[0]?.genres[0] || 'N/A';

      return {
        totalTracks: trackStats._sum.playCount || 0,
        totalDuration: trackStats._sum.playedDurationMs || 0,
        topGenre,
      };
    } catch (error) {
      this.logger.error('Error getting overview stats:', error);
      throw error;
    }
  }
}
