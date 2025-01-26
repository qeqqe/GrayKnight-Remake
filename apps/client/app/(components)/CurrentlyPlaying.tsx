import { spotifyTrack } from "@/lib/types";
import { Music2 } from "lucide-react";
import { useSpotifyPolling } from "@/hooks/useSpotifyPolling";
import TrackCard from "./TrackCard";

export const CurrentlyPlaying = ({
  track: initialTrack,
}: {
  track: spotifyTrack | null;
}) => {
  const { currentTrack } = useSpotifyPolling(initialTrack);

  if (!currentTrack) {
    return (
      <div className="h-full flex items-center justify-center text-zinc-500">
        <div className="text-center space-y-2">
          <Music2 className="w-8 h-8 mx-auto mb-4 opacity-50" />
          <div className="text-xl font-medium">Now Playing</div>
          <p>No track currently playing</p>
          <p className="text-sm">Play something on Spotify to get started</p>
        </div>
      </div>
    );
  }

  return <TrackCard track={currentTrack} />;
};
