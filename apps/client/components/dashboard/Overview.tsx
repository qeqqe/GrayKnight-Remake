"use client";

import { Music2, BarChart3, Clock } from "lucide-react";
import { spotifyTrack } from "@/lib/types";
import { CurrentlyPlaying } from "@/app/(components)/CurrentlyPlaying";
import SplitText from "@/src/reactbits/TextAnimations/SplitText/SplitText";
import RecentTrack from "@/app/(components)/RecentTrack";
import { useEffect, useState, useMemo } from "react";
import { fetchTotalTracks } from "@/lib/spotify/spotify";
import { TrackPlayInterface } from "@/lib/types/index";
interface OverviewProps {
  currentTrack: spotifyTrack | null;
}

export function Overview({ currentTrack }: OverviewProps) {
  const [totalTrackLength, setTotalTrackLength] = useState<number>(0);
  const [listeningData, setListeningData] = useState<
    TrackPlayInterface[] | null
  >(null);
  const [totalTime, setTotalTime] = useState<number>(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await fetchTotalTracks();
        setListeningData(data);
      } catch (error) {
        console.error("Error fetching track data:", error);
      }
    };

    fetchData();
  }, []);

  useMemo(() => {
    if (listeningData) {
      setTotalTrackLength(listeningData.length);

      const totalMs = listeningData.reduce(
        (acc: number, track: TrackPlayInterface) => {
          return acc + (track.durationMs || 0);
        },
        0
      );

      const totalHours = Math.round(totalMs / (1000 * 60 * 60));
      setTotalTime(totalHours);
    }
  }, [listeningData]);

  const stats = useMemo(
    () => [
      {
        label: "Total Tracks",
        value: totalTrackLength.toString(),
        icon: <Music2 className="w-5 h-5" />,
      },
      {
        label: "Listening Time",
        value: `${totalTime}h`,
        icon: <Clock className="w-5 h-5" />,
      },
      {
        label: "Top Genre",
        value: "Rock",
        icon: <BarChart3 className="w-5 h-5" />,
      },
    ],
    [totalTrackLength, totalTime]
  );

  return (
    <div className="w-full space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:mt-0 sm:mt-16">
        {stats.map((stat, i) => (
          <div
            key={i}
            className="rounded-xl bg-white/[0.03] border border-white/10 p-4 lg:p-6 hover:bg-white/[0.05] transition-all duration-200"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 lg:p-3 rounded-xl bg-white/5">
                {stat.icon}
              </div>
              <div>
                <p className="text-lg lg:text-2xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                  {stat.value}
                </p>
                <p className="text-xs lg:text-sm text-gray-400">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="w-full rounded-xl bg-white/[0.03] border border-white/10 p-6 lg:p-8">
        <SplitText
          text="Now playing"
          delay={50}
          textAlign="center"
          className="text-base lg:text-lg font-semibold mb-6 lg:mb-8"
          animationFrom={{ opacity: 0, transform: "translate3d(0,20px,0)" }}
          animationTo={{ opacity: 1, transform: "translate3d(0,0,0)" }}
          onLetterAnimationComplete={() => console.log("Animation completed")}
        />
        <div className="min-h-[200px] w-full overflow-hidden">
          <CurrentlyPlaying track={currentTrack} />
        </div>
      </div>

      <div className="w-full rounded-xl bg-white/[0.03] border border-white/10 p-6 lg:p-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-white to-zinc-500 bg-clip-text text-transparent">
            Recently Played
          </h2>
        </div>
        <div className="overflow-hidden">
          <RecentTrack />
        </div>
      </div>
    </div>
  );
}
