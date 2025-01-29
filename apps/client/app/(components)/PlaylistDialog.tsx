import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  SpotifyPlaylistItem,
  SpotifyPlaylistTrack,
} from "@/lib/types/SpotifyTypes";
import { QueueButton } from "@/app/(components)/QueueButton";
import { Play } from "lucide-react";
import Image from "next/image";
import { playTrackThroughQueue } from "@/lib/spotify/search";
import { getPlayListItem } from "@/lib/spotify/library";

interface PlaylistDialogProps {
  playlist: SpotifyPlaylistItem | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export const PlaylistDialog = ({
  playlist,
  isOpen,
  onOpenChange,
}: PlaylistDialogProps) => {
  const [tracks, setTracks] = useState<SpotifyPlaylistTrack[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen || !playlist?.id) {
      setTracks([]);
      return;
    }

    const fetchTracks = async () => {
      try {
        setLoading(true);
        const response = await getPlayListItem(playlist.id);
        setTracks(response.items);
      } catch (error) {
        console.error("Failed to fetch playlist tracks:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTracks();
  }, [isOpen, playlist?.id]);

  const handlePlay = async (trackId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await playTrackThroughQueue(`spotify:track:${trackId}`);
    } catch (error) {
      console.error("Failed to play track:", error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col bg-zinc-900 border border-zinc-800">
        <DialogHeader className="bg-zinc-900 pb-4 border-b border-zinc-800 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Image
                src={playlist?.images[0]?.url || "/placeholder.png"}
                alt={playlist?.name || "Playlist"}
                width={64}
                height={64}
                className="object-cover rounded-md"
              />
              <div>
                <DialogTitle className="text-2xl font-bold text-white">
                  {playlist?.name}
                </DialogTitle>
                <p className="text-sm text-zinc-400">
                  {playlist?.tracks.total} tracks
                </p>
              </div>
            </div>
            <Button
              onClick={() =>
                playlist?.external_urls.spotify &&
                window.open(playlist.external_urls.spotify, "_blank")
              }
              className="bg-green-500 hover:bg-green-600 text-white"
            >
              Open in Spotify
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto mt-4">
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500" />
            </div>
          ) : (
            <div className="space-y-2 px-6">
              {tracks.map((item, index) => (
                <div
                  key={`${item.track.id}-${index}`}
                  className="flex items-center gap-3 p-2 hover:bg-zinc-800 rounded-md group"
                >
                  <Image
                    src={item.track.album.images[2]?.url || "/placeholder.png"}
                    alt={item.track.album.name}
                    width={40}
                    height={40}
                    className="object-cover rounded"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white truncate">
                      {item.track.name}
                    </p>
                    <p className="text-sm text-zinc-400 truncate">
                      {item.track.artists.map((a) => a.name).join(", ")}
                    </p>
                  </div>
                  <div className="text-zinc-400 text-sm">
                    {Math.floor(item.track.duration_ms / 60000)}:
                    {((item.track.duration_ms % 60000) / 1000)
                      .toFixed(0)
                      .padStart(2, "0")}
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-white hover:bg-zinc-700"
                      onClick={(e) => handlePlay(item.track.id, e)}
                    >
                      <Play className="w-4 h-4" />
                    </Button>
                    <QueueButton
                      trackId={item.track.id}
                      variant="ghost"
                      size="icon"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
