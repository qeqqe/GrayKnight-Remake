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

      // if this is a new track or returning to an unfinished track
      if (!currentState || currentState.trackId !== currentTrack.item.id) {
        this.activePlaybackStates.set(userId, {
          trackId: currentTrack.item.id,
          startTime: currentTime,
          lastProgress: currentTrack.progress_ms,
          duration: currentTrack.item.duration_ms,
          scrobbled: false,
        });
        this.logger.debug(
          `New track started for user ${userId}: ${currentTrack.item.name}`,
        );
        return;
      }

      // update progress
      const progressDiff = currentTrack.progress_ms - currentState.lastProgress;

      // if progress went backwards significantly or track was seeked
      if (progressDiff < -3000) {
        currentState.startTime = currentTime;
        currentState.lastProgress = currentTrack.progress_ms;
        this.logger.debug(`Track seeked/restarted for user ${userId}`);
        return;
      }

      // calculate listening progress
      const listenedPercentage =
        (currentTrack.progress_ms / currentTrack.item.duration_ms) * 100;
      const shouldScrobble =
        listenedPercentage >= 50 && !currentState.scrobbled;

      // update state
      currentState.lastProgress = currentTrack.progress_ms;

      // if we should scrobble the track
      if (shouldScrobble && currentTrack.is_playing) {
        await this.spotifyService.trackPlayEvent(
          userId,
          currentTrack.item,
          currentTrack.context,
        );
        currentState.scrobbled = true;
        this.logger.log(
          `Scrobbled track ${currentTrack.item.name} for user ${userId}`,
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
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // last 24h
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
