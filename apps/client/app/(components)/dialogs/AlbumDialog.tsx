import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SpotifyAlbum } from "@/lib/types";
import Image from "next/image";

interface AlbumDialogProps {
  album: SpotifyAlbum | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const AlbumDialog = ({ album, isOpen, onOpenChange }: AlbumDialogProps) => {
  if (!album) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-900 text-white border-white/10">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">{album.name}</DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          <Image
            src={album.images[0]?.url}
            alt={album.name}
            width={500}
            height={500}
            className="w-full rounded-lg"
          />
          <p className="mt-4 text-zinc-400">
            {album.artists.map((a) => a.name).join(", ")}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AlbumDialog;
