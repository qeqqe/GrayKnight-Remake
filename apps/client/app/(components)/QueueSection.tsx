import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { fetchQueue, playSpotifyTrack } from "@/lib/spotify/spotify";
import { QueueInterface } from "@/lib/types/QueueType";
import Image from "next/image";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { Play } from "lucide-react";

const QueueSection = () => {
  const [queueItems, setQueueItems] = useState<QueueInterface[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const data = await fetchQueue();
        console.log("Queue data:", data);
        setQueueItems(data || []);
      } catch (error) {
        console.error("Error fetching queue data:", error);
        setQueueItems([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
    // const interval = setInterval(fetchData, 10000);
    // return () => clearInterval(interval);
  }, [router]);

  const handlePlay = async (trackId: string, e: React.MouseEvent) => {
    e.preventDefault();
    try {
      await playSpotifyTrack({
        uris: [`spotify:track:${trackId}`],
      });
    } catch (error) {
      console.error("Failed to play track:", error);
    }
  };

  if (isLoading) {
    return <p className="text-gray-500 text-sm">Loading queue...</p>;
  }

  if (!queueItems.length) {
    return (
      <div className="flex items-center justify-center h-[300px] text-zinc-500">
        <p className="text-center">
          Queue is empty
          <br />
          <span className="text-sm">Add some tracks to your queue</span>
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <ScrollArea className="flex-1 -mr-6 pr-6">
        {queueItems.slice(0, 5).map((track, index) => (
          <div
            key={track.id + index}
            className="flex items-center gap-3 p-3 hover:bg-zinc-300/70 dark:hover:bg-zinc-800/50 rounded-md group"
          >
            <Image
              src={track.album.images[2]?.url || "/placeholder.png"}
              alt={track.album.name}
              width={40}
              height={40}
              className="object-cover rounded"
            />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-zinc-20 truncate">{track.name}</p>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 truncate">
                {track.artists.map((a) => a.name).join(", ")}
              </p>
            </div>
            <Button
              size="sm"
              variant="ghost"
              className="group-hover:opacity-100 transition-opacity"
              onClick={(e) => handlePlay(track.id, e)}
            >
              <Play size={16} className="text-zinc-300" />
            </Button>
          </div>
        ))}
      </ScrollArea>
    </div>
  );
};

export default QueueSection;
