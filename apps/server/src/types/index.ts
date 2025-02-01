export interface OverviewPageStatistics {
  totalTracks: number;
  uniqueTracks: number;
  uniqueArtists: number;
  totalDuration: number;
  averageTrackDuration: number;
  dailyAverage: {
    tracks: number;
    duration: number;
  };
  patterns: {
    hourlyActivity: number;
    peakHour: number;
    genreDiversity: {
      total: number;
      topGenre: string;
      topGenrePercentage: number;
    };
    completionRate: number;
  };
}
