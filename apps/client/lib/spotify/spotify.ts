// api wrapper

export async function playSpotifyTrack(options: {
  uri?: string;
  context_uri?: string;
  uris?: string[];
  position_ms?: number;
  deviceId?: string;
  offset?: {
    uri?: string;
    position?: number;
  };
}) {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No Spotify access token found");

  const endpoint = `https://api.spotify.com/v1/me/player/play${
    options.deviceId ? `?device_id=${options.deviceId}` : ""
  }`;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const body: any = {};
  if (options.context_uri) body.context_uri = options.context_uri;
  if (options.uris) body.uris = options.uris;
  if (options.position_ms) body.position_ms = options.position_ms;
  if (options.offset) body.offset = options.offset;

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/spotify/play-spotify-track`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          endpoint,
          body,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error.message || "Failed to play track");
    }
  } catch (error) {
    console.error("Failed to play track:", error);
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

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/spotify/add-to-queue`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        endpoint: `https://api.spotify.com/v1/me/player/queue?${params.toString()}`,
      }),
    }
  );
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error.message || "Failed to add to queue");
  }
}

// pause
export const pauseSpotifyTrack = async (deviceId?: string) => {
  const token = localStorage.getItem("token");
  const endpoint = deviceId
    ? `https://api.spotify.com/v1/me/player/pause?device_id=${deviceId}`
    : "https://api.spotify.com/v1/me/player/pause";

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/spotify/pause-spotify-track`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ endpoint }),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to pause track");
  }
};

// skip
export const nextSpotifyTrack = async (deviceId?: string) => {
  const token = localStorage.getItem("token");
  const endpoint = deviceId
    ? `https://api.spotify.com/v1/me/player/next?device_id=${deviceId}`
    : "https://api.spotify.com/v1/me/player/next";

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/spotify/next-spotify-track`,
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
    throw new Error("Failed to skip to next track");
  }
};
// prev
export const previousSpotifyTrack = async (deviceId?: string) => {
  const token = localStorage.getItem("token");
  const endpoint = deviceId
    ? `https://api.spotify.com/v1/me/player/previous?device_id=${deviceId}`
    : "https://api.spotify.com/v1/me/player/previous";

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/spotify/prev-track`,
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
    throw new Error("Failed to go to previous track");
  }
};
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
  });

  if (options?.market) {
    params.append("market", options.market);
  }

  try {
    const response = await fetch(
      `${
        process.env.NEXT_PUBLIC_BACKEND_URL
      }/spotify/search?${params.toString()}`,
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
    console.error("Search failed:", error);
    throw error;
  }
}

// fetch artists top tracks

export const fetchArtistTopTracks = async (artistId: string) => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No Spotify access token found");
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/spotify/fetch-top-tracks?artistId=${artistId}`,
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
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/spotify/fetch-top-items?type=${type}&time=${time}`,
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
