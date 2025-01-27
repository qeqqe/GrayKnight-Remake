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
    // Initialize rate limiter: 1 request per second per user
    this.volumeRateLimiter = new RateLimiterMemory({
      points: 1, // 1 request
      duration: 1, // per 1 second
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

  private async cacheArtistGenres(
    artistId: string,
    userId: string,
  ): Promise<string[]> {
    try {
      // Check cache first
      const cached = await this.prisma.artistGenreCache.findUnique({
        where: { artistId },
      });

      // If cache is fresh (less than 24 hours old), use it
      if (
        cached &&
        cached.updatedAt > new Date(Date.now() - 24 * 60 * 60 * 1000)
      ) {
        return cached.genres;
      }

      // Fetch fresh data
      const artistData = await this.getArtistDetails(userId, artistId);

      // Update cache
      await this.prisma.artistGenreCache.upsert({
        where: { artistId },
        create: {
          artistId,
          genres: artistData.genres || [],
        },
        update: {
          genres: artistData.genres || [],
        },
      });

      return artistData.genres || [];
    } catch (error) {
      console.error('Error caching artist genres:', error);
      return [];
    }
  }

  async trackPlayEvent(userId: string, trackData: any, context?: any) {
    try {
      // first check if this track was recently scrobbled (within last 30 seconds)
      const recentPlay = await this.prisma.trackPlay.findFirst({
        where: {
          userId,
          trackId: trackData.id,
          timestamp: {
            gte: new Date(Date.now() - 30000),
          },
        },
      });

      if (recentPlay) {
        console.log('Track recently scrobbled, skipping');
        return;
      }

      const genrePromises = trackData.artists.map((artist) =>
        this.cacheArtistGenres(artist.id, userId),
      );
      const artistGenres = await Promise.all(genrePromises);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const uniqueGenres = [...new Set(artistGenres.flat())];

      const currentState = this.activePlaybackStates.get(userId);
      const playedDuration = currentState
        ? currentState.lastProgress
        : trackData.duration_ms;

      await this.prisma.trackPlay.create({
        data: {
          userId,
          trackId: trackData.id,
          trackName: trackData.name,
          artistIds: trackData.artists.map((a) => a.id),
          artistNames: trackData.artists.map((a) => a.name),
          albumName: trackData.album.name,
          durationMs: trackData.duration_ms,
          playedDurationMs: playedDuration,
          popularity: trackData.popularity,
          contextType: context?.type,
          contextUri: context?.uri,
          timestamp: new Date(),
        },
      });
    } catch (error) {
      console.error('Error recording track play:', error);
      throw error;
    }
  }

  async totalTracks(userID: string) {
    try {
      this.logger.log('Got a request to fetch the total Track');
      const response = await this.prisma.trackPlay.findMany({
        where: {
          userId: userID,
        },
        orderBy: {
          timestamp: 'desc',
        },
      });
      this.logger.log(`Got the response: ${response}`);
      return response;
    } catch (error) {
      console.error('Error recording track play:', error);
      throw error;
    }
  }
}
