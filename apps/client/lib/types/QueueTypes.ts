export interface QueueInterface {
  album: Album;
  artists: Artist[];
  explicit: boolean;
  external_ids: Externalids;
  href: string;
  id: string;
  name: string;
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
