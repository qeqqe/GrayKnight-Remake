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
      actualPlayedDuration: number; // Add this to track actual played duration
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

    // Reset if new track
    if (!currentState || currentState.trackId !== data.item.id) {
      this.activePlaybackStates.set(userId, {
        trackId: data.item.id,
        startTime: currentTime,
        lastProgress: data.progress_ms,
        duration: data.item.duration_ms,
        scrobbled: false,
        actualPlayedDuration: 0, // Add this to track actual played duration
      });
      return;
    }

    // Calculate actual played duration since last check
    const progressDiff = data.progress_ms - currentState.lastProgress;

    // Only count positive progress (actual listening time)
    if (progressDiff > 0) {
      currentState.actualPlayedDuration += progressDiff;
    }

    // Handle seek/restart
    if (progressDiff < -3000) {
      currentState.startTime = currentTime;
      currentState.lastProgress = data.progress_ms;
      // Don't reset scrobbled status or actualPlayedDuration
      return;
    }

    // Calculate progress
    const listenedPercentage = (data.progress_ms / data.item.duration_ms) * 100;
    const shouldScrobble = listenedPercentage >= 50 && !currentState.scrobbled;

    // Update state
    currentState.lastProgress = data.progress_ms;

    if (shouldScrobble && data.is_playing) {
      // Check for recent scrobbles first
      const recentScrobble = await this.prisma.trackPlay.findFirst({
        where: {
          userId,
          trackId: data.item.id,
          timestamp: {
            gte: new Date(Date.now() - 30000),
          },
        },
      });

      if (!recentScrobble) {
        await this.trackPlayEvent(userId, data.item, data.context);
        currentState.scrobbled = true;
        this.logger.log(`Scrobbled track ${data.item.name} for user ${userId}`);
      }

      const existingTrackPlay = await this.prisma.trackPlay.findFirst({
        where: {
          userId,
          trackId: data.item.id,
        },
        orderBy: {
          timestamp: 'desc',
        },
      });

      if (existingTrackPlay) {
        await this.prisma.trackPlay.update({
          where: { id: existingTrackPlay.id },
          data: {
            playCount: { increment: 1 },
            playedDurationMs: {
              increment: currentState.actualPlayedDuration,
            },
          },
        });
      } else {
        await this.prisma.trackPlay.create({
          data: {
            userId,
            trackId: data.item.id,
            trackName: data.item.name,
            artistIds: data.item.artists.map((artist: any) => artist.id),
            artistNames: data.item.artists.map((artist: any) => artist.name),
            albumName: data.item.album.name,
            durationMs: data.item.duration_ms,
            playedDurationMs: currentState.actualPlayedDuration,
            popularity: data.item.popularity,
            playCount: 1,
            contextType: data.context?.type || null,
            contextUri: data.context?.uri || null,
            timestamp: new Date(),
          },
        });
      }

      currentState.scrobbled = true;
      // ! don't reset actualPlayedDuration as the user might continue listening
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
        this.logger.error(
          `Failed to fetch devices: ${response.status} ${response.statusText}`,
        );
        throw new UnauthorizedException('Failed to fetch available devices');
      }

      const data = await response.json();
      this.logger.log(
        `Found ${data.devices?.length || 0} devices for user ${userId}`,
      );
      return data;
    } catch (error) {
      this.logger.error('Error fetching available devices:', error);
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
          play: true,
        }),
      });

      if (response.status === 404) {
        this.logger.warn(`Device ${deviceId} not found or not available`);
        throw new UnauthorizedException('Device not found or not available');
      }

      if (response.status !== 204) {
        this.logger.error(
          `Failed to transfer playback: ${response.status} ${response.statusText}`,
        );
        throw new UnauthorizedException('Failed to transfer playback');
      }

      // Wait a moment and fetch current player state to confirm transfer
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const playerState = await this.getCurrentTrack(userId);

      return {
        success: true,
        activeDevice: playerState?.device?.id === deviceId,
      };
    } catch (error) {
      this.logger.error('Error transferring playback:', error);
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
      // Check existing cache with tighter conditions
      const cached = await this.prisma.artistGenreCache.findUnique({
        where: {
          artistId_userId: {
            artistId,
            userId,
          },
        },
      });

      // Cache is valid for 7 days
      const isCacheValid =
        cached &&
        cached.updatedAt > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      if (isCacheValid) {
        // Update play count and return cached genres
        await this.prisma.artistGenreCache.update({
          where: { id: cached.id },
          data: { playCount: { increment: 1 } },
        });
        return cached.genres;
      }

      // Fetch fresh data from Spotify API
      const artistData = await this.getArtistDetails(userId, artistId);
      const cleanedGenres =
        artistData.genres?.map((genre) =>
          genre
            .trim()
            .toLowerCase()
            .replace(/["[\]]/g, ''),
        ) || [];

      // Upsert with proper unique constraint
      const result = await this.prisma.artistGenreCache.upsert({
        where: {
          artistId_userId: {
            artistId,
            userId,
          },
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

      this.logger.debug(
        `Updated genre cache for artist ${artistId}: ${cleanedGenres.join(', ')}`,
      );
      return result.genres;
    } catch (error) {
      this.logger.error('Error caching artist genres:', error);
      return [];
    }
  }

  async trackPlayEvent(userId: string, track: any, context?: any) {
    try {
      // Check for recent plays without transaction
      const recentPlay = await this.prisma.trackPlay.findFirst({
        where: {
          userId,
          trackId: track.id,
          timestamp: {
            gte: new Date(Date.now() - 30000),
          },
        },
        orderBy: {
          timestamp: 'desc',
        },
      });

      if (recentPlay) {
        this.logger.debug(`Skipping duplicate scrobble for track ${track.id}`);
        return recentPlay;
      }

      // Cache genres for all artists
      await Promise.all(
        track.artists.map((artist) =>
          this.cacheArtistGenres(artist.id, userId),
        ),
      );

      // Find existing track play
      const existingTrackPlay = await this.prisma.trackPlay.findFirst({
        where: {
          userId,
          trackId: track.id,
        },
        orderBy: {
          timestamp: 'desc',
        },
      });

      if (existingTrackPlay) {
        return await this.prisma.trackPlay.update({
          where: { id: existingTrackPlay.id },
          data: {
            playCount: existingTrackPlay.playCount + 1,
            durationMs: existingTrackPlay.durationMs + track.duration_ms,
            playedDurationMs: existingTrackPlay.playedDurationMs
              ? existingTrackPlay.playedDurationMs +
                (track.played_duration_ms || track.duration_ms)
              : track.played_duration_ms || track.duration_ms,
            timestamp: new Date(),
            artistIds: track.artists.map((artist: any) => artist.id),
            artistNames: track.artists.map((artist: any) => artist.name),
            contextType: context?.type || null,
            contextUri: context?.uri || null,
          },
        });
      }

      // Create new record
      return await this.prisma.trackPlay.create({
        data: {
          userId,
          trackId: track.id,
          trackName: track.name,
          artistIds: track.artists.map((artist: any) => artist.id),
          artistNames: track.artists.map((artist: any) => artist.name),
          albumName: track.album.name,
          durationMs: track.duration_ms,
          playedDurationMs: track.played_duration_ms || track.duration_ms,
          popularity: track.popularity,
          playCount: 1,
          contextType: context?.type || null,
          contextUri: context?.uri || null,
          timestamp: new Date(),
        },
      });
    } catch (error) {
      this.logger.error('Error tracking play event:', error);
      throw error;
    }
  }
}
