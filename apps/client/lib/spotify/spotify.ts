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

  const body = {
    uris: options.uris,
    position_ms: options.position_ms,
  };

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
      throw new Error("Failed to play track");
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

  const endpoint = `https://api.spotify.com/v1/me/player/queue?${params.toString()}`;

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/spotify/add-to-queue`,
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
    market: options?.market || "US",
  });

  console.log("Search params:", params.toString());

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

export const checkIfTrackIsSaved = async (trackId: string) => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No token found");

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/spotify/check-track-saved/${trackId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to check track saved status");
    }

    return await response.json();
  } catch (error) {
    console.error("Error checking if track is saved:", error);
    throw error;
  }
};

export const removeTrackFromLibrary = async (trackId: string) => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No token found");

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/spotify/remove-from-library/${trackId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to remove track from library");
    }

    return response.json();
  } catch (error) {
    console.error("Error removing track from library:", error);
    throw error;
  }
};

export const saveTrackToLibrary = async (trackId: string) => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No token found");

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/spotify/save-to-library/${trackId}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to save track to library");
    }

    return response.json();
  } catch (error) {
    console.error("Error saving track to library:", error);
    throw error;
  }
};

export const seekToPosition = async (positionMs: number, deviceId?: string) => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No token found");

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/spotify/seek`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          position_ms: positionMs,
          device_id: deviceId,
        }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to seek to position");
    }

    return response.json();
  } catch (error) {
    console.error("Error seeking to position:", error);
    throw error;
  }
};

export const setRepeatMode = async (state: "track" | "context" | "off") => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No token found");

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/spotify/set-repeat-mode`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ state }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to set repeat mode");
    }

    return response.json();
  } catch (error) {
    console.error("Error setting repeat mode:", error);
    throw error;
  }
};

export const setVolume = async (volume: number, deviceId?: string) => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No token found");

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/spotify/set-volume`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          volume_percent: volume,
          device_id: deviceId,
        }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to set volume");
    }

    return response.json();
  } catch (error) {
    console.error("Error setting volume:", error);
    throw error;
  }
};

export const toggleShuffle = async (state: boolean) => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No token found");

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/spotify/toggle-shuffle`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ state }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to toggle shuffle");
    }

    return response.json();
  } catch (error) {
    console.error("Error toggling shuffle:", error);
    throw error;
  }
};

export const fetchRecentlyPlayed = async (
  after?: string,
  limit: number = 20
) => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("Spotify token not found");
    }

    const params = new URLSearchParams({
      limit: limit.toString(),
      ...(after && { after }),
    });

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/spotify/recently-played?${params}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch recently played tracks");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to fetch recently played tracks:", error);
    throw error;
  }
};

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

export async function fetchTotalTracks() {
  try {
    const token = localStorage.getItem("token");

    if (!token || token === "") {
      localStorage.clear();
      window.location.href = "/";
      throw new Error("Token not found");
    }

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/spotify/total-tracks`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Couldn't fetch total tracks played");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to fetch total tracks:", error);
    throw error;
  }
}

export async function fetchTopGenere() {
  try {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("No Spotify access token found");
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/spotify/top-genres`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    if (!response.ok) {
      throw new Error("Failed to fetch top genres");
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to fetch top genres:", error);
    throw error;
  }
}
