import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuthService } from 'src/auth/auth.service';

@Injectable()
export class SpotifyService {
  constructor(
    private prisma: PrismaService,
    private authService: AuthService,
  ) {}

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

      console.log('User data from database:', user);

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

    // Handle 204 No Content response
    if (response.status === 204) {
      return null;
    }

    if (!response.ok) {
      throw new UnauthorizedException('Failed to fetch current track');
    }

    const text = await response.text(); // Get response as text first
    try {
      return text ? JSON.parse(text) : null; // Parse if there's content
    } catch (error) {
      console.error('Error parsing response:', error);
      return null;
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
      const accessToken = await this.authService.refreshToken(userId);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new UnauthorizedException('Failed to add to queue');
      }

      return response;
    } catch (error) {
      console.error('Error adding to queue:', error);
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
}
