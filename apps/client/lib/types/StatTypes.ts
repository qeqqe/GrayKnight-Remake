export interface TimeRange {
  start: Date;
  end: Date;
}

export interface ListeningStats {
  totalTracks: number;
  uniqueTracks: number;
  uniqueArtists: number;
  totalDuration: number;
  averageTrackDuration: number;
  skipRate: number;
}

export interface GenreStat {
  genre: string;
  count: number;
  percentage: number;
}

export interface TimeDistributionPoint {
  hour: number;
  count: number;
}

export interface DailyStat {
  date: string;
  trackCount: number;
  totalDuration: number;
  uniqueTracks: number;
}

export interface ArtistStat {
  artistId: string;
  artistName: string;
  playCount: number;
  totalDuration: number;
}

export interface StatsResponse {
  overview: ListeningStats;
  timeDistribution: TimeDistributionPoint[];
  dailyStats: DailyStat[];
  topGenres: GenreStat[];
  topArtists: ArtistStat[];
}
