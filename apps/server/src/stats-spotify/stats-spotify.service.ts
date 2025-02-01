import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { TimeRange } from '../types';

interface GenreStat {
  genre: string;
  count: string | number;
}

interface ArtistStat {
  artistId: string;
  artistName: string;
  playCount: string | number;
  totalDuration: string | number;
}

@Injectable()
export class StatsSpotifyService {
  private readonly logger = new Logger(StatsSpotifyService.name);

  constructor(private prisma: PrismaService) {}

  private getTimeRangeFilter(range: string): TimeRange {
    const now = new Date();
    const start = new Date();

    switch (range) {
      case 'week':
        start.setDate(now.getDate() - 7);
        break;
      case 'month':
        start.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        start.setFullYear(now.getFullYear() - 1);
        break;
      default:
        start.setDate(now.getDate() - 7);
    }

    return { start, end: now };
  }

  async debugRawData(userId: string) {
    const tracks = await this.prisma.trackPlay.findMany({
      where: { userId },
      take: 10,
      orderBy: { timestamp: 'desc' },
    });

    return { tracks };
  }

  async getListeningStats(userId: string, timeRange: string) {
    const { start, end } = this.getTimeRangeFilter(timeRange);

    try {
      // First verify we have data
      const dataCheck = await this.prisma.trackPlay.count({
        where: {
          userId,
          timestamp: {
            gte: start,
            lte: end,
          },
        },
      });

      this.logger.debug(`Found ${dataCheck} tracks for user ${userId}`);

      const [overview, timeDistribution, dailyStats, genreStats, artistStats] =
        await Promise.all([
          // Overall stats - Fixed query
          this.prisma.$queryRaw`
          SELECT 
            CAST(COUNT(*) AS INTEGER) as "totalTracks",
            CAST(COUNT(DISTINCT "trackId") AS INTEGER) as "uniqueTracks",
            CAST(COUNT(DISTINCT unnest("artistIds")) AS INTEGER) as "uniqueArtists",
            CAST(SUM("durationMs") AS BIGINT) as "totalDuration",
            CAST(AVG("durationMs") AS FLOAT) as "averageTrackDuration",
            CAST(
              (COUNT(*) FILTER (WHERE skipped = true) * 100.0 / NULLIF(COUNT(*), 0))
              AS FLOAT
            ) as "skipRate"
          FROM "TrackPlay"
          WHERE "userId" = ${userId}
          AND timestamp >= ${start}
          AND timestamp <= ${end}
        `,

          // Time distribution - Fixed query
          this.prisma.$queryRaw`
          SELECT 
            CAST(EXTRACT(HOUR FROM timestamp) AS INTEGER) as hour,
            CAST(COUNT(*) AS INTEGER) as count
          FROM "TrackPlay"
          WHERE "userId" = ${userId}
          AND timestamp >= ${start}
          AND timestamp <= ${end}
          GROUP BY EXTRACT(HOUR FROM timestamp)
          ORDER BY hour
        `,

          // Daily stats - Fixed query
          this.prisma.$queryRaw`
          SELECT 
            CAST(DATE(timestamp) AS TEXT) as date,
            CAST(COUNT(*) AS INTEGER) as "trackCount",
            CAST(SUM("durationMs") AS BIGINT) as "totalDuration",
            CAST(COUNT(DISTINCT "trackId") AS INTEGER) as "uniqueTracks"
          FROM "TrackPlay"
          WHERE "userId" = ${userId}
          AND timestamp >= ${start}
          AND timestamp <= ${end}
          GROUP BY DATE(timestamp)
          ORDER BY date
        `,

          // Genre stats - Fixed query
          this.prisma.$queryRaw`
          WITH track_artists AS (
            SELECT DISTINCT unnest("artistIds") as "artistId"
            FROM "TrackPlay"
            WHERE "userId" = ${userId}
            AND timestamp >= ${start}
            AND timestamp <= ${end}
          )
          SELECT 
            genre,
            CAST(COUNT(*) AS INTEGER) as count
          FROM track_artists ta
          CROSS JOIN LATERAL unnest(
            (SELECT genres FROM "ArtistGenreCache" agc 
             WHERE agc."artistId" = ta."artistId" 
             AND agc."userId" = ${userId})
          ) as genre
          GROUP BY genre
          ORDER BY count DESC
          LIMIT 10
        `,

          // Artist stats - Fixed query
          this.prisma.$queryRaw`
          SELECT 
            "artistId",
            "artistName",
            CAST(COUNT(*) AS INTEGER) as "playCount",
            CAST(SUM("durationMs") AS BIGINT) as "totalDuration"
          FROM (
            SELECT 
              unnest("artistIds") as "artistId",
              unnest("artistNames") as "artistName",
              "durationMs"
            FROM "TrackPlay"
            WHERE "userId" = ${userId}
            AND timestamp >= ${start}
            AND timestamp <= ${end}
          ) as expanded
          GROUP BY "artistId", "artistName"
          ORDER BY "playCount" DESC
          LIMIT 10
        `,
        ]);

      this.logger.debug('Raw query results:', {
        overview,
        timeDistribution,
        dailyStats,
        genreStats,
        artistStats,
      });

      const result = {
        overview: overview?.[0] || {
          totalTracks: 0,
          uniqueTracks: 0,
          uniqueArtists: 0,
          totalDuration: 0,
          averageTrackDuration: 0,
          skipRate: 0,
        },
        timeDistribution: timeDistribution || [],
        dailyStats: dailyStats || [],
        topGenres:
          (genreStats as GenreStat[])?.map((g) => ({
            genre: g.genre,
            count: Number(g.count),
            percentage:
              (Number(g.count) / Number(overview?.[0]?.totalTracks || 1)) * 100,
          })) || [],
        topArtists:
          (artistStats as ArtistStat[])?.map((artist) => ({
            artistId: artist.artistId,
            artistName: artist.artistName,
            playCount: Number(artist.playCount),
            totalDuration: Number(artist.totalDuration),
          })) || [],
      };

      return result;
    } catch (error) {
      this.logger.error('Error in getListeningStats:', error);
      throw error;
    }
  }
}
