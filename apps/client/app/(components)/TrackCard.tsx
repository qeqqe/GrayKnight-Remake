"use client";
import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { throttle } from "lodash";
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
  checkIfTrackIsSaved,
  removeTrackFromLibrary,
  saveTrackToLibrary,
  seekToPosition,
  setVolume,
  toggleShuffle,
} from "@/lib/spotify/spotify";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Repeat,
  Volume2,
  VolumeX,
  Shuffle,
  Info,
  Heart,
} from "lucide-react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import DecryptedText from "@/src/reactbits/TextAnimations/DecryptedText/DecryptedText";
import ElasticSlider from "@/src/reactbits/Components/ElasticSlider/ElasticSlider";
import { TrackArtwork } from "./TrackArtwork";
interface ArtistDetails {
  id: string;
  name: string;
  genres: string[];
}

export default function TrackCard({ track }: { track: spotifyTrack }) {
  if (!track || !track.album) {
    return (
      <div className="h-full flex items-center justify-center text-zinc-500">
        <p>Loading track information...</p>
      </div>
    );
  }

  return <TrackCardContent track={{ ...track, album: track.album }} />;
}

type TrackWithRequiredAlbum = Omit<spotifyTrack, "album"> & {
  album: NonNullable<spotifyTrack["album"]>;
};

