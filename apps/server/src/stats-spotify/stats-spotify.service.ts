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
        completionRate: +this.calculateCompletionRate(
          overViewPageStatistics,
          userId,
        ),
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
  private async calculateCompletionRate(
    stats: OverviewPageStatistics,
    userId: string, // Add userId parameter
  ): Promise<number> {
    try {
      if (!stats.totalTracks || !stats.averageTrackDuration) return 0;

      // Get recent track plays for more accurate completion rate
      const recentPlays = await this.prisma.trackPlay.findMany({
        where: {
          userId, // Now userId is properly defined
          timestamp: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
        select: {
          playedDurationMs: true,
          durationMs: true,
          skipped: true,
        },
      });

      if (recentPlays.length === 0) return 0;

      let totalActualDuration = 0;
      let totalExpectedDuration = 0;
      let skippedTracks = 0;

      recentPlays.forEach((play) => {
        if (play.skipped) {
          skippedTracks++;
        }

        if (play.playedDurationMs && play.durationMs) {
          totalActualDuration += play.playedDurationMs;
          totalExpectedDuration += play.durationMs;
        }
      });

      // Adjust completion rate based on skip ratio
      const skipRatio = skippedTracks / recentPlays.length;
      const baseCompletionRate =
        totalExpectedDuration > 0
          ? (totalActualDuration / totalExpectedDuration) * 100
          : 0;

      // Apply penalties for excessive skipping
      const adjustedCompletionRate = baseCompletionRate * (1 - skipRatio * 0.5);

      // Ensure rate is between 0 and 100
      return Math.min(Math.max(adjustedCompletionRate, 0), 100);
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
    try {
      // Calculate discovery rate with minimum play threshold
      const minPlaysForDiscovery = 10;
      const discoveryRate =
        stats.totalTracks >= minPlaysForDiscovery
          ? (stats.uniqueTracks / stats.totalTracks) * 100
          : 50; // Default to 50% for new users

      // Enhanced listening style determination
      const genreCount = stats.patterns.genreDiversity.total;
      const repeatRate = stats.totalTracks / Math.max(stats.uniqueTracks, 1);
      const artistRate = stats.uniqueArtists / Math.max(stats.uniqueTracks, 1);

      let listeningStyle: {
        type: 'Explorer' | 'Specialist' | 'Balanced';
        description: string;
      } = {
        type: 'Balanced',
        description: 'You mix favorites with new discoveries',
      };

      if (stats.totalTracks < minPlaysForDiscovery) {
        listeningStyle = {
          type: 'Explorer',
          description: 'Starting your musical journey',
        };
      } else if (repeatRate > 3 && artistRate < 0.3) {
        listeningStyle = {
          type: 'Specialist',
          description: 'You have strong favorites you love returning to',
        };
      } else if (repeatRate < 1.5 && genreCount > 5) {
        listeningStyle = {
          type: 'Explorer',
          description: 'You actively seek out new music across genres',
        };
      }

      // Enhanced artist variety calculation
      const varietyScore = this.calculateArtistVarietyScore(
        stats.uniqueArtists,
        stats.totalTracks,
        stats.patterns.genreDiversity.total,
      );

      stats.patterns = {
        ...stats.patterns,
        discoveryRate,
        listeningStyle,
        artistVariety: {
          score: varietyScore,
          level: this.getVarietyLevel(varietyScore),
        },
      };
    } catch (error) {
      this.logger.error('Error enhancing pattern analysis:', error);
    }
  }

  private calculateArtistVarietyScore(
    uniqueArtists: number,
    totalTracks: number,
    genreCount: number,
  ): number {
    if (totalTracks === 0) return 0;

    const baseScore = (uniqueArtists / totalTracks) * 100;
    const genreBonus = Math.min((genreCount / 10) * 20, 20); // up to 20% bonus for genre diversity

    return Math.min(baseScore + genreBonus, 100);
  }

  private getVarietyLevel(score: number): 'High' | 'Medium' | 'Low' {
    if (score >= 70) return 'High';
    if (score >= 40) return 'Medium';
    return 'Low';
  }

  private async calculatePeakHour(
    userId: string,
    since: Date,
  ): Promise<{ hour: number; percentage: number }> {
    try {
      // get all plays with timestamps
      const plays = await this.prisma.trackPlay.findMany({
        where: {
          userId,
          timestamp: {
            gte: since,
          },
        },
        select: {
          timestamp: true,
          playCount: true,
          durationMs: true,
        },
      });

      if (plays.length === 0) {
        return { hour: 0, percentage: 0 };
      }

      // initialize 24-hour distribution with weighted scores
      const hourDistribution = new Array(24).fill(0);
      let totalWeight = 0;

      plays.forEach((play) => {
        const hour = new Date(play.timestamp).getHours();
        // Weight calculation based on play count and duration
        const weight = play.playCount * (play.durationMs / (3 * 60 * 1000)); // Normalize by 3-minute standard
        hourDistribution[hour] += weight;
        totalWeight += weight;
      });

      // Smooth distribution to account for timezone boundaries
      const smoothedDistribution = hourDistribution.map((count, i) => {
        const prev = hourDistribution[(i + 23) % 24];
        const next = hourDistribution[(i + 1) % 24];
        return prev * 0.15 + count * 0.7 + next * 0.15;
      });

      // Find peak hour and calculate percentage
      let peakHour = 0;
      let maxActivity = 0;
      smoothedDistribution.forEach((activity, hour) => {
        if (activity > maxActivity) {
          maxActivity = activity;
          peakHour = hour;
        }
      });

      const peakPercentage =
        totalWeight > 0 ? (maxActivity / totalWeight) * 100 : 0;

      return {
        hour: peakHour,
        percentage: Math.min(Math.round(peakPercentage), 100),
      };
    } catch (error) {
      this.logger.error('Error calculating peak hour:', error);
      return { hour: 0, percentage: 0 };
    }
  }
}
