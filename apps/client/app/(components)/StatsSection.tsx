"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  Loader2,
  Activity,
  Clock,
  Compass,
  Music2,
  Target,
  Users,
  LucideIcon,
} from "lucide-react";
import { OverviewPageStatisticsInterface } from "@/lib/types/StatTypes";
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

const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  progress,
  progressColor = "bg-green-500",
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: LucideIcon;
  progress: number;
  progressColor?: string;
}) => (
  <Card className="bg-white/[1%] backdrop-blur-lg border-[0.5px] border-white/10 relative overflow-hidden">
    <CardHeader className="flex flex-row items-center justify-between py-2 px-3">
      <CardTitle className="text-xs font-medium text-zinc-400">
        {title}
      </CardTitle>
      <Icon className="h-3.5 w-3.5 text-gray-400" />
    </CardHeader>
    <CardContent className="pb-5 pt-0 px-3">
      <div className="text-lg font-bold text-white">{value}</div>
      <p className="text-xs text-gray-400">{subtitle}</p>
    </CardContent>
    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-800/50">
      <div
        className={`h-full ${progressColor} transition-all duration-500`}
        style={{ width: `${progress}%` }}
      />
    </div>
  </Card>
);

const OverviewCard = ({
  title,
  value,
  icon: Icon,
  subtitle,
}: {
  title: string;
  value: string;
  icon: LucideIcon;
  subtitle?: string;
}) => (
  <div className="bg-white/[0.02] rounded-lg p-4 border border-white/5 relative group hover:bg-white/[0.04] transition-all">
    <div className="flex items-center justify-between mb-2">
      <span className="text-xs font-medium text-zinc-400">{title}</span>
      <Icon className="h-4 w-4 text-zinc-500" />
    </div>
    <div className="flex flex-col">
      <span className="text-2xl font-bold text-white tracking-tight">
        {value}
      </span>
      {subtitle && (
        <span className="text-xs text-zinc-400 mt-1">{subtitle}</span>
      )}
    </div>
    <div className="absolute inset-0 border border-white/0 group-hover:border-white/10 rounded-lg transition-all" />
  </div>
);

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
    patterns: {
      hourlyActivity: 0,
      peakHour: 0,
      genreDiversity: {
        total: 0,
        topGenre: "",
        topGenrePercentage: 0,
      },
      completionRate: 0,
      listeningStyle: {
        type: "Balanced",
        description: "",
      },
      discoveryRate: 0,
      artistVariety: {
        score: 0,
        level: "Low",
      },
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
    <Card className="bg-white/[0.03] border-white/10 lg:mt-0 md:mt-16 sm:mt-16 mt-16">
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

          <TabsContent value="overview" className="space-y-6">
            {/* Quick Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <OverviewCard
                title="Total Tracks"
                value={stats.totalTracks.toLocaleString()}
                icon={Music2}
                subtitle="Last 7 days"
              />
              <OverviewCard
                title="Listening Time"
                value={`${Math.round(stats.totalDuration / 3600000)}h`}
                icon={Clock}
                subtitle={`${stats.dailyAverage.tracks} tracks/day`}
              />
              <OverviewCard
                title="Unique Artists"
                value={stats.uniqueArtists.toString()}
                icon={Users}
                subtitle="Different artists played"
              />
              <OverviewCard
                title="Discovery Rate"
                value={`${(
                  (stats.uniqueTracks / stats.totalTracks) *
                  100
                ).toFixed(0)}%`}
                icon={Compass}
              />
            </div>

            {/* Detailed Stats */}
            <div className="grid md:grid-cols-2 gap-4">
              <Card className="bg-white/[0.02] border-white/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-zinc-400">
                    Time Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-400">Daily Average</span>
                      <span className="text-white font-medium">
                        {Math.round(stats.dailyAverage.duration / 3600000)}h
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-400">Peak Hours</span>
                      <span className="text-white font-medium">
                        {stats.patterns.peakHour}:00 -{" "}
                        {(stats.patterns.peakHour + 1) % 24}:00
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-400">Avg. Track Length</span>
                      <span className="text-white font-medium">
                        {Math.round(stats.averageTrackDuration / 1000 / 60)}min
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/[0.02] border-white/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-zinc-400">
                    Listening Patterns
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-400">Track Completion</span>
                      <span className="text-white font-medium">
                        {stats.patterns.completionRate.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-400">Genre Diversity</span>
                      <span className="text-white font-medium">
                        {genres.length} genres
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-400">Top Genre</span>
                      <span className="text-white font-medium">
                        {stats.patterns.genreDiversity.topGenre}
                      </span>
                    </div>
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
          <TabsContent value="insights" className="space-y-6">
            <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
              <StatCard
                title="Peak Activity Hour"
                value={`${stats.patterns.peakHour}:00`}
                subtitle="Most active listening time"
                icon={Clock}
                progress={75}
                progressColor="bg-green-500"
              />
              <StatCard
                title="Track Completion"
                value={`${stats.patterns.completionRate.toFixed(1)}%`}
                subtitle="Average song completion rate"
                icon={Activity}
                progress={stats.patterns.completionRate}
                progressColor="bg-blue-500"
              />
              <StatCard
                title="Daily Listening"
                value={`${Math.round(
                  stats.dailyAverage.duration / 3600000
                )}h/day`}
                subtitle={`${stats.dailyAverage.tracks} tracks per day`}
                icon={Music2}
                progress={60}
                progressColor="bg-red-500"
              />
              <StatCard
                title="Genre Explorer"
                value={
                  stats.patterns.genreDiversity.total > 8
                    ? "Diverse"
                    : "Focused"
                }
                subtitle={`${stats.patterns.genreDiversity.total} different genres explored`}
                icon={Compass}
                progress={(stats.patterns.genreDiversity.total / 15) * 100}
                progressColor="bg-purple-500"
              />
              <StatCard
                title="Discovery Rate"
                value={`${stats.patterns.discoveryRate.toFixed(1)}%`}
                subtitle={`${stats.uniqueTracks} unique tracks played`}
                icon={Target}
                progress={stats.patterns.discoveryRate}
                progressColor="bg-yellow-500"
              />
              <StatCard
                title="Artist Rotation"
                value={stats.patterns.artistVariety.level}
                subtitle={`${stats.uniqueArtists} different artists`}
                icon={Users}
                progress={stats.patterns.artistVariety.score}
                progressColor="bg-pink-500"
              />
            </div>

            <Card className="bg-white/[2%]  backdrop-blur-lg border-[0.5px] border-white/10">
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-sm text-white">
                  Listening Style Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 py-2">
                <div className="space-y-4">
                  <Card className="bg-white/[0.02] border-transparent p-3">
                    <h3 className="text-xs font-medium text-gray-400">
                      Your Listening Style
                    </h3>
                    <p className="text-base font-bold text-white mt-0.5">
                      {stats.patterns.listeningStyle.type}
                    </p>
                    <p className="text-xs text-gray-400">
                      {stats.patterns.listeningStyle.description}
                    </p>
                  </Card>

                  <Card className="bg-white/[0.02] border-transparent p-3">
                    <h3 className="text-xs font-medium text-gray-400">
                      Primary Genre Focus
                    </h3>
                    <p className="text-base font-bold text-white mt-0.5">
                      {stats.patterns.genreDiversity.topGenre}
                    </p>
                    <p className="text-xs text-gray-400">
                      {stats.patterns.genreDiversity.topGenrePercentage.toFixed(
                        1
                      )}
                      % of your listening time
                    </p>
                    <div className="mt-2 h-0.5 w-full bg-gray-800 rounded-full">
                      <div
                        className="h-full rounded-full bg-green-500"
                        style={{
                          width: `${stats.patterns.genreDiversity.topGenrePercentage}%`,
                        }}
                      />
                    </div>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default StatsSection;
