"use client";
import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { spotifyTrack } from "../../lib/types/index";
import {
  playSpotifyTrack,
  pauseSpotifyTrack,
  nextSpotifyTrack,
  previousSpotifyTrack,
} from "@/lib/spotify/spotify";
import { Play, Pause, SkipBack, SkipForward, Info, Heart } from "lucide-react";
import Image from "next/image";

interface ArtistDetails {
  id: string;
  name: string;
  genres: string[];
}

export default function TrackCard({ track }: { track: spotifyTrack }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [localPlayingState, setLocalPlayingState] = useState(track.is_playing);
  const [artistDetails, setArtistDetails] = useState<ArtistDetails[]>([]);
  const [isSaved, setIsSaved] = useState(false);
  const formattedDuration = `${Math.floor(track.duration_ms / 60000)}:${(
    (track.duration_ms % 60000) /
    1000
  )
    .toFixed(0)
    .padStart(2, "0")}`;

  const formattedProgress = `${Math.floor(track.progress_ms / 60000)}:${(
    (track.progress_ms % 60000) /
    1000
  )
    .toFixed(0)
    .padStart(2, "0")}`;

  const progressPercentage = (track.progress_ms / track.duration_ms) * 100;

  const formattedDate = track.album.release_date
    ? format(new Date(track.album.release_date), "dd/MM/yyyy")
    : "Release date unavailable";

  console.log("Track in card:", track);

  const handlePlayPause = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setLocalPlayingState(!localPlayingState);

    try {
      if (localPlayingState) {
        await pauseSpotifyTrack();
      } else {
        await playSpotifyTrack({
          uris: [`spotify:track:${track.id}`],
          position_ms: track.progress_ms,
        });
      }
    } catch (error) {
      setLocalPlayingState(localPlayingState);
      console.error("Failed to control playback:", error);
    }
  };

  const handleNext = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await nextSpotifyTrack();
    } catch (error) {
      console.error("Failed to skip track:", error);
    }
  };

  const handlePrevious = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await previousSpotifyTrack();
    } catch (error) {
      console.error("Failed to go to previous track:", error);
    }
  };

  const fetchArtistDetails = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      //   const artistPromises = track.artists.map((artist) =>
      //     fetch(`https://api.spotify.com/v1/artists/${artist.id}`, {
      //       headers: {
      //         Authorization: `Bearer ${token}`,
      //       },
      //     }).then((res) => res.json())
      //   );
      const artistPromises = track.artists.map((artist) =>
        fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/spotify/artists/${artist.id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        ).then((res) => res.json())
      );

      const artistsData = await Promise.all(artistPromises);
      setArtistDetails(
        artistsData.map((artist) => ({
          id: artist.id,
          name: artist.name,
          genres: artist.genres,
        }))
      );
    } catch (error) {
      console.error("Failed to fetch artist details:", error);
    }
  }, [track.artists]);

  const handleSaveTrack = () => {};

  const checkIfTrackIsSaved = useCallback(async () => {
    try {
      const token = localStorage.getItem("spotify_access_token");
      const response = await fetch(
        `https://api.spotify.com/v1/me/tracks/contains?ids=${track.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const [saved] = await response.json();
      setIsSaved(saved);
    } catch (error) {
      console.error("Failed to check track saved status:", error);
    }
  }, [track.id]);

  useEffect(() => {
    if (isModalOpen) {
      fetchArtistDetails();
    }
  }, [isModalOpen, fetchArtistDetails]);

  useEffect(() => {
    setLocalPlayingState(track.is_playing);
  }, [track.is_playing]);

  useEffect(() => {
    checkIfTrackIsSaved();
  }, [track.id, checkIfTrackIsSaved]);

  return (
    <div className="h-full flex flex-col">
      <div className="flex gap-6">
        <div className="relative group">
          <Image
            src={track.album.images[0]?.url}
            alt={track.album.name}
            width={128}
            height={128}
            className="rounded-lg shadow-md"
            priority
          />
        </div>

        <div className="flex-1 flex flex-col justify-between min-w-0">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-xl text-zinc-200 dark:text-white truncate">
                  {track.name}
                </h3>
                {track.explicit && (
                  <span className="px-1.5 py-0.5 text-[10px] font-medium bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded">
                    E
                  </span>
                )}
              </div>
              <p className="text-base text-zinc-600 dark:text-zinc-400 truncate">
                {track.artists.map((artist) => artist.name).join(", ")}
              </p>
              <p className="text-sm text-zinc-500 dark:text-zinc-500 mt-1">
                {track.album.name}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                size="icon"
                variant="ghost"
                className={`w-8 h-8 ${
                  isSaved
                    ? "text-red-500 hover:text-red-600"
                    : "text-zinc-500 hover:text-red-500"
                }`}
                onClick={handleSaveTrack}
              >
                <Heart
                  className="w-4 h-4"
                  fill={isSaved ? "currentColor" : "none"}
                />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="w-8 h-8 text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                onClick={() => setIsModalOpen(true)}
              >
                <Info className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Playback Controls */}
          <div className="flex items-center gap-3">
            <Button
              size="sm"
              variant="ghost"
              onClick={handlePrevious}
              className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
            >
              <SkipBack className="w-4 h-4" />
            </Button>
            <Button
              size="icon"
              onClick={handlePlayPause}
              className="bg-green-500 hover:bg-green-600 text-white rounded-full w-10 h-10"
            >
              {localPlayingState ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5" />
              )}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleNext}
              className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
            >
              <SkipForward className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-6 space-y-1">
        <div className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-green-500 transition-all duration-1000 ease-linear"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        <div className="flex justify-between items-center text-xs text-zinc-500">
          <span>{formattedProgress}</span>
          <span>{formattedDuration}</span>
        </div>
      </div>

      {/* dialog */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              Track Details
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-[200px,1fr] gap-6 mt-4">
            <div className="space-y-4">
              <Image
                src={track.album.images[0]?.url}
                alt={track.album.name}
                width={200}
                height={200}
                className="w-full aspect-square object-cover rounded-lg shadow-xl"
                priority
              />
              <div className="space-y-1">
                <p className="text-sm font-medium text-zinc-400">Album</p>
                <p className="font-semibold">{track.album.name}</p>
                <p className="text-sm text-zinc-500">
                  Released: {formattedDate}
                </p>
              </div>
            </div>
            <div className="space-y-6">
              <div>
                <h3 className="text-2xl font-bold text-green-400 flex items-center gap-2">
                  {track.name}
                  {track.explicit && (
                    <span className="inline-block px-2 py-1 text-xs font-medium bg-zinc-800 text-zinc-300 rounded">
                      E
                    </span>
                  )}
                </h3>
                <div className="space-y-4 mt-2">
                  {artistDetails.map((artist) => (
                    <div key={artist.id} className="space-y-2">
                      <a
                        href={
                          track.artists.find((a) => a.id === artist.id)
                            ?.external_urls.spotify
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-zinc-300 hover:text-white hover:underline transition-colors"
                      >
                        {artist.name}
                      </a>
                      {artist.genres.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {artist.genres.map((genre) => (
                            <span
                              key={genre}
                              className="px-2 py-0.5 text-xs bg-zinc-800/50 text-zinc-400 rounded-full"
                            >
                              {genre}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-zinc-400">Album Type</p>
                  <p className="font-medium capitalize">
                    {track.album.album_type}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-zinc-400">Release Date</p>
                  <p className="font-medium">{formattedDate}</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="text-zinc-400">Timestamp:</span>
                  <span className="text-sm">
                    {formattedProgress} / {formattedDuration}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 transition-all duration-500 ease-linear"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="text-zinc-400">Duration:</span>
                  <span>{formattedDuration}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-zinc-400">Popularity:</span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="w-full max-w-[200px] h-2 bg-zinc-800 rounded-full overflow-hidden cursor-help relative group">
                          <div
                            className="h-full bg-green-500"
                            style={{ width: `${track.popularity}%` }}
                          />
                          <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black/90 px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                            {track.popularity}/100
                          </span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-sm font-medium">
                          Popularity Score: {track.popularity}/100
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>

              {/* Preview section */}
              {track.preview_url && (
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="text-zinc-400">Preview:</span>
                    <audio
                      controls
                      className="w-full h-8 [&::-webkit-media-controls-panel]:bg-zinc-800 [&::-webkit-media-controls-current-time-display]:text-white [&::-webkit-media-controls-time-remaining-display]:text-white"
                    >
                      <source src={track.preview_url} type="audio/mpeg" />
                      Your browser does not support the audio element.
                    </audio>
                  </div>
                </div>
              )}

              <div className="flex gap-4">
                <Button
                  onClick={() =>
                    window.open(track.album.external_urls.spotify, "_blank")
                  }
                  className="bg-green-500 hover:bg-green-600"
                >
                  Open in Spotify
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
