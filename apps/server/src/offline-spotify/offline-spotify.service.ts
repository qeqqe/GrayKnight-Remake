import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { SpotifyService } from '../spotify/spotify.service';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class OfflineSpotifyService implements OnApplicationBootstrap {
  private readonly logger = new Logger(OfflineSpotifyService.name);
  private activeUsers = new Set<string>();
  private batchSize = 50;
  private pollingInterval = 30000;

  // track playback states for each user
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
    private spotifyService: SpotifyService,
  ) {}

  async onApplicationBootstrap() {
    await this.initializeActiveUsers();
  }

  private async initializeActiveUsers() {
    const activeUsers = await this.prisma.user.findMany({
      where: { offlineTrackingEnabled: true },
      select: { id: true },
    });

    activeUsers.forEach((user) => this.activeUsers.add(user.id));
    this.logger.log(
      `Initialized ${activeUsers.length} active users for offline tracking`,
    );
  }

  async enableOfflineTracking(userId: string) {
    this.activeUsers.add(userId);
    await this.prisma.user.update({
      where: { id: userId },
      data: { offlineTrackingEnabled: true },
    });
    return { success: true, enabled: true };
  }

  async disableOfflineTracking(userId: string) {
    this.activeUsers.delete(userId);
    await this.prisma.user.update({
      where: { id: userId },
      data: { offlineTrackingEnabled: false },
    });
    return { success: true, enabled: false };
  }

  @Cron('*/30 * * * * *')
  async handleOfflineScrobbling() {
    try {
      const activeUserIds = Array.from(this.activeUsers);
      this.logger.log(
        `Processing offline scrobbles for ${activeUserIds.length} users`,
      );

      // process users in batches to avoid overloading
      for (let i = 0; i < activeUserIds.length; i += this.batchSize) {
        const batch = activeUserIds.slice(i, i + this.batchSize);
        this.logger.log(`Processing batch of ${batch.length} users`);

        await Promise.all(
          batch.map((userId) => this.processUserScrobble(userId)),
        );
      }
    } catch (error) {
      this.logger.error('Error in offline scrobbling:', error);
    }
  }

  private async processUserScrobble(userId: string) {
    try {
      const currentTrack = await this.spotifyService.getCurrentTrack(userId);

      if (!currentTrack || !currentTrack.item) {
        this.logger.debug(`No current track for user ${userId}`);
        return;
      }

      const currentState = this.activePlaybackStates.get(userId);
      const currentTime = Date.now();

      // Reset state if track changed or no state exists
      if (!currentState || currentState.trackId !== currentTrack.item.id) {
        this.activePlaybackStates.set(userId, {
          trackId: currentTrack.item.id,
          startTime: currentTime,
          lastProgress: currentTrack.progress_ms,
          duration: currentTrack.item.duration_ms,
          scrobbled: false,
        });
        return;
      }

      // Handle seek/restart
      const progressDiff = currentTrack.progress_ms - currentState.lastProgress;
      if (progressDiff < -3000) {
        currentState.startTime = currentTime;
        currentState.lastProgress = currentTrack.progress_ms;
        currentState.scrobbled = false;
        return;
      }

      // Calculate progress
      const listenedPercentage =
        (currentTrack.progress_ms / currentTrack.item.duration_ms) * 100;
      const shouldScrobble =
        listenedPercentage >= 50 && !currentState.scrobbled;
      const actualListenedDuration = Math.max(0, progressDiff);

      // Update state
      currentState.lastProgress = currentTrack.progress_ms;

      // only process if should scrobble and playing
      if (shouldScrobble && currentTrack.is_playing) {
        // check for any recent scrobbles (including from main service)
        const recentScrobble = await this.prisma.trackPlay.findFirst({
          where: {
            userId,
            trackId: currentTrack.item.id,
            timestamp: {
              gte: new Date(currentTime - 60000), // check last minute to be safe
            },
          },
        });

        if (recentScrobble) {
          this.logger.debug(
            `Track already scrobbled recently: ${currentTrack.item.name}`,
          );
          currentState.scrobbled = true;
          return;
        }

        // Only update existing record without creating new one
        const existingTrackPlay = await this.prisma.trackPlay.findFirst({
          where: {
            userId,
            trackId: currentTrack.item.id,
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
              durationMs: {
                increment: currentTrack.item.duration_ms,
              },
              playedDurationMs: {
                increment: actualListenedDuration,
              },
            },
          });
        }

        currentState.scrobbled = true;
        this.logger.debug(
          `Updated duration for track ${currentTrack.item.name}`,
        );
      }
    } catch (error) {
      this.logger.error(`Error processing scrobble for user ${userId}:`, error);
    }
  }

  // offline scrobble stats for a user
  async getOfflineStats(userId: string) {
    const stats = await this.prisma.trackPlay.findMany({
      where: {
        userId,
        timestamp: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
      orderBy: {
        timestamp: 'desc',
      },
    });

    return {
      totalTracks: stats.length,
      tracks: stats,
      isEnabled: this.activeUsers.has(userId),
    };
  }
}
