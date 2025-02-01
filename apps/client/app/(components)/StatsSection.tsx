"use client";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Line, Bar } from "react-chartjs-2";
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
  ChartData,
} from "chart.js";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

interface StatData {
  overview: {
    totalTracks: number;
    totalDuration: number;
    uniqueTracks: number;
    uniqueArtists: number;
    skipRate: number;
    averageTrackDuration: number;
  };
  listeningTime: number[];
  topGenres: { genre: string; count: number }[];
  artistDiversity: number[];
  dailyTracks: number[];
  timeOfDay: { [key: string]: number };
  weekdayActivity: { [key: string]: number };
  timeDistribution: { hour: number; count: number }[];
  dailyStats: { date: string; track_count: number; total_duration: number }[];
  topArtists: {
    artist_id: string;
    artist_name: string;
    play_count: number;
    total_duration: number;
    genres: string[];
  }[];
}

interface ChartDataSets {
  listeningTime: ChartData<"line">;
  artistDiversity: ChartData<"bar">;
  timeOfDay: ChartData<"line">;
  weeklyActivity: ChartData<"bar">;
  genreDistribution: ChartData<"bar">;
}

const defaultLineChartData: ChartData<"line", number[], unknown> = {
  labels: [],
  datasets: [
    {
      label: "No data",
      data: [],
      borderColor: "rgb(75, 192, 192)",
      tension: 0.1,
    },
  ],
};

const defaultBarChartData: ChartData<"bar", number[], unknown> = {
  labels: [],
  datasets: [
    {
      label: "No data",
      data: [],
      backgroundColor: "rgba(153, 102, 255, 0.5)",
    },
  ],
};

const getChartData = (statData: StatData | null): ChartDataSets => {
  if (!statData)
    return {
      listeningTime: defaultLineChartData,
      artistDiversity: defaultBarChartData,
      timeOfDay: defaultLineChartData,
      weeklyActivity: defaultBarChartData,
      genreDistribution: defaultBarChartData,
    };

  return {
    listeningTime: {
      labels: statData.dailyStats.map((stat) =>
        new Date(stat.date).toLocaleDateString("en-US", { weekday: "short" })
      ),
      datasets: [
        {
          label: "Hours Listened",
          data: statData.dailyStats.map(
            (stat) => stat.total_duration / 3600000
          ),
          borderColor: "rgb(75, 192, 192)",
          backgroundColor: "rgba(75, 192, 192, 0.2)",
          fill: true,
          tension: 0.4,
        },
      ],
    },

    timeOfDay: {
      labels: statData.timeDistribution.map((t) => `${t.hour}:00`),
      datasets: [
        {
          label: "Track Plays",
          data: statData.timeDistribution.map((t) => t.count),
          borderColor: "rgb(75, 192, 192)",
          backgroundColor: "rgba(75, 192, 192, 0.2)",
          fill: true,
          tension: 0.4,
        },
      ],
    },

    artistDiversity: {
      labels: statData.topArtists.map((a) => a.artist_name),
      datasets: [
        {
          label: "Plays",
          data: statData.topArtists.map((a) => a.play_count),
          backgroundColor: "rgba(153, 102, 255, 0.5)",
        },
      ],
    },

    weeklyActivity: {
      labels: statData.dailyStats.map((stat) =>
        new Date(stat.date).toLocaleDateString("en-US", { weekday: "short" })
      ),
      datasets: [
        {
          label: "Unique Tracks",
          data: statData.dailyStats.map((stat) => stat.track_count),
          backgroundColor: "rgba(153, 102, 255, 0.5)",
        },
      ],
    },

    genreDistribution: {
      labels: statData.topGenres.map((g) => g.genre),
      datasets: [
        {
          label: "Track Count",
          data: statData.topGenres.map((g) => g.count),
          backgroundColor: "rgba(153, 102, 255, 0.5)",
        },
      ],
    },
  } as ChartDataSets;
};

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

const StatsSection = () => {
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("week");
  const [statData, setStatData] = useState<StatData | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/stats-spotify/listening-stats?timeRange=${timeRange}`
        );
        if (!response.ok) throw new Error("Failed to fetch stats");
        const data = await response.json();
        setStatData(data);
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [timeRange]);

  const chartData = getChartData(statData);

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
    <Card className="bg-white/[0.03] border-white/10">
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-zinc-500 bg-clip-text text-transparent">
            Listening Statistics
          </h2>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Last Week</SelectItem>
              <SelectItem value="month">Last Month</SelectItem>
              <SelectItem value="year">Last Year</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid grid-cols-3 gap-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="patterns">Patterns</TabsTrigger>
            <TabsTrigger value="genres">Genres</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="bg-white/[0.02] border-white/5">
                <CardContent className="p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <p className="text-sm text-zinc-400">Total Tracks</p>
                      <p className="text-2xl font-bold">
                        {statData?.overview?.totalTracks || 0}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-zinc-400">Unique Artists</p>
                      <p className="text-2xl font-bold">
                        {statData?.overview?.uniqueArtists || 0}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-zinc-400">Hours Listened</p>
                      <p className="text-2xl font-bold">
                        {Math.round(
                          (statData?.overview?.totalDuration || 0) / 3600000
                        )}
                        h
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-zinc-400">Skip Rate</p>
                      <p className="text-2xl font-bold">
                        {Math.round(statData?.overview?.skipRate || 0)}%
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/[0.02] border-white/5">
                <CardContent className="p-4">
                  <h3 className="text-sm font-medium mb-2">
                    Listening Patterns
                  </h3>
                  <div className="h-[300px]">
                    <Line
                      data={chartData.listeningTime}
                      options={chartOptions}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="patterns" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="bg-white/[0.02] border-white/5">
                <CardContent className="p-4">
                  <h3 className="text-sm font-medium mb-2">Time of Day</h3>
                  <div className="h-[300px]">
                    <Line data={chartData.timeOfDay} options={chartOptions} />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/[0.02] border-white/5">
                <CardContent className="p-4">
                  <h3 className="text-sm font-medium mb-2">Weekly Activity</h3>
                  <div className="h-[300px]">
                    <Bar
                      data={chartData.weeklyActivity}
                      options={chartOptions}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="genres" className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <Card className="bg-white/[0.02] border-white/5">
                <CardContent className="p-4">
                  <h3 className="text-sm font-medium mb-2">Top Genres</h3>
                  <div className="h-[400px]">
                    <Bar
                      data={chartData.genreDistribution}
                      options={{
                        ...chartOptions,
                        indexAxis: "y" as const,
                      }}
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

export default StatsSection;
