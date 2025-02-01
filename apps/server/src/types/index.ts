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
    peakHourPercentage: number; // Add this
    genreDiversity: {
      total: number;
      topGenre: string;
      topGenrePercentage: number;
    };
    completionRate: number;
    listeningStyle: {
      type: 'Explorer' | 'Specialist' | 'Balanced';
      description: string;
    };
    discoveryRate: number;
    artistVariety: {
      score: number;
      level: 'Low' | 'Medium' | 'High';
    };
  };
}
