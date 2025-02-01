"use client";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import {
  OverviewPageStatisticsInterface,
  StatItemProps,
} from "@/lib/types/StatTypes";
import { fetchOverviewStats } from "@/lib/spotify/stats";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    y: {
      beginAtZero: true,
      grid: {
        color: "rgba(255, 255, 255, 0.1)",
      },
      ticks: {
        color: "rgba(255, 255, 255, 0.7)",
      },
    },
    x: {
      grid: {
        color: "rgba(255, 255, 255, 0.1)",
      },
      ticks: {
        color: "rgba(255, 255, 255, 0.7)",
      },
    },
  },
  plugins: {
    legend: {
      labels: {
        color: "rgba(255, 255, 255, 0.7)",
      },
    },
  },
};

interface GenreData {
  genre: string;
  count: number;
  percentage: number;
}

const StatsSection = () => {
  const [loading, setLoading] = useState(true);
  const [genres, setGenres] = useState<GenreData[]>([]);
  const [stats, setStats] = useState<OverviewPageStatisticsInterface>({
    totalTracks: 0,
    uniqueTracks: 0,
    uniqueArtists: 0,
    totalDuration: 0,
    averageTrackDuration: 0,
    dailyAverage: {
      tracks: 0,
      duration: 0,
    },
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [overviewData, genreData] = await Promise.all([
          fetchOverviewStats(),
          fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/stats-spotify/genres`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }).then((res) => res.json()),
        ]);

        setStats(overviewData);
        setGenres(genreData);
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const genreChartData = {
    labels: genres.map((g) => g.genre),
    datasets: [
      {
        data: genres.map((g) => g.count),
        backgroundColor: "rgba(153, 102, 255, 0.5)",
      },
    ],
  };

  if (loading) {
    return (
      <Card className="bg-white/[0.03] border-white/10">
        <CardContent className="p-6 flex justify-center items-center h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/[0.03] border-white/10 lg:mt-0 md:mt-16 sm:mt-16">
      <CardContent className="p-6">
        <h2 className="text-2xl font-bold text-white mb-6">
          Listening Statistics
        </h2>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid grid-cols-3 gap-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="genres">Genres</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Overview */}
              <Card className="bg-white/[0.02] border-white/5">
                <CardContent className="p-4">
                  <h3 className="text-lg font-medium text-white mb-4">
                    Listening Activity
                  </h3>
                  <div className="space-y-3">
                    <StatItem
                      label="Total Tracks"
                      value={stats.totalTracks.toLocaleString()}
                    />
                    <StatItem
                      label="Unique Tracks"
                      value={stats.uniqueTracks.toLocaleString()}
                      percentage={(
                        (stats.uniqueTracks / stats.totalTracks) *
                        100
                      ).toFixed(1)}
                    />
                    <StatItem
                      label="Unique Artists"
                      value={stats.uniqueArtists.toLocaleString()}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Time Stats */}
              <Card className="bg-white/[0.02] border-white/5">
                <CardContent className="p-4">
                  <h3 className="text-lg font-medium text-white mb-4">
                    Time Stats
                  </h3>
                  <div className="space-y-3">
                    <StatItem
                      label="Total Hours"
                      value={`${Math.round(stats.totalDuration / 3600000)}h`}
                    />
                    <StatItem
                      label="Daily Average"
                      value={`${Math.round(
                        stats.dailyAverage.duration / 3600000
                      )}h`}
                      subtext={`${stats.dailyAverage.tracks} tracks/day`}
                    />
                    <StatItem
                      label="Avg. Track Length"
                      value={`${Math.round(
                        stats.averageTrackDuration / 1000 / 60
                      )}min`}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Engagement Stats */}
              <Card className="bg-white/[0.02] border-white/5">
                <CardContent className="p-4">
                  <h3 className="text-lg font-medium text-white mb-4">
                    Engagement
                  </h3>
                  <div className="space-y-3">
                    <StatItem
                      label="Daily Activity Score"
                      value={`${Math.round(
                        (stats.dailyAverage.tracks / 24) * 100
                      )}%`}
                      subtext="Based on hourly activity"
                    />
                    <StatItem
                      label="Genre Diversity"
                      value={`${genres.length} genres`}
                      subtext={`Top: ${genres[0]?.genre || "N/A"}`}
                    />
                    <StatItem
                      label="Artist Rotation"
                      value={`${(
                        (stats.uniqueArtists / stats.totalTracks) *
                        100
                      ).toFixed(1)}%`}
                      subtext="Artist variety score"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Genres Section */}
          <TabsContent value="genres">
            <div className="grid grid-cols-1 gap-4">
              <Card className="bg-white/[0.02] border-white/5">
                <CardContent className="p-4">
                  <h3 className="text-lg font-medium text-white mb-4">
                    Top Genres
                  </h3>
                  <div className="h-[400px]">
                    <Bar
                      data={genreChartData}
                      options={{
                        ...chartOptions,
                        indexAxis: "y" as const,
                        plugins: {
                          ...chartOptions.plugins,
                          legend: {
                            display: false,
                          },
                          tooltip: {
                            callbacks: {
                              label: (context) => {
                                const genre = genres[context.dataIndex];
                                return `${
                                  genre.count
                                } plays (${genre.percentage.toFixed(1)}%)`;
                              },
                            },
                          },
                        },
                        scales: {
                          x: {
                            grid: {
                              color: "rgba(255, 255, 255, 0.1)",
                            },
                            ticks: {
                              color: "rgba(255, 255, 255, 0.7)",
                            },
                          },
                          y: {
                            grid: {
                              display: false,
                            },
                            ticks: {
                              color: "rgba(255, 255, 255, 0.9)",
                              font: {
                                size: 12,
                              },
                            },
                          },
                        },
                      }}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Insights Tab */}
          <TabsContent value="insights" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="bg-white/[0.02] border-white/5">
                <CardContent className="p-4">
                  <h3 className="text-lg font-medium text-white mb-4">
                    Listening Patterns
                  </h3>
                  <div className="space-y-3">
                    <StatItem
                      label="Peak Listening Time"
                      value={`${Math.round(
                        stats.dailyAverage.duration / 3600000
                      )}h/day`}
                    />
                    <StatItem
                      label="Track Completion Rate"
                      value={`${(
                        (stats.totalDuration /
                          (stats.totalTracks * stats.averageTrackDuration)) *
                        100
                      ).toFixed(1)}%`}
                    />
                    <StatItem
                      label="Genre Focus"
                      value={`${(genres[0]?.percentage || 0).toFixed(1)}%`}
                      subtext="Top genre dominance"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/[0.02] border-white/5">
                <CardContent className="p-4">
                  <h3 className="text-lg font-medium text-white mb-4">
                    Compare to Average
                  </h3>
                  <div className="space-y-3">
                    <StatItem
                      label="Listening Time"
                      value={
                        stats.dailyAverage.duration > 7200000
                          ? "Above Average"
                          : "Below Average"
                      }
                      subtext={`${Math.round(
                        stats.dailyAverage.duration / 3600000
                      )}h vs 2h avg`}
                    />
                    <StatItem
                      label="Track Variety"
                      value={stats.uniqueTracks > 100 ? "High" : "Moderate"}
                      subtext={`${stats.uniqueTracks} unique tracks`}
                    />
                    <StatItem
                      label="Genre Exploration"
                      value={genres.length > 5 ? "Explorer" : "Focused"}
                      subtext={`${genres.length} genres explored`}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

const StatItem = ({ label, value, percentage, subtext }: StatItemProps) => (
  <div className="flex items-center justify-between">
    <div>
      <span className="text-zinc-400">{label}</span>
      {subtext && <p className="text-xs text-zinc-500">{subtext}</p>}
    </div>
    <div className="text-right">
      <span className="text-white font-medium">{value}</span>
      {percentage && (
        <span className="text-xs text-zinc-500 ml-1">({percentage}%)</span>
      )}
    </div>
  </div>
);

export default StatsSection;
