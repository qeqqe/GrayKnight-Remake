export interface spotifyTrack {
  id: string;
  name: string;
  duration_ms: number;
  explicit: boolean;
  artists: {
    external_urls: {
      spotify: string;
    };
    href: string;
    id: string;
    name: string;
    type: string;
    uri: string;
  }[];
  album: {
    id: string;
    album_type: string;
    name: string;
    images: {
      url: string;
      height?: number;
      width?: number;
    }[];
    external_urls: {
      spotify: string;
    };
    release_date: string;
    release_date_precision: "year" | "month" | "day";
  };
  preview_url: string | null;
  popularity?: number;
  progress_ms: number;
  is_playing: boolean;
  external_urls?: {
    spotify: string;
  };
  uri: string;
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
