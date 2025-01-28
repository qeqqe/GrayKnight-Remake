import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuthService } from 'src/auth/auth.service';
import { RateLimiterMemory } from 'rate-limiter-flexible';

@Injectable()
export class SpotifyService {
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

  constructor(
    private prisma: PrismaService,
    private authService: AuthService,
  ) {
    this.volumeRateLimiter = new RateLimiterMemory({
      points: 1,
      duration: 1,
    });
  }

  private readonly logger = new Logger(SpotifyService.name);

  async getUserProfile(userId: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          spotifyId: true,
          email: true,
          displayName: true,
          profileUrl: true,
        },
      });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      if (!user.profileUrl) {
        user.profileUrl = 'https://api.dicebear.com/7.x/avataaars/svg';
      }

      return user;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  }

  async getCurrentTrack(userId: string) {
    const accessToken = await this.authService.refreshToken(userId);

    const response = await fetch(
      'https://api.spotify.com/v1/me/player/currently-playing',
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    if (response.status === 204) {
      return null;
    }

    if (!response.ok) {
      throw new UnauthorizedException('Failed to fetch current track');
    }

    const text = await response.text(); // get response as text first
    try {
      const data = text ? JSON.parse(text) : null; // parse if there's content
      if (data?.item) {
        await this.handlePlaybackState(userId, data);
      }
      return data;
    } catch (error) {
      console.error('Error parsing response:', error);
      return null;
    }
  }

  private async handlePlaybackState(userId: string, data: any) {
    const currentState = this.activePlaybackStates.get(userId);
    const currentTime = Date.now();

    // if this is a new track or returning to an unfinished track
    if (!currentState || currentState.trackId !== data.item.id) {
      this.activePlaybackStates.set(userId, {
        trackId: data.item.id,
        startTime: currentTime,
        lastProgress: data.progress_ms,
        duration: data.item.duration_ms,
        scrobbled: false,
      });
      return;
    }

    // update progress
    const progressDiff = data.progress_ms - currentState.lastProgress;

    // if progress went backwards significantly or track was seeked
    if (progressDiff < -3000) {
      currentState.startTime = currentTime;
      currentState.lastProgress = data.progress_ms;
      return;
    }

    // calculate listening progress
    const listenedPercentage = (data.progress_ms / data.item.duration_ms) * 100;
    const shouldScrobble = listenedPercentage >= 50 && !currentState.scrobbled;

    // update state
    currentState.lastProgress = data.progress_ms;

    // if we should scrobble the track
    if (shouldScrobble && data.is_playing) {
      await this.trackPlayEvent(userId, data.item, data.context);
      currentState.scrobbled = true;
      console.log(`Scrobbled track ${data.item.name} for user ${userId}`);
    }
  }

  async getRecentTracks(userId: string) {
    const accessToken = await this.authService.refreshToken(userId);

    const response = await fetch(
      'https://api.spotify.com/v1/me/player/recently-played',
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    if (!response.ok) {
      throw new UnauthorizedException('Failed to fetch recent tracks');
    }

    return response.json();
  }

  async getArtistDetails(userId: string, artistId: string) {
    try {
      const accessToken = await this.authService.refreshToken(userId);

      const response = await fetch(
        `https://api.spotify.com/v1/artists/${artistId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      if (!response.ok) {
        throw new UnauthorizedException('Failed to fetch artist details');
      }

      return response.json();
    } catch (error) {
      console.error('Error fetching artist details:', error);
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

  async transferPlayback(userId: string, deviceId: string) {
    try {
      const accessToken = await this.authService.refreshToken(userId);

      const response = await fetch('https://api.spotify.com/v1/me/player', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          device_ids: [deviceId],
          play: true, // this ensures playback continues on the new device
        }),
      });

      if (response.status !== 204) {
        throw new UnauthorizedException('Failed to transfer playback');
      }

      return { success: true };
    } catch (error) {
      console.error('Error transferring playback:', error);
      throw error;
    }
  }

  async adjustVolume(userId: string, deviceId: string, volume: number) {
    try {
      const accessToken = await this.authService.refreshToken(userId);
      const response = await fetch(
        `https://api.spotify.com/v1/me/player/volume?volume_percent=${volume}&device_id=${deviceId}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      if (!response.ok) {
        throw new UnauthorizedException('Failed to adjust volume');
      }

      // update device volume in db
      await this.prisma.listeningSession.update({
        where: {
          id: userId,
        },
        data: {
          availableDevices: {
            set: [],
          },
        },
      });

      return response;
    } catch (error) {
      console.error('Error adjusting volume:', error);
      throw error;
    }
  }

  private async cacheArtistGenres(
    artistId: string,
    userId: string,
  ): Promise<string[]> {
    try {
      const cached = await this.prisma.artistGenreCache.findFirst({
        where: {
          AND: [{ artistId }, { userId }],
        },
      });

      if (
        cached &&
        cached.updatedAt > new Date(Date.now() - 24 * 60 * 60 * 1000)
      ) {
        await this.prisma.artistGenreCache.update({
          where: { id: cached.id },
          data: {
            playCount: { increment: 1 },
          },
        });
        return cached.genres;
      }

      const artistData = await this.getArtistDetails(userId, artistId);
      const cleanedGenres =
        artistData.genres?.map((genre) =>
          genre
            .trim()
            .toLowerCase()
            .replace(/["[\]]/g, ''),
        ) || [];

      const result = await this.prisma.artistGenreCache.upsert({
        where: {
          id: cached?.id || 'temp-id',
        },
        create: {
          artistId,
          userId,
          genres: cleanedGenres,
          playCount: 1,
        },
        update: {
          genres: cleanedGenres,
          playCount: { increment: 1 },
          updatedAt: new Date(),
        },
      });

      return result.genres;
    } catch (error) {
      this.logger.error('Error caching artist genres:', error);
      return [];
    }
  }

  async trackPlayEvent(userId: string, trackData: any, context?: any) {
    try {
      // Check for recent play
      const recentPlay = await this.prisma.trackPlay.findFirst({
        where: {
          userId,
          trackId: trackData.id,
          timestamp: {
            gte: new Date(Date.now() - 30000), // 30 seconds ago
          },
        },
      });

      if (recentPlay) {
        this.logger.log('Track recently scrobbled, skipping');
        return;
      }

      // Process genres and update cache for each artist
      const genrePromises = trackData.artists.map((artist) =>
        this.cacheArtistGenres(artist.id, userId),
      );
      await Promise.all(genrePromises);

      // Create track play record
      await this.prisma.trackPlay.create({
        data: {
          userId,
          trackId: trackData.id,
          trackName: trackData.name,
          artistIds: trackData.artists.map((a) => a.id),
          artistNames: trackData.artists.map((a) => a.name),
          albumName: trackData.album.name,
          durationMs: trackData.duration_ms,
          playedDurationMs:
            this.activePlaybackStates.get(userId)?.lastProgress ||
            trackData.duration_ms,
          popularity: trackData.popularity,
          contextType: context?.type,
          contextUri: context?.uri,
          timestamp: new Date(),
        },
      });
    } catch (error) {
      this.logger.error('Error recording track play:', error);
      throw error;
    }
  }
}
