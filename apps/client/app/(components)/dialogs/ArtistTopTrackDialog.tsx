import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Image from "next/image";

interface ArtistTopTrackDialogProps {
  artistId: string | null | undefined;
  artistName: string | undefined;
  artistImage: string | undefined;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const ArtistTopTrackDialog = ({
  artistId,
  artistName,
  artistImage,
  isOpen,
  onOpenChange,
}: ArtistTopTrackDialogProps) => {
  if (!artistId) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-900 text-white border-white/10">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">{artistName}</DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          <Image
            src={artistImage || "/artist-placeholder.png"}
            alt={artistName || "Artist"}
            width={500}
            height={500}
            className="w-full aspect-square object-cover rounded-lg"
          />
          {/* Add top tracks list here */}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ArtistTopTrackDialog;
