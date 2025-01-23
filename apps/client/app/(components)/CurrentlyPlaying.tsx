import { spotifyTrack } from "@/lib/types";
import { Music2 } from "lucide-react";
import TrackCard from "./TrackCard";

export const CurrentlyPlaying = ({ track }: { track: spotifyTrack | null }) => {
  if (!track) {
    return (
      <div className="h-full flex items-center justify-center text-zinc-500">
        <div className="text-center">
          <Music2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>No track currently playing</p>
          <p className="text-sm">Play something on Spotify to get started</p>
        </div>
      </div>
    );
  }

  return <TrackCard track={track} />;
};
