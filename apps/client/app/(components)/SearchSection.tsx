"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { CardContent } from "@/components/ui/card";
import { Search as SearchIcon, Loader2, Plus, PlayCircle } from "lucide-react";
import {
  SEARCH_TYPES,
  SpotifySearchType,
  SpotifySearchResponse,
  SpotifyAlbum,
  SpotifyPlaylistItem,
  spotifyTrack,
} from "@/lib/types";
import AlbumDialog from "./dialogs/AlbumDialog";
import PlaylistDialog from "./dialogs/PlaylistDialog";
import ArtistTopTrackDialog from "./dialogs/ArtistTopTrackDialog";
import Image from "next/image";
import {
  addToQueue,
  playTrackThroughQueue,
  searchSpotify,
} from "@/lib/spotify/search";

const SearchSection = () => {
  const [query, setQuery] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<SpotifySearchType[]>([
    "track",
  ]);
  const [results, setResults] = useState<SpotifySearchResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAlbum, setSelectedAlbum] = useState<SpotifyAlbum | null>(null);
  const [selectedPlaylist, setSelectedPlaylist] =
    useState<SpotifyPlaylistItem | null>(null);
  const [selectedArtist, setSelectedArtist] = useState<{
    artistId: string | null;
    artistName: string;
    artistImage: string;
  } | null>(null);

  const handleSearch = async () => {
    if (!query.trim() || selectedTypes.length === 0) return;

    setIsLoading(true);
    try {
      console.log("Searching with query:", query, "types:", selectedTypes);
      const searchResults = await searchSpotify(query, selectedTypes);
      console.log("Search results:", searchResults);

      const parsedResults =
        typeof searchResults === "string"
          ? JSON.parse(searchResults)
          : searchResults;

      setResults(parsedResults);
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    console.log("Updated results:", results);
  }, [results]);

  const handleTypeToggle = (type: SpotifySearchType) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const handlePlay = async (track: spotifyTrack) => {
    try {
      await playTrackThroughQueue(track.uri);
    } catch (error) {
      console.error("Failed to play track:", error);
    }
  };

  const handleAddToQueue = async (uri: string) => {
    try {
      await addToQueue(uri);
    } catch (error) {
      console.error("Failed to add to queue:", error);
    }
  };

  return (
    <div className="w-full h-full">
      {/* Search Header */}
      <CardContent className="p-4 lg:p-6">
        <h2 className="text-xl lg:text-2xl font-bold mb-4 text-zinc-200">
          Search
        </h2>
        <div className="space-y-4">
          {/* Search Input */}
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              placeholder="Search..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="flex-1 bg-white/5 border-white/10 text-white h-12"
            />
            <Button
              onClick={handleSearch}
              disabled={isLoading}
              variant="secondary"
              className="w-full sm:w-auto h-12"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <SearchIcon className="h-5 w-5" />
              )}
            </Button>
          </div>

          {/* Search Filters */}
          <ScrollArea className="w-full pb-4" type="scroll">
            <div className="flex gap-2">
              {SEARCH_TYPES.map((type) => (
                <label
                  key={type}
                  className="flex-shrink-0 flex items-center space-x-2 bg-white/5 px-3 py-2 rounded-full"
                >
                  <Checkbox
                    checked={selectedTypes.includes(type)}
                    onCheckedChange={() => handleTypeToggle(type)}
                    id={type}
                    className="data-[state=checked]:bg-green-500"
                  />
                  <span className="text-sm capitalize text-zinc-300">
                    {type}
                  </span>
                </label>
              ))}
            </div>
            <ScrollBar orientation="horizontal" className="mt-2" />
          </ScrollArea>
        </div>
      </CardContent>

      {/* Search Results - Adjusted sizing and spacing */}
      {results && (
        <CardContent className="p-4">
          <ScrollArea className="h-[calc(100vh-280px)] w-full rounded-md border border-white/10">
            <div className="p-4 space-y-8">
              {/* Tracks Section - Updated controls layout */}
              {results.tracks && results.tracks.items.length > 0 && (
                <div className="space-y-4 w-full">
                  <h3 className="text-lg lg:text-xl font-semibold text-zinc-200 px-2">
                    Tracks
                  </h3>
                  <div className="grid gap-2 w-full">
                    {results.tracks.items.map((track) => (
                      <div
                        key={track.id}
                        className="flex items-center gap-3 p-3 hover:bg-white/5 rounded-lg transition-colors w-full group"
                      >
                        {/* Track Image */}
                        <div className="w-12 h-12 flex-shrink-0">
                          {track.album?.images[2] && (
                            <Image
                              src={track.album.images[2].url}
                              alt={track.album.name}
                              width={48}
                              height={48}
                              className="w-full h-full object-cover rounded"
                            />
                          )}
                        </div>

                        {/* Track Info */}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-zinc-200 truncate">
                            {track.name}
                          </p>
                          <p className="text-sm text-zinc-400 truncate">
                            {track.artists.map((a) => a.name).join(", ")}
                          </p>
                        </div>

                        {/* Action Buttons - Always visible on mobile */}
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="hover:bg-white/10 flex text-zinc-400 hover:text-zinc-100"
                            onClick={() => handlePlay(track)}
                          >
                            <PlayCircle className="h-5 w-5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="hover:bg-white/10 flex  text-green-800 hover:text-green-500"
                            onClick={() => handleAddToQueue(track.uri)}
                          >
                            <Plus className="h-5 w-5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Artists Section */}
              {results.artists && results.artists.items.length > 0 && (
                <div className="space-y-4 w-full">
                  <h3 className="text-lg lg:text-xl font-semibold text-zinc-200 px-2">
                    Artists
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 px-2 w-full">
                    {results.artists.items.map((artist) => (
                      <div
                        key={artist.id}
                        onClick={() =>
                          setSelectedArtist({
                            artistId: artist.id,
                            artistName: artist.name,
                            artistImage: artist.images?.[0]?.url || "",
                          })
                        }
                        className="group cursor-pointer"
                      >
                        <div className="aspect-square overflow-hidden rounded-full mb-3 bg-white/5">
                          <Image
                            src={
                              artist.images?.[0]?.url ||
                              "/artist-placeholder.png"
                            }
                            alt={artist.name}
                            width={300}
                            height={300}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        </div>
                        <p className="font-medium text-center truncate text-zinc-200">
                          {artist.name}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Keep other sections (Albums, Shows) with similar responsive adjustments */}
            </div>
          </ScrollArea>
        </CardContent>
      )}

      <AlbumDialog
        album={selectedAlbum}
        isOpen={!!selectedAlbum}
        onOpenChange={(open: boolean) => !open && setSelectedAlbum(null)}
      />
      <PlaylistDialog
        playlist={selectedPlaylist}
        isOpen={!!selectedPlaylist}
        onOpenChange={(open: boolean) => !open && setSelectedPlaylist(null)}
      />
      <ArtistTopTrackDialog
        artistId={selectedArtist?.artistId}
        artistName={selectedArtist?.artistName}
        artistImage={selectedArtist?.artistImage}
        isOpen={!!selectedArtist}
        onOpenChange={(open: boolean) => !open && setSelectedArtist(null)}
      />
    </div>
  );
};

export default SearchSection;
