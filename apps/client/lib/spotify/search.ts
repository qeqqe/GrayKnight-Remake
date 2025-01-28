import { nextSpotifyTrack } from "./overview";

// search
export async function searchSpotify(
  query: string,
  types: string[],
  options?: {
    market?: string;
    limit?: number;
    offset?: number;
  }
) {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No Spotify access token found");

  const params = new URLSearchParams({
    q: query,
    type: types.join(","),
    limit: (options?.limit || 20).toString(),
    offset: (options?.offset || 0).toString(),
    market: options?.market || "US",
  });

  console.log("Search params:", params.toString());

  try {
    const response = await fetch(
      `${
        process.env.NEXT_PUBLIC_BACKEND_URL
      }/search-spotify/search?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      console.error("Search response not ok:", response.status);
      const error = await response.json();
      throw new Error(error.error?.message || "Failed to search");
    }

    const result = await response.json();
    console.log("Raw search result:", result);

    // If the response is wrapped in a json property, unwrap it
    return result.json ? await response.json() : result;
  } catch (error) {
    console.error("Search failed:", error);
    throw error;
  }
}

// queue
export async function addToQueue(trackUri: string, deviceId?: string) {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No Spotify access token found");

  const params = new URLSearchParams({
    uri: trackUri,
    ...(deviceId && { device_id: deviceId }),
  });

  const endpoint = `https://api.spotify.com/v1/me/player/queue?${params.toString()}`;

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/search-spotify/add-to-queue`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ endpoint }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "Failed to add to queue");
    }
  } catch (error) {
    console.error("Failed to add to queue:", error);
    throw error;
  }
}

export async function playTrackThroughQueue(uri: string) {
  try {
    // First add to queue
    await addToQueue(uri);
    // Then skip to next track (which will be our queued track)
    await nextSpotifyTrack();
  } catch (error) {
    console.error("Failed to play track through queue:", error);
    throw error;
  }
}

export const fetchArtistTopTracks = async (artistId: string) => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No Spotify access token found");
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/search-spotify/fetch-top-tracks?artistId=${artistId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error.message || "Failed to search");
    }

    return await response.json();
  } catch (error) {
    console.error("Failed to fetch artist top tracks:", error);
    throw error;
  }
};

// top items
export const fetchTopItems = async (
  type: "artists" | "tracks",
  time: "short_term" | "medium_term" | "long_term"
) => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No Spotify access token found");
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/search-spotify/fetch-top-items?type=${type}&time=${time}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error.message || "Failed to fetch top items");
    }
    return await response.json();
  } catch (error) {
    console.error("Failed to fetch top items:", error);
    throw error;
  }
};
