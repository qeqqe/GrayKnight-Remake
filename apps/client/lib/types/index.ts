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
  cursors?: {
    after: string | null;
    before?: string | null;
  };
  next?: boolean;
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

export const SPOTIFY_CATEGORIES = [
  "pop",
  "hiphop",
  "workout",
  "party",
  "chill",
  "focus",
  "sleep",
  "country",
  "rock",
  "jazz",
  "classical",
  "gaming",
  "romance",
  "travel",
  "summer",
  "holiday",
  "dinner",
  "mood",
  "kids",
] as const;

export type SpotifyCategory = (typeof SPOTIFY_CATEGORIES)[number];

export const SEARCH_TYPES = [
  "track",
  "album",
  "artist",
  "playlist",
  "show",
  "episode",
  "audiobook",
] as const;

export type SpotifySearchType = (typeof SEARCH_TYPES)[number];

export interface SpotifySearchResponse {
  tracks?: {
    href: string;
    items: spotifyTrack[];
    limit: number;
    next: string | null;
    offset: number;
    previous: string | null;
    total: number;
  };
  artists?: {
    href: string;
    items: SpotifyArtist[];
    limit: number;
    next: string | null;
    offset: number;
    previous: string | null;
    total: number;
  };
  albums?: {
    href: string;
    items: SpotifyAlbum[];
    limit: number;
    next: string | null;
    offset: number;
    previous: string | null;
    total: number;
  };
  playlists?: {
    href: string;
    items: SpotifySearchPlaylistItem[];
    limit: number;
    next: string | null;
    offset: number;
    previous: string | null;
    total: number;
  };
  shows?: {
    href: string;
    items: SpotifyShow[];
    limit: number;
    next: string | null;
    offset: number;
    previous: string | null;
    total: number;
  };
}

interface SpotifySearchPlaylistItem {
  collaborative: boolean;
  description: string;
  external_urls: {
    spotify: string;
  };
  href: string;
  id: string;
  images: {
    height: number | null;
    url: string;
    width: number | null;
  }[];
  name: string;
  owner: {
    display_name: string;
    external_urls: {
      spotify: string;
    };
    href: string;
    id: string;
    type: string;
    uri: string;
  };
  primary_color: null;
  public: boolean;
  snapshot_id: string;
  tracks: {
    href: string;
    total: number;
  };
  type: string;
  uri: string;
}

export interface SpotifyAlbum {
  id: string;
  name: string;
  images: SpotifyImage[];
  artists: {
    name: string;
  }[];
  external_urls: {
    spotify: string;
  };
}

export interface SpotifyShow {
  id: string;
  name: string;
  description: string;
  publisher: string;
  images: SpotifyImage[];
  external_urls: {
    spotify: string;
  };
}

export interface SpotifyImage {
  height: number | null;
  url: string;
  width: number | null;
}

export interface SpotifyPlaylistTrack {
  track: {
    id: string;
    name: string;
    duration_ms: number;
    explicit: boolean;
    artists: {
      name: string;
    }[];
    album: {
      name: string;
      images: SpotifyImage[];
    };
    external_urls: {
      spotify: string;
    };
  };
  added_at: string;
}

export interface PlaylistResponse {
  items: SpotifyPlaylistTrack[];
  next: string | null;
  total: number;
}

export interface SpotifyQueue {
  currently_playing: spotifyTrack | null;
  queue: spotifyTrack[];
}

export interface SpotifyArtist {
  id: string;
  name: string;
  images: SpotifyImage[];
  external_urls: {
    spotify: string;
  };
}

export interface SpotifyPlaylistItem {
  id: string;
  name: string;
  description: string;
  images: SpotifyImage[];
  owner: {
    display_name: string;
  };
  tracks: {
    total: number;
  };
  external_urls: {
    spotify: string;
  };
}

export interface TrackPlayInterface {
  id: string;
  userId: string;
  trackId: string;
  timestamp: string;

  trackName: string;
  artistIds: string[];
  artistNames: string[];
  albumName: string;
  durationMs: number;
  popularity: number;

  contextType?: string;
  contextUri?: string;
  playedDurationMs?: number;
  skipped: boolean;
}

export interface GenreWithCount {
  genre: string;
  count: number;
}

export interface ArtistGenreCacheInterface {
  id: string;
  artistId: string;
  genres: string[];
  playCount: number;
  updatedAt: string;
}
