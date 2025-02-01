import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { OverviewPageStatistics } from '../types/index';

@Injectable()
export class StatsSpotifyService {
  private readonly logger = new Logger(StatsSpotifyService.name);

  constructor(private prisma: PrismaService) {}

  async getOverviewStats(userId: string) {
    this.logger.log(`Fetching overview stats for user ${userId}`);

    // Initialize with defaults to handle edge cases
    const overViewPageStatistics: OverviewPageStatistics = {
      totalTracks: 0,
      uniqueTracks: 0,
      uniqueArtists: 0,
      totalDuration: 0,
      averageTrackDuration: 0,
      dailyAverage: {
        tracks: 0,
        duration: 0,
      },
      patterns: {
        hourlyActivity: 0,
        peakHour: 0,
        genreDiversity: {
          total: 0,
          topGenre: '',
          topGenrePercentage: 0,
        },
        completionRate: 0,
      },
    };

    try {
      // Limit data to last 7d for relevant insights
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      // Aggregate core metrics for overview
      const recentStats = await this.prisma.trackPlay.aggregate({
        where: {
          userId,
          timestamp: {
            gte: sevenDaysAgo,
          },
        },
        _sum: {
          playCount: true,
          playedDurationMs: true, // Include actual played duration
        },
        _count: {
          trackId: true,
        },
      });

      // Identify unique artists for diversity metrics
      const uniqueArtists = await this.prisma.trackPlay.groupBy({
        by: ['artistIds'],
        where: {
          userId,
          timestamp: {
            gte: sevenDaysAgo,
          },
        },
      });

      // Determine actual listening days for accurate averages
      const activeDays = await this.prisma.trackPlay.groupBy({
        by: ['timestamp'],
        where: {
          userId,
          timestamp: {
            gte: sevenDaysAgo,
          },
        },
        _count: true,
      });

      const numberOfActiveDays = new Set(
        activeDays.map((day) => new Date(day.timestamp).toDateString()),
      ).size;

      const totalTracks = recentStats._sum.playCount ?? 0;
      const totalDuration = recentStats._sum.playedDurationMs ?? 0;

      overViewPageStatistics.totalTracks = totalTracks;
      overViewPageStatistics.uniqueTracks = recentStats._count.trackId;
      overViewPageStatistics.uniqueArtists = uniqueArtists.length;
      overViewPageStatistics.totalDuration = totalDuration;

      // Prevent skewed metrics from inactive days
      const actualDays = Math.max(numberOfActiveDays, 1); // Prevent division by zero
      overViewPageStatistics.dailyAverage = {
        tracks: Math.round(totalTracks / actualDays),
        duration: Math.round(totalDuration / actualDays),
      };

      // Ensure valid average duration when tracks exist
      if (totalTracks > 0) {
        overViewPageStatistics.averageTrackDuration = Math.round(
          totalDuration / totalTracks,
        );
      }

      // Analyze last 24h for detailed patterns
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

      // Identify peak usage patterns
      const hourlyStats = await this.prisma.trackPlay.groupBy({
        by: ['timestamp'],
        where: {
          userId,
          timestamp: {
            gte: twentyFourHoursAgo,
          },
        },
        _count: true,
        orderBy: {
          timestamp: 'asc',
        },
      });

      // Calculate hourly activity score
      const hourlyActivity =
        hourlyStats.length > 0
          ? hourlyStats.reduce((acc, curr) => acc + curr._count, 0) / 24
          : 0;

      // Derive engagement metrics from activity distribution
      overViewPageStatistics.patterns = {
        hourlyActivity,
        peakHour: this.calculatePeakHour(hourlyStats),
        genreDiversity: await this.calculateGenreDiversity(userId),
        completionRate: this.calculateCompletionRate(overViewPageStatistics),
      };

      this.logger.debug('Overview stats:', overViewPageStatistics);
      return overViewPageStatistics;
    } catch (error) {
      this.logger.error('Error fetching overview stats:', error);
      throw error;
    }
  }

  // Determines most active hour for targeted recommendations
  private calculatePeakHour(hourlyStats: any[]) {
    if (hourlyStats.length === 0) return null;
    return hourlyStats
      .reduce((max, curr) => (curr._count > max._count ? curr : max))
      .timestamp.getHours();
  }

  // Measures listening variety for user profiling
  private async calculateGenreDiversity(userId: string) {
    const genres = await this.getGenereStats(userId);
    return {
      total: genres.length,
      topGenre: genres[0]?.genre || null,
      topGenrePercentage: genres[0]?.percentage || 0,
    };
  }

  // Assesses user engagement through track completion
  private calculateCompletionRate(stats: OverviewPageStatistics) {
    if (!stats.totalTracks || !stats.averageTrackDuration) return 0;
    return (
      (stats.totalDuration / (stats.totalTracks * stats.averageTrackDuration)) *
      100
    );
  }

  // Analyzes genre distribution for music preferences
  async getGenereStats(userId: string) {
    this.logger.log(`Fetching genre stats for user ${userId}`);

    try {
      // Retrieve cached genre data for efficiency
      const genrePlays = await this.prisma.artistGenreCache.findMany({
        where: {
          userId,
        },
        select: {
          genres: true,
          playCount: true,
        },
      });

      // Consolidate genre counts for overall preference analysis
      const genreCounts = new Map<string, number>();
      genrePlays.forEach((artist) => {
        artist.genres.forEach((genre) => {
          const currentCount = genreCounts.get(genre) || 0;
          genreCounts.set(genre, currentCount + artist.playCount);
        });
      });

      // Focus on most significant genres for meaningful insights
      const sortedGenres = Array.from(genreCounts.entries())
        .map(([genre, count]) => ({
          genre,
          count,
          percentage: 0,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10); // Limit to top genres for clarity

      // Calculate relative importance of each genre
      const totalPlays = sortedGenres.reduce(
        (sum, genre) => sum + genre.count,
        0,
      );
      sortedGenres.forEach((genre) => {
        genre.percentage = (genre.count / totalPlays) * 100;
      });

      this.logger.debug('Top genres:', sortedGenres);
      return sortedGenres;
    } catch (error) {
      this.logger.error('Error fetching top genres:', error);
      throw error;
    }
  }
}
