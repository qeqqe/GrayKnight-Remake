"use client";
import { useEffect, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { fetchCurrentUser } from "@/lib/spotify/library";
import { UserPlayList } from "@/lib/types/LibraryTypes";
import Image from "next/image";
import { PlaylistDialog } from "./PlaylistDialog";
import { SpotifyPlaylistItem } from "@/lib/types/SpotifyTypes";

const UserCurrentPlaylist = () => {
  const [currentUserPlaylist, setCurrentUserPlaylist] =
    useState<UserPlayList | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPlaylist, setSelectedPlaylist] =
    useState<SpotifyPlaylistItem | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await fetchCurrentUser();
        setCurrentUserPlaylist(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch playlists"
        );
        console.error("Error fetching playlists:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return <div className="flex justify-center p-4">Loading...</div>;
  }

  if (error) {
    return <div className="flex justify-center p-4 text-red-500">{error}</div>;
  }

  if (!currentUserPlaylist?.items?.length) {
    return <div className="flex justify-center p-4">No playlists found</div>;
  }

  const handlePlaylistClick = (playlist: SpotifyPlaylistItem) => {
    setSelectedPlaylist(playlist);
    setIsModalOpen(true);
  };

  return (
    <>
      <ScrollArea className="h-[300px] sm:h-[400px] pr-4">
        <div className="flex flex-col gap-4">
          {currentUserPlaylist?.items.map((playlist) => (
            <div
              key={playlist.id}
              className="flex items-center justify-between p-4 text-zinc-200 bg-zinc-800 rounded-lg cursor-pointer"
              onClick={() => handlePlaylistClick(playlist)}
            >
              <div className="flex items-center gap-4">
                <Image
                  src={playlist.images[0].url}
                  alt={playlist.name}
                  className="w-16 h-16 rounded-lg"
                  width={64}
                  height={64}
                />
                <div className="flex flex-col">
                  <h4 className="text-lg font-semibold">{playlist.name}</h4>
                  <p className="text-sm text-gray-400">
                    {playlist.tracks.total} tracks
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
      <PlaylistDialog
        playlist={selectedPlaylist}
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
      />
    </>
  );
};

export default UserCurrentPlaylist;
