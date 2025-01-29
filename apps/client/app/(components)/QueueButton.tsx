import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ListPlus } from "lucide-react";
import { addToQueue } from "@/lib/spotify/search";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface QueueButtonProps {
  trackId: string;
  deviceId?: string;
  variant?: "ghost" | "outline" | "default";
  size?: "default" | "sm" | "lg" | "icon";
}

export function QueueButton({
  trackId,
  deviceId,
  variant = "ghost",
  size = "icon",
}: QueueButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleAddToQueue = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsLoading(true);

    try {
      await addToQueue(`spotify:track:${trackId}`, deviceId);
    } catch (error) {
      console.error("Failed to add to queue:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={variant}
            size={size}
            onClick={handleAddToQueue}
            disabled={isLoading}
          >
            <ListPlus className="w-4 h-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Add to Queue</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
