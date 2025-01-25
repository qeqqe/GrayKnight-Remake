"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import {
  searchSpotify,
  playSpotifyTrack,
  addToQueue,
} from "@/lib/spotify/spotify";
import AlbumDialog from "./dialogs/AlbumDialog";
import PlaylistDialog from "./dialogs/PlaylistDialog";
import ArtistTopTrackDialog from "./dialogs/ArtistTopTrackDialog";
import Image from "next/image";

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
      await playSpotifyTrack({ uris: [track.uri] });
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
    <div className="space-y-6">
      <CardContent className="p-6">
        <h2 className="text-2xl font-bold mb-4 text-zinc-200">Search</h2>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Search..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="flex-1 bg-white/5 border-white/10 text-white"
            />
            <Button
              onClick={handleSearch}
              disabled={isLoading}
              variant="secondary"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <SearchIcon className="h-4 w-4" />
              )}
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            {SEARCH_TYPES.map((type) => (
              <label
                key={type}
                className="flex items-center space-x-2 bg-white/5 px-3 py-1 rounded-full"
              >
                <Checkbox
                  checked={selectedTypes.includes(type)}
                  onCheckedChange={() => handleTypeToggle(type)}
                  id={type}
                />
                <span className="text-sm capitalize text-zinc-300">{type}</span>
              </label>
            ))}
          </div>
        </div>
      </CardContent>

      {results && (
        <CardContent className="p-6">
          <ScrollArea className="h-[600px] rounded-md border border-white/10 p-4">
            {/* Tracks Section */}
            {results.tracks && results.tracks.items.length > 0 && (
              <div className="space-y-4 mb-8">
                <h3 className="text-xl font-semibold text-zinc-200">Tracks</h3>
                <div className="grid gap-2">
                  {results.tracks.items.map((track) => (
                    <div
                      key={track.id}
                      className="flex items-center gap-3 p-2 hover:bg-white/5 rounded-lg transition-colors"
                    >
                      {track.album?.images[2] && (
                        <Image
                          src={track.album.images[2].url}
                          alt={track.album.name}
                          width={40}
                          height={40}
                          className="w-10 h-10 object-cover rounded"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-zinc-200 truncate">
                          {track.name}
                        </p>
                        <p className="text-sm text-zinc-400 truncate">
                          {track.artists.map((a) => a.name).join(", ")}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="hover:bg-white/10"
                          onClick={() => handlePlay(track)}
                        >
                          <PlayCircle className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="hover:bg-white/10"
                          onClick={() => handleAddToQueue(track.uri)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Artists Section */}
            {results.artists && results.artists.items.length > 0 && (
              <div className="space-y-4 mb-8">
                <h3 className="text-xl font-semibold text-zinc-200">Artists</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {results.artists.items.map((artist) => (
                    <div
                      key={artist.id}
                      onClick={() => {
                        setSelectedArtist({
                          artistId: artist.id,
                          artistName: artist.name,
                          artistImage: artist.images?.[0]?.url || "",
                        });
                      }}
                      className="p-4 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                    >
                      <Image
                        src={
                          artist.images?.[0]?.url || "/artist-placeholder.png"
                        }
                        alt={artist.name}
                        width={300}
                        height={300}
                        className="w-full aspect-square object-cover rounded-full mb-3"
                      />
                      <p className="font-medium text-center truncate text-zinc-200">
                        {artist.name}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Albums Section */}
            {results.albums && results.albums.items.length > 0 && (
              <div className="space-y-4 mb-8">
                {/* ...rest of the album section... */}
              </div>
            )}

            {/* Shows Section */}
            {results.shows && results.shows.items.length > 0 && (
              <div className="space-y-4">
                {/* ...rest of the shows section... */}
              </div>
            )}
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
