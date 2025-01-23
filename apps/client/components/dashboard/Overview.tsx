import { Music2, BarChart3, Clock } from "lucide-react";
import { spotifyTrack } from "@/lib/types";
import { CurrentlyPlaying } from "@/app/(components)/CurrentlyPlaying";

interface OverviewProps {
  currentTrack: spotifyTrack | null;
}

export function Overview({ currentTrack }: OverviewProps) {
  const stats = [
    {
      label: "Monthly Tracks",
      value: "847",
      icon: <Music2 className="w-5 h-5" />,
    },
    {
      label: "Listening Time",
      value: "156h",
      icon: <Clock className="w-5 h-5" />,
    },
    {
      label: "Top Genre",
      value: "Rock",
      icon: <BarChart3 className="w-5 h-5" />,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {stats.map((stat, i) => (
          <div
            key={i}
            className="rounded-xl bg-white/[0.03] border border-white/10 p-6 hover:bg-white/[0.05] transition-all duration-200"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-white/5">{stat.icon}</div>
              <div>
                <p className="text-2xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                  {stat.value}
                </p>
                <p className="text-sm text-gray-400">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl bg-white/[0.03] border border-white/10 p-6">
        <h3 className="text-lg font-semibold mb-4">Now Playing</h3>
        <CurrentlyPlaying track={currentTrack} />
      </div>

      <div className="rounded-xl bg-white/[0.03] border border-white/10 p-6">
        <h3 className="text-lg font-semibold mb-4">Recent Tracks</h3>
      </div>
    </div>
  );
}
