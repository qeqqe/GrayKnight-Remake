"use client";
import {
  SearchParamsTypes,
  UsersTopArtistInterface,
  UsersTopTracksInterface,
} from "@/lib/types/LibraryTypes";
import React, { useEffect, useState } from "react";
import { getTopItems } from "@/lib/spotify/library";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Image from "next/image";
import { Loader2 } from "lucide-react";

const UserTopItems = () => {
  const [loading, setLoading] = useState(false);
  const [topTrackItems, setTopTrackItems] =
    useState<UsersTopTracksInterface | null>(null);
  const [topArtistsItems, setTopArtistsItems] =
    useState<UsersTopArtistInterface | null>(null);
  const [searchParams, setSearchParams] = useState<SearchParamsTypes>({
    type: "tracks",
    time_range: "short_term",
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const topItems = await getTopItems(
          searchParams.type,
          searchParams.time_range
        );
        if (searchParams.type === "tracks") {
          setTopTrackItems(topItems);
          setTopArtistsItems(null);
        } else {
          setTopArtistsItems(topItems);
          setTopTrackItems(null);
        }
      } catch (error) {
        console.error("Error fetching top items:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [searchParams]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-4">
          <Button
            variant={"ghost"}
            onClick={() => setSearchParams({ ...searchParams, type: "tracks" })}
          >
            Top Tracks
          </Button>
          <Button
            // variant={searchParams.type === "artists" ? "ghost" : "ghost"}
            variant={"ghost"}
            onClick={() =>
              setSearchParams({ ...searchParams, type: "artists" })
            }
          >
            Top Artists
          </Button>
        </div>

        <Select
          value={searchParams.time_range}
          onValueChange={(value: "short_term" | "medium_term" | "long_term") =>
            setSearchParams({ ...searchParams, time_range: value })
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select time range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="short_term">Last 4 Weeks</SelectItem>
            <SelectItem value="medium_term">Last 6 Months</SelectItem>
            <SelectItem value="long_term">All Time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center items-center min-h-[200px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {searchParams.type === "tracks"
            ? topTrackItems?.items.map((item) => (
                <div
                  key={item.id}
                  className="bg-black/20 p-4 rounded-lg hover:bg-black/40 transition-all group"
                >
                  <div className="relative aspect-square mb-4">
                    <Image
                      src={item.album.images[0].url}
                      alt={item.name}
                      fill
                      className="object-cover rounded-md"
                    />
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium truncate">{item.name}</p>
                    <p className="text-sm text-gray-400 truncate">
                      {item.artists.map((artist) => artist.name).join(", ")}
                    </p>
                  </div>
                </div>
              ))
            : topArtistsItems?.items.map((item) => (
                <div
                  key={item.id}
                  className="bg-black/20 p-4 rounded-lg hover:bg-black/40 transition-all group"
                >
                  <div className="relative aspect-square mb-4">
                    <Image
                      src={item.images[0].url}
                      alt={item.name}
                      fill
                      className="object-cover rounded-md"
                    />
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium truncate">{item.name}</p>
                    <p className="text-sm text-gray-400">
                      Followers: {item.followers.total.toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
        </div>
      )}
    </div>
  );
};

export default UserTopItems;
