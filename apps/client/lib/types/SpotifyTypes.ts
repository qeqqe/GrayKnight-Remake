export interface SpotifyPlaylistItem {
  id: string;
  name: string;
  images: { url: string }[];
  tracks: {
    href: string;
    total: number;
  };
  external_urls: {
    spotify: string;
  };
}

export interface PlaylistResponse {
  items: SpotifyPlaylistTrack[];
  next: string | null;
}

export interface SpotifyPlaylistTrack {
  track: {
    id: string;
    name: string;
    duration_ms: number;
    album: {
      images: { url: string }[];
      name: string;
    };
    artists: {
      name: string;
    }[];
    external_urls: {
      spotify: string;
    };
  };
}
