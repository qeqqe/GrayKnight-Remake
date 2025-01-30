// Current user playlist

export interface UserPlayList {
  href: string;
  limit: number;
  next: string;
  offset: number;
  previous?: string;
  total: number;
  items: Item[];
}
interface Item {
  collaborative: boolean;
  description: string;
  external_urls: Externalurls;
  href: string;
  id: string;
  images: Image[];
  name: string;
  owner: Owner;
  primary_color?: string;
  public: boolean;
  snapshot_id: string;
  tracks: Tracks;
  type: string;
  uri: string;
}
interface Tracks {
  href: string;
  total: number;
}
interface Owner {
  display_name: string;
  external_urls: Externalurls;
  href: string;
  id: string;
  type: string;
  uri: string;
}
interface Image {
  height: number;
  url: string;
  width: number;
}
interface Externalurls {
  spotify: string;
}

// playlist items

export interface PlaylistItemsInterface {
  href: string;
  items: Item[];
  limit: number;
  next?: string;
  offset: number;
  previous?: string;
  total: number;
}
interface Item {
  added_at: string;
  added_by: Addedby;
  is_local: boolean;
  primary_color?: string;
  track: Track;
  video_thumbnail: Videothumbnail;
}
interface Videothumbnail {
  url?: string;
}
interface Track {
  preview_url?: string;
  available_markets: string[];
  explicit: boolean;
  type: string;
  episode: boolean;
  track: boolean;
  album: Album;
  artists: Artist[];
  disc_number: number;
  track_number: number;
  duration_ms: number;
  external_ids: Externalids;
  external_urls: Externalurls;
  href: string;
  id: string;
  name: string;
  popularity: number;
  uri: string;
  is_local: boolean;
}
interface Externalids {
  isrc: string;
}
interface Album {
  available_markets: string[];
  type: string;
  album_type: string;
  href: string;
  id: string;
  images: Image[];
  name: string;
  release_date: string;
  release_date_precision: string;
  uri: string;
  artists: Artist[];
  external_urls: Externalurls;
  total_tracks: number;
}
interface Artist {
  external_urls: Externalurls;
  href: string;
  id: string;
  name: string;
  type: string;
  uri: string;
}
interface Image {
  height: number;
  url: string;
  width: number;
}
interface Addedby {
  external_urls: Externalurls;
  href: string;
  id: string;
  type: string;
  uri: string;
}
interface Externalurls {
  spotify: string;
}

// User's top track

export interface UsersTopTracksInterface {
  items: Item[];
  total: number;
  limit: number;
  offset: number;
  href: string;
  next: string;
  previous?: string;
}
interface Item {
  album: Album;
  artists: Artist[];
  available_markets: string[];
  disc_number: number;
  duration_ms: number;
  explicit: boolean;
  external_ids: Externalids;
  external_urls: Externalurls;
  href: string;
  id: string;
  is_local: boolean;
  is_playable: boolean;
  name: string;
  popularity: number;
  preview_url?: string;
  track_number: number;
  type: string;
  uri: string;
}
interface Externalids {
  isrc: string;
}
interface Album {
  album_type: string;
  artists: Artist[];
  available_markets: string[];
  external_urls: Externalurls;
  href: string;
  id: string;
  images: Image[];
  is_playable: boolean;
  name: string;
  release_date: string;
  release_date_precision: string;
  total_tracks: number;
  type: string;
  uri: string;
}
interface Image {
  height: number;
  url: string;
  width: number;
}
interface Artist {
  external_urls: Externalurls;
  href: string;
  id: string;
  name: string;
  type: string;
  uri: string;
}
interface Externalurls {
  spotify: string;
}

// user's top artist

export interface UsersTopArtistInterface {
  items: Item[];
  total: number;
  limit: number;
  offset: number;
  href: string;
  next: string;
  previous?: string;
}
interface Item {
  external_urls: Externalurls;
  followers: Followers;
  genres: string[];
  href: string;
  id: string;
  images: Image[];
  name: string;
  popularity: number;
  type: string;
  uri: string;
}
interface Image {
  height: number;
  url: string;
  width: number;
}
interface Followers {
  href?: string;
  total: number;
}
interface Externalurls {
  spotify: string;
}

// secarh prarms type for top items
export interface SearchParamsTypes {
  type: "tracks" | "artists";
  time_range: "medium_term" | "short_term" | "long_term";
}
