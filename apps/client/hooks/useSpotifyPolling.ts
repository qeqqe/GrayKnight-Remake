import { useState, useEffect } from "react";
import { spotifyTrack } from "@/lib/types";

export function useSpotifyPolling(initialTrack: spotifyTrack | null) {
  const [currentTrack, setCurrentTrack] = useState<spotifyTrack | null>(
    initialTrack
  );
  const [isPolling, setIsPolling] = useState(true);

  useEffect(() => {
    let pollInterval: NodeJS.Timeout;

    const pollCurrentTrack = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/spotify/current-playing`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          // The API returns the track data in data.item
          if (data && data.item) {
            const trackData: spotifyTrack = {
              ...data.item,
              is_playing: data.is_playing,
              progress_ms: data.progress_ms,
            };
            setCurrentTrack(trackData);
          } else {
            setCurrentTrack(null);
          }
        }
      } catch (error) {
        console.error("Failed to poll current track:", error);
      }
    };

    if (isPolling) {
      pollCurrentTrack();
      pollInterval = setInterval(pollCurrentTrack, 3000);
    }

    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [isPolling]);

  return {
    currentTrack,
    setIsPolling,
  };
}
