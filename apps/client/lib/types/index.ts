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
