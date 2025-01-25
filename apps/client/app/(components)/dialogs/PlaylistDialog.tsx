import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SpotifyPlaylistItem } from "@/lib/types";
import Image from "next/image";

interface PlaylistDialogProps {
  playlist: SpotifyPlaylistItem | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const PlaylistDialog = ({
  playlist,
  isOpen,
  onOpenChange,
}: PlaylistDialogProps) => {
  if (!playlist) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-900 text-white border-white/10">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {playlist.name}
          </DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          <Image
            src={playlist.images?.[0]?.url || "/playlist-placeholder.png"}
            alt={playlist.name}
            width={500}
            height={500}
            className="w-full rounded-lg"
          />
          <p className="mt-4 text-zinc-400">
            By {playlist.owner?.display_name || "Unknown"}
          </p>
          <p className="text-zinc-500 text-sm">
            {playlist.tracks?.total || 0} tracks
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PlaylistDialog;
