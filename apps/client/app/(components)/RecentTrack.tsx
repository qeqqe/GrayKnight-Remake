"use client";

import { Button } from "@/components/ui/button";
import { formatDistance } from "date-fns";
import { RecentlyPlayedItem, RecentlyPlayedResponse } from "@/lib/types/index";
import { ScrollArea } from "@/components/ui/scroll-area";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Loader2, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { fetchRecentlyPlayed } from "@/lib/spotify/recent";
import { playTrackThroughQueue } from "@/lib/spotify/search";

function RecentlyPlayed() {
  const [items, setItems] = useState<RecentlyPlayedItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const fetchTracks = async (afterCursor?: string) => {
    try {
      setLoading(true);
      const data: RecentlyPlayedResponse = await fetchRecentlyPlayed(
        afterCursor,
        20
      );

      if (data.items.length === 0) {
        setHasMore(false);
        return;
      }

      // combine old and new items when loading more
      setItems((prevItems) =>
        afterCursor ? [...prevItems, ...data.items] : data.items
      );

      setHasMore(Boolean(data.next));
      setCursor(data.cursors?.after || null);
    } catch (error) {
      console.error("Failed to fetch recently played:", error);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  };

  // reset everything when component mounts
  useEffect(() => {
    setItems([]);
    setCursor(null);
    setHasMore(true);
    fetchTracks();
  }, []);

  const handleLoadMore = async () => {
    if (!loading && cursor) {
      await fetchTracks(cursor);
    }
  };

  const handlePlay = async (trackId: string, e: React.MouseEvent) => {
    e.preventDefault();
    try {
      await playTrackThroughQueue(`spotify:track:${trackId}`);
    } catch (error) {
      console.error("Failed to play track:", error);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <ScrollArea className="h-[300px] sm:h-[400px] pr-4">
        <div className="flex flex-col gap-2">
          {items.map((item) => (
            <div
              key={`${item.track.id}-${item.played_at}`}
              className="group flex items-center gap-2 sm:gap-4 p-2 sm:p-3 rounded-lg transition-colors hover:bg-zinc-800/50 bg-zinc-900/20"
            >
              {/* Update layout for better mobile display */}
              <div className="relative aspect-square h-10 w-10 sm:h-12 sm:w-12 overflow-hidden rounded">
                <Image
                  src={item.track.album.images[2]?.url || "/placeholder.png"}
                  alt={item.track.album.name}
                  fill
                  className="object-cover"
                />
              </div>

              <div className="flex flex-1 flex-col min-w-0">
                <Link
                  href={item.track.external_urls.spotify as unknown as URL}
                  target="_blank"
                  className="font-medium text-white hover:underline truncate"
                >
                  {item.track.name}
                </Link>
                <div className="flex items-center gap-2 text-sm text-zinc-400">
                  {item.track.artists.map((artist, i) => (
                    <span key={artist.name} className="truncate">
                      <Link
                        href={artist.external_urls.spotify as unknown as URL}
                        target="_blank"
                        className="hover:underline"
                      >
                        {artist.name}
                      </Link>
                      {i < item.track.artists.length - 1 && ", "}
                    </span>
                  ))}
                </div>
                <span className="text-xs text-zinc-500 mt-0.5">
                  {formatDistance(new Date(item.played_at), new Date(), {
                    addSuffix: true,
                  })}
                </span>
              </div>

              <Button
                size="icon"
                variant="ghost"
                className={cn(
                  "h-8 w-8 opacity-0 group-hover:opacity-100 transition-all",
                  "hover:bg-green-500 hover:text-black"
                )}
                onClick={(e) => handlePlay(item.track.id, e)}
              >
                <Play className="h-4 w-4 text-white" />
              </Button>
            </div>
          ))}

          {hasMore && items.length > 0 && (
            <Button
              onClick={handleLoadMore}
              disabled={loading}
              variant="ghost"
              className="w-full mt-4 hover:bg-zinc-800"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Load More"
              )}
            </Button>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

export default RecentlyPlayed;
