export interface spotifyTrack {
  id: string;
  name: string;
  duration_ms: number;
  progress_ms: number;
  is_playing: boolean;
  popularity: number;
  preview_url?: string;
  explicit: boolean;
  uri: string;
  album?: {
    name: string;
    release_date?: string;
    album_type?: string;
    images: Array<{
      url: string;
      height: number;
      width: number;
    }>;
    external_urls: {
      spotify: string;
    };
  };
  artists: Array<{
    id: string;
    name: string;
    external_urls: {
      spotify: string;
    };
  }>;
  external_urls: {
    spotify: string;
  };
}

export interface SpotifyDevice {
  id: string;
  is_active: boolean;
  is_private: boolean;
  is_restricted: boolean;
  name: string;
  type: string;
  volume_percent: number;
  supports_volume: boolean;
}

export interface RecentlyPlayedItem {
  track: {
    album: {
      album_type: string;
      artists: Artist[];
      images: AlbumImage[];
      name: string;
      release_date: string;
      external_urls: {
        spotify: string;
      };
    };
    artists: Artist[];
    duration_ms: number;
    explicit: boolean;
    external_urls: {
      spotify: string;
    };
    id: string;
    name: string;
    popularity: number;
    preview_url: string | null;
  };
  played_at: string;
  context: {
    type: string;
    external_urls: {
      spotify: string;
    };
    uri: string;
  };
}

export interface RecentlyPlayedResponse {
  items: RecentlyPlayedItem[];
  cursors: {
    after: string;
    before: string;
  };
  limit: number;
  next: string;
}

export interface Artist {
  external_urls: {
    spotify: string;
  };
  name: string;
}

export interface AlbumImage {
  height: number;
  url: string;
  width: number;
}