function TrackCardContent({ track }: { track: TrackWithRequiredAlbum }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [localPlayingState, setLocalPlayingState] = useState(track.is_playing);
  const [artistDetails, setArtistDetails] = useState<ArtistDetails[]>([]);
  const [isSaved, setIsSaved] = useState(false);
  const [currentProgress, setCurrentProgress] = useState(track.progress_ms);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isDragging, setIsDragging] = useState(false);
  const [hoverProgress, setHoverProgress] = useState<number | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [showPreview, setShowPreview] = useState(false);
  const [previewTime, setPreviewTime] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [repeatMode, setRepeatMode] = useState<"off" | "track" | "context">(
    "off"
  );
  const [volume, setVolumeState] = useState(50);
  const [prevVolume, setPrevVolume] = useState(50);
  const [isMuted, setIsMuted] = useState(false);
  const [shuffleEnabled, setShuffleEnabled] = useState(false);
  const [prevTrackId, setPrevTrackId] = useState(track.id);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [lastSyncTime, setLastSyncTime] = useState(Date.now());
  const [isPollingPaused, setIsPollingPaused] = useState(false);

  const formatTime = (ms: number) => {
    return `${Math.floor(ms / 60000)}:${((ms % 60000) / 1000)
      .toFixed(0)
      .padStart(2, "0")}`;
  };

  const formattedProgress = formatTime(currentProgress);
  const formattedDuration = track?.duration_ms
    ? formatTime(track.duration_ms)
    : "0:00";
  const formattedDate = track?.album?.release_date
    ? format(new Date(track.album.release_date), "dd/MM/yyyy")
    : "Release date unavailable";
  const progressPercentage = track?.duration_ms
    ? (currentProgress / track.duration_ms) * 100
    : 0;

  const checkCurrentTrack = useCallback(async () => {
    if (!isActive || isPollingPaused) return;

    try {
      const token = localStorage.getItem("token");
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
        if (data && data.item) {
          if (data.item.id === track.id) {
            setLocalPlayingState(data.is_playing);
            // Only update progress if difference is very significant (> 5 seconds)
            const progressDiff = Math.abs(data.progress_ms - currentProgress);
            if (progressDiff > 5000) {
              setCurrentProgress(data.progress_ms);
            }
          } else {
            setLocalPlayingState(false);
          }
        } else {
          setLocalPlayingState(false);
        }
      }
    } catch (error) {
      console.error("Failed to check current track:", error);
    }
  }, [track.id, currentProgress, isActive, isPollingPaused]);

  useEffect(() => {
    setIsActive(true);
    return () => setIsActive(false);
  }, []);

  useEffect(() => {
    if (currentProgress >= track.duration_ms) {
      const timeoutId = setTimeout(checkCurrentTrack, 1000);
      return () => clearTimeout(timeoutId);
    }
  }, [currentProgress, track.duration_ms, checkCurrentTrack]);

  // add polling for track state changes
  useEffect(() => {
    const pollInterval = setInterval(checkCurrentTrack, 10000); // Poll every 10 seconds
    return () => clearInterval(pollInterval);
  }, [checkCurrentTrack]);

  // sync with incoming track updates
  useEffect(() => {
    setCurrentProgress(track.progress_ms);
  }, [track.progress_ms]);

  // update track data when props change
  useEffect(() => {
    setLocalPlayingState(track.is_playing);
    setCurrentProgress(track.progress_ms);
  }, [track.id, track.is_playing, track.progress_ms]);

  useEffect(() => {
    if (prevTrackId !== track.id) {
      setPrevTrackId(track.id);
    }
  }, [track.id, prevTrackId]);

  const handlePlayPause = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      if (localPlayingState) {
        await pauseSpotifyTrack();
        setLocalPlayingState(false);
      } else {
        await playSpotifyTrack({
          uris: [`spotify:track:${track.id}`],
          position_ms: currentProgress,
        });
        setLocalPlayingState(true);
      }
    } catch (error) {
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
      const artistPromises = track.artists.map((artist) =>
        fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/spotify/artists/${artist.id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        ).then((res) => {
          if (!res.ok) throw new Error("Failed to fetch artist details");
          return res.json();
        })
      );

      const artistsData = await Promise.all(artistPromises);
      setArtistDetails(
        artistsData.map((artistData) => ({
          id: artistData.id,
          name: artistData.name,
          genres: artistData.genres || [],
        }))
      );
    } catch (error) {
      console.error("Failed to fetch artist details:", error);
    }
  }, [track.artists]);

  const handleSaveTrack = async () => {
    try {
      if (isSaved) {
        await removeTrackFromLibrary(track.id);
      } else {
        await saveTrackToLibrary(track.id);
      }
      await checkIfTrackIsSavedStatus();
    } catch (error) {
      console.error("Failed to toggle track saved status:", error);
    }
  };

  const checkIfTrackIsSavedStatus = useCallback(async () => {
    try {
      const [saved] = await checkIfTrackIsSaved(track.id);
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
    checkIfTrackIsSavedStatus();
  }, [track.id, checkIfTrackIsSavedStatus]);

  const UpdateTimestamp = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No token found");

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/spotify/seek`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            timestamp: currentProgress,
          }),
        }
      );
      if (response.ok) {
        console.log("Timestamp updated successfully");
      } else {
        throw new Error("Failed to update timestamp");
      }
    } catch (error) {
      console.error("Failed to update timestamp:", error);
    }
  };

  const handleProgressBarClick = async (
    e: React.MouseEvent<HTMLDivElement>
  ) => {
    const progressBar = e.currentTarget;
    const rect = progressBar.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;
    const percentage = x / width;
    const positionMs = Math.floor(percentage * track.duration_ms);

    try {
      setIsPollingPaused(true);
      await seekToPosition(positionMs);
      setCurrentProgress(positionMs);
      setLastSyncTime(Date.now());
      setTimeout(() => setIsPollingPaused(false), 1000);
    } catch (error) {
      console.error("Failed to seek:", error);
      setIsPollingPaused(false);
    }
  };

  const handleProgressBarMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const progressBar = e.currentTarget;
    const rect = progressBar.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;
    const percentage = (x / width) * 100;
    const position = Math.min(Math.max(percentage, 0), 100);

    // calculate preview time
    const previewMs = Math.floor((position / 100) * track.duration_ms);
    setPreviewTime(formatTime(previewMs));
    setHoverProgress(position);
    setShowPreview(true);
  };

  const handleProgressBarMouseLeave = () => {
    if (!isDragging) {
      setHoverProgress(null);
      setShowPreview(false);
      setIsPollingPaused(false);
    }
  };

  const handleProgressBarMouseEnter = () => {
    setIsPollingPaused(true);
  };

  const handleRepeatClick = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No token found");

      const nextMode =
        repeatMode === "off"
          ? "track"
          : repeatMode === "track"
          ? "context"
          : "off";

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/spotify/set-repeat-mode`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ state: nextMode }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to change repeat mode");
      }

      setRepeatMode(nextMode);
    } catch (error) {
      console.error("Failed to change repeat mode:", error);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const throttledSetVolume = useCallback(
    throttle(async (newVolume: number) => {
      try {
        await setVolume(newVolume);
      } catch (error) {
        console.error("Failed to set volume:", error);
      }
    }, 1000),
    []
  );

  const handleVolumeChange = (newVolume: number) => {
    setVolumeState(newVolume);
    throttledSetVolume(newVolume);
  };

  const toggleMute = async () => {
    try {
      if (isMuted) {
        setVolumeState(prevVolume);
        throttledSetVolume(prevVolume);
        setIsMuted(false);
      } else {
        setPrevVolume(volume);
        setVolumeState(0);
        throttledSetVolume(0);
        setIsMuted(true);
      }
    } catch (error) {
      console.error("Failed to toggle mute:", error);
    }
  };

  useEffect(() => {
    return () => {
      throttledSetVolume.cancel();
    };
  }, [throttledSetVolume]);

  const handleShuffleClick = async () => {
    try {
      const response = await toggleShuffle(!shuffleEnabled);
      if (response.success) {
        setShuffleEnabled(!shuffleEnabled);
      }
    } catch (error) {
      console.error("Failed to toggle shuffle:", error);
    }
  };

  // Update the track info section with better layout and added info button
  const trackInfoSection = (
    <div className="flex items-center justify-between">
      <div className="flex-1 min-w-0">
        <h3 className="text-xl font-bold truncate">{track.name}</h3>
        <p className="text-zinc-400 truncate">
          {track.artists.map((a) => a.name).join(", ")}
        </p>
      </div>
      <div className="flex items-center gap-2 ml-4">
        <Button
          size="icon"
          variant="ghost"
          onClick={() => setIsModalOpen(true)}
          className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-white/10"
        >
          <Info className="h-4 w-4" />
          <span className="sr-only">Track Details</span>
        </Button>
        <Button
          size="icon"
          variant="ghost"
          onClick={handleSaveTrack}
          className={`h-8 w-8 ${
            isSaved ? "text-green-500" : "text-zinc-400"
          } hover:text-white hover:bg-white/10`}
        >
          <Heart
            className={`h-4 w-4 ${isSaved ? "fill-current" : "stroke-current"}`}
          />
          <span className="sr-only">
            {isSaved ? "Remove from Library" : "Save to Library"}
          </span>
        </Button>
      </div>
    </div>
  );

  useEffect(() => {
    setCurrentProgress(track.progress_ms);
    setLocalPlayingState(track.is_playing);

    // reset animation frame
    let animationFrameId: number;
    const startTime = performance.now() - track.progress_ms;

    const animate = (currentTime: number) => {
      if (!track.is_playing) {
        animationFrameId = requestAnimationFrame(animate);
        return;
      }

      const elapsed = currentTime - startTime;
      const newProgress = Math.min(elapsed, track.duration_ms);

      setCurrentProgress(newProgress);

      if (newProgress < track.duration_ms) {
        animationFrameId = requestAnimationFrame(animate);
      }
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [track.id, track.progress_ms, track.is_playing, track.duration_ms]);

  return (
    <div className="h-full flex flex-col">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Album Art */}
        <div className="relative w-32 h-32 md:w-48 md:h-48 mx-auto md:mx-0">
          <TrackArtwork
            imageUrl={track?.album?.images?.[0]?.url}
            albumName={track?.album?.name}
            trackId={track.id}
          />
        </div>

        {/* Controls and Info */}
        <div className="flex-1 min-w-0 space-y-6">
          {trackInfoSection}

          {/* Playback Controls - Different layouts for mobile/desktop */}
          <div className="md:hidden flex flex-col gap-4">
            {/* Mobile Layout - Centered */}
            <div className="flex justify-center items-center gap-4">
              <Button
                size="sm"
                variant="ghost"
                onClick={handlePrevious}
                className="text-zinc-400 hover:text-white"
              >
                <SkipBack className="h-5 w-5" />
              </Button>
              <Button
                size="icon"
                onClick={handlePlayPause}
                className="bg-green-500 hover:bg-green-600 text-white rounded-full w-12 h-12"
              >
                {localPlayingState ? (
                  <Pause className="h-5 w-5" />
                ) : (
                  <Play className="h-5 w-5" />
                )}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleNext}
                className="text-zinc-400 hover:text-white"
              >
                <SkipForward className="h-5 w-5" />
              </Button>
            </div>

            {/* Mobile Secondary Controls */}
            <div className="flex justify-center items-center gap-4">
              <Button
                size="sm"
                variant="ghost"
                onClick={handleRepeatClick}
                className={`text-zinc-400 hover:text-white ${
                  repeatMode !== "off" ? "text-green-500" : ""
                }`}
              >
                <div className="relative">
                  <Repeat className="h-4 w-4" />
                  {repeatMode === "track" && (
                    <span className="absolute -top-1 -right-1 text-[10px] font-bold">
                      1
                    </span>
                  )}
                </div>
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleShuffleClick}
                className={`text-zinc-400 hover:text-white ${
                  shuffleEnabled ? "text-green-500" : ""
                }`}
              >
                <Shuffle className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Desktop Layout - Left aligned */}
          <div className="hidden md:flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={handlePrevious}
                className="text-zinc-400 hover:text-white"
              >
                <SkipBack className="h-5 w-5" />
              </Button>
              <Button
                size="icon"
                onClick={handlePlayPause}
                className="bg-green-500 hover:bg-green-600 text-white rounded-full w-12 h-12"
              >
                {localPlayingState ? (
                  <Pause className="h-5 w-5" />
                ) : (
                  <Play className="h-5 w-5" />
                )}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleNext}
                className="text-zinc-400 hover:text-white"
              >
                <SkipForward className="h-5 w-5" />
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={handleRepeatClick}
                className={`text-zinc-400 hover:text-white ${
                  repeatMode !== "off" ? "text-green-500" : ""
                }`}
              >
                <div className="relative">
                  <Repeat className="h-4 w-4" />
                  {repeatMode === "track" && (
                    <span className="absolute -top-1 -right-1 text-[10px] font-bold">
                      1
                    </span>
                  )}
                </div>
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleShuffleClick}
                className={`text-zinc-400 hover:text-white ${
                  shuffleEnabled ? "text-green-500" : ""
                }`}
              >
                <Shuffle className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Volume Control */}
          <div className="hidden md:flex items-center gap-2 w-full max-w-[200px]">
            <Button
              size="sm"
              variant="ghost"
              onClick={toggleMute}
              className="text-zinc-400 hover:text-white"
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="h-4 w-4" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </Button>
            <div className="flex-1">
              <ElasticSlider
                defaultValue={volume}
                startingValue={0}
                maxValue={100}
                isStepped={true}
                stepSize={5}
                className="volume-slider"
                onChange={handleVolumeChange}
              />
            </div>
            <span className="text-xs text-zinc-400 w-8 text-right">
              {volume}%
            </span>
          </div>
        </div>
      </div>

      {/* progress bar */}
      <div className="mt-6 space-y-1 relative select-none group">
        <div
          className="w-full py-2 relative bg-transparent group/progress cursor-pointer"
          onClick={handleProgressBarClick}
          onMouseMove={handleProgressBarMouseMove}
          onMouseLeave={handleProgressBarMouseLeave}
          onMouseEnter={handleProgressBarMouseEnter}
        >
          <div className="w-full h-1.5 relative bg-zinc-200/10 rounded-full overflow-visible hover:h-[6px] transition-all duration-100">
            {/* base track */}
            <div className="absolute inset-0 bg-zinc-800/50 rounded-full" />

            {/* progress fill */}
            <motion.div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-green-500 to-emerald-400 rounded-full"
              style={{ width: `${progressPercentage}%` }}
              transition={{ type: "spring", bounce: 0 }}
            />

            {/* interactive elements container */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <AnimatePresence>
                {hoverProgress !== null && (
                  <>
                    {/* preview bubble */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ type: "spring", bounce: 0 }}
                      className="absolute -top-10 transform -translate-x-1/2 pointer-events-none"
                      style={{
                        left: `${hoverProgress}%`,
                        minWidth: "40px",
                      }}
                    >
                      <div className="relative px-2 py-1 bg-black/90 rounded text-xs text-white font-medium shadow-xl">
                        {previewTime}
                        <div className="absolute -bottom-1 left-1/2 w-2 h-2 bg-black/90 transform -translate-x-1/2 rotate-45" />
                      </div>
                    </motion.div>

                    {/* hover highlight */}
                    <motion.div
                      className="absolute inset-y-0 left-0 bg-white/10"
                      style={{ width: `${hoverProgress}%` }}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    />

                    {/* dots container - ensures proper alignment */}
                    <div className="absolute inset-0 pointer-events-none">
                      {/* hover dot */}
                      <motion.div
                        className="absolute top-[50%] -translate-y-[50%]"
                        style={{
                          left: `${hoverProgress}%`,
                          transform: "translate(-50%, -50%)",
                        }}
                        transition={{ type: "spring", bounce: 0 }}
                      >
                        <div className="w-3 h-3 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
                      </motion.div>

                      {/* current position dot */}
                      <motion.div
                        className="absolute top-[50%] -translate-y-[50%]"
                        style={{
                          left: `${progressPercentage}%`,
                          transform: "translate(-50%, -50%)",
                        }}
                        transition={{ type: "spring", bounce: 0 }}
                      >
                        <div className="w-3 h-3 bg-green-500 rounded-full shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                      </motion.div>
                    </div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
        <div className="flex justify-between items-center text-xs text-zinc-400">
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
                  <DecryptedText
                    text={track.name}
                    speed={50}
                    maxIterations={3}
                    sequential={true}
                    revealDirection="center"
                    useOriginalCharsOnly={true}
                    animateOn="view"
                    className="text-green-400"
                    encryptedClassName="text-zinc-600"
                  />
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
                    onClick={UpdateTimestamp}
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

              {/* preview section */}
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
