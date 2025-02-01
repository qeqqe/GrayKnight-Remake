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
        listeningStyle: {
          type: 'Balanced',
          description: '',
        },
        discoveryRate: 0,
        artistVariety: {
          score: 0,
          level: 'Low',
        },
        peakHourPercentage: 0,
      },
    };

    try {
      // Get total tracks from ArtistGenreCache
      const artistStats = await this.prisma.artistGenreCache.aggregate({
        where: {
          userId,
        },
        _sum: {
          playCount: true,
        },
        _count: {
          artistId: true, // This gives us unique artists count directly
        },
      });

      // Get unique tracks count
      const uniqueTracks = await this.prisma.trackPlay.groupBy({
        by: ['trackId'],
        where: {
          userId,
        },
      });

      const totalTracks = artistStats._sum.playCount || 0;
      const uniqueArtists = artistStats._count.artistId || 0;

      overViewPageStatistics.totalTracks = totalTracks;
      overViewPageStatistics.uniqueTracks = uniqueTracks.length;
      overViewPageStatistics.uniqueArtists = uniqueArtists;

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
          durationMs: true, // Add this to get total possible duration
        },
        _count: {
          trackId: true,
        },
      });

      // Identify unique artists for diversity metrics
      const artistsGrouped = await this.prisma.trackPlay.groupBy({
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

      const totalTracksCount = recentStats._sum.playCount ?? 0;
      const totalDuration = recentStats._sum.playedDurationMs ?? 0;
      const totalPossibleDuration = recentStats._sum.durationMs ?? 0;

      overViewPageStatistics.totalTracks = totalTracksCount;
      overViewPageStatistics.uniqueTracks = recentStats._count.trackId;
      const uniqueArtistCount = artistsGrouped.length;
      overViewPageStatistics.uniqueArtists = uniqueArtistCount;
      overViewPageStatistics.totalDuration = totalDuration;

      // Prevent skewed metrics from inactive days
      const actualDays = Math.max(numberOfActiveDays, 1); // Prevent division by zero
      overViewPageStatistics.dailyAverage = {
        tracks: Math.round(totalTracksCount / actualDays),
        duration: Math.round(totalDuration / actualDays),
      };

      // Ensure valid average duration when tracks exist
      if (totalTracksCount > 0) {
        overViewPageStatistics.averageTrackDuration = Math.round(
          totalDuration / totalTracksCount,
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
        peakHour:
          (await this.calculatePeakHour(userId, twentyFourHoursAgo)).hour || 0,
        genreDiversity: await this.calculateGenreDiversity(userId),
        completionRate: this.calculateCompletionRate(overViewPageStatistics),
        listeningStyle: {
          type: 'Balanced',
          description: '',
        },
        discoveryRate: 0,
        artistVariety: {
          score: 0,
          level: 'Low',
        },
        peakHourPercentage: 0,
      };

      // Calculate completion rate
      const completionRate =
        totalPossibleDuration > 0
          ? (totalDuration / totalPossibleDuration) * 100
          : 0;

      // Update patterns with accurate completion rate
      overViewPageStatistics.patterns = {
        ...overViewPageStatistics.patterns,
        completionRate: Math.min(Math.max(completionRate, 0), 100),
      };

      // After calculating basic stats, enhance with pattern analysis
      await this.enhancePatternAnalysis(userId, overViewPageStatistics);

      // Get peak hour data
      const { hour, percentage } = await this.calculatePeakHour(
        userId,
        sevenDaysAgo,
      );

      overViewPageStatistics.patterns = {
        ...overViewPageStatistics.patterns,
        peakHour: hour,
        peakHourPercentage: percentage, // Add this to your types
      };

      this.logger.debug('Overview stats:', overViewPageStatistics);
      return overViewPageStatistics;
    } catch (error) {
      this.logger.error('Error fetching overview stats:', error);
      throw error;
    }
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
  private calculateCompletionRate(stats: OverviewPageStatistics): number {
    try {
      // Calculate completion rate based on actual played duration vs total possible duration
      if (!stats.totalTracks || !stats.averageTrackDuration) return 0;

      const completionRate =
        (stats.totalDuration /
          (stats.totalTracks * stats.averageTrackDuration)) *
        100;

      // Cap at 100% and ensure it's not negative
      return Math.min(Math.max(completionRate, 0), 100);
    } catch (error) {
      this.logger.error('Error calculating completion rate:', error);
      return 0;
    }
  }

  // Analyzes genre distribution for music preferences
  async getGenereStats(userId: string) {
    this.logger.log(`Fetching genre stats for user ${userId}`);

    try {
      // Get all track plays with artist info
      const trackPlays = await this.prisma.trackPlay.findMany({
        where: {
          userId,
          timestamp: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
          },
        },
        select: {
          artistIds: true,
          playCount: true,
        },
      });

      // Get genre data for all artists
      const artistGenres = await this.prisma.artistGenreCache.findMany({
        where: {
          userId,
          artistId: {
            in: [...new Set(trackPlays.flatMap((play) => play.artistIds))],
          },
        },
        select: {
          artistId: true,
          genres: true,
        },
      });

      // Create artist ID to genres map
      const artistGenreMap = new Map(
        artistGenres.map((ag) => [ag.artistId, ag.genres]),
      );

      // Count genres with play counts
      const genreCounts = new Map<string, number>();
      let totalGenrePlays = 0;

      trackPlays.forEach((play) => {
        const playCount = play.playCount || 1;
        play.artistIds.forEach((artistId) => {
          const genres = artistGenreMap.get(artistId) || ['Unclassified'];
          genres.forEach((genre) => {
            if (genre && genre.trim()) {
              // Only count non-empty genres
              const currentCount = genreCounts.get(genre) || 0;
              genreCounts.set(genre, currentCount + playCount);
              totalGenrePlays += playCount;
            }
          });
        });
      });

      // Convert to sorted array
      const sortedGenres = Array.from(genreCounts.entries())
        .map(([genre, count]) => ({
          genre: genre === 'Unclassified' ? 'Other' : genre,
          count,
          percentage: 0,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Calculate percentages
      if (totalGenrePlays > 0) {
        sortedGenres.forEach((genre) => {
          genre.percentage = (genre.count / totalGenrePlays) * 100;
        });
      }

      this.logger.debug('Top genres:', sortedGenres);
      return sortedGenres;
    } catch (error) {
      this.logger.error('Error fetching top genres:', error);
      throw error;
    }
  }

  private determineListeningStyle(
    uniqueTracks: number,
    totalTracks: number,
    genreCount: number,
  ): { type: 'Explorer' | 'Specialist' | 'Balanced'; description: string } {
    const repetitionRate = totalTracks / uniqueTracks;
    const genreDiversity = genreCount > 8;

    if (repetitionRate < 1.5 && genreDiversity) {
      return {
        type: 'Explorer',
        description: 'You love discovering new music across genres',
      };
    } else if (repetitionRate > 3) {
      return {
        type: 'Specialist',
        description: 'You know what you like and stick to favorites',
      };
    }
    return {
      type: 'Balanced',
      description: 'You mix favorites with new discoveries',
    };
  }

  private calculateArtistVariety(
    uniqueArtists: number,
    totalTracks: number,
  ): { score: number; level: 'High' | 'Medium' | 'Low' } {
    const varietyScore = (uniqueArtists / totalTracks) * 100;
    return {
      score: varietyScore,
      level: varietyScore > 40 ? 'High' : varietyScore > 20 ? 'Medium' : 'Low',
    };
  }

  private async enhancePatternAnalysis(
    userId: string,
    stats: OverviewPageStatistics,
  ): Promise<void> {
    // Calculate discovery rate (unique tracks / total tracks in period)
    const discoveryRate = (stats.uniqueTracks / stats.totalTracks) * 100;

    // Determine listening style
    const genreCount = stats.patterns.genreDiversity.total;
    const listeningStyle = this.determineListeningStyle(
      stats.uniqueTracks,
      stats.totalTracks,
      genreCount,
    );

    // Calculate artist variety
    const artistVariety = this.calculateArtistVariety(
      stats.uniqueArtists,
      stats.totalTracks,
    );

    // Update the patterns object
    stats.patterns = {
      ...stats.patterns,
      discoveryRate,
      listeningStyle,
      artistVariety,
    };
  }

  private async calculatePeakHour(
    userId: string,
    since: Date,
  ): Promise<{ hour: number; percentage: number }> {
    // Group by hour and count tracks
    const hourlyPlays = await this.prisma.trackPlay.groupBy({
      by: ['timestamp'],
      where: {
        userId,
        timestamp: {
          gte: since,
        },
      },
      _count: true,
    });

    // Create 24-hour distribution
    const hourDistribution = new Array(24).fill(0);
    hourlyPlays.forEach((play) => {
      const hour = new Date(play.timestamp).getHours();
      hourDistribution[hour] += play._count;
    });

    // Find peak hour and calculate percentage
    const totalPlays = hourDistribution.reduce((sum, count) => sum + count, 0);
    const peakHour = hourDistribution.reduce(
      (max, count, hour) => (count > hourDistribution[max] ? hour : max),
      0,
    );
    const peakPercentage = totalPlays
      ? (hourDistribution[peakHour] / totalPlays) * 100
      : 0;

    return {
      hour: peakHour,
      percentage: peakPercentage,
    };
  }
}
