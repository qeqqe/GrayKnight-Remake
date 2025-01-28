export async function fetchTotalTracks() {
  try {
    const token = localStorage.getItem("token");

    if (!token || token === "") {
      localStorage.clear();
      window.location.href = "/";
      throw new Error("Token not found");
    }

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/overview-spotify/total-tracks`,
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
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/overview-spotify/top-genres`,
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

export async function getOfflineTrackingStatus() {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No token found");

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/offline-spotify/stats`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to get offline tracking status");
    }

    const data = await response.json();
    return data.isEnabled;
  } catch (error) {
    console.error("Error getting offline tracking status:", error);
    throw error;
  }
}

export async function toggleOfflineTracking(enable: boolean) {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No token found");

  const endpoint = enable ? "enable" : "disable";

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/offline-spotify/${endpoint}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to toggle offline tracking");
    }

    return response.json();
  } catch (error) {
    console.error("Error toggling offline tracking:", error);
    throw error;
  }
}
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
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/overview-spotify/play-spotify-track`,
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

// pause
export const pauseSpotifyTrack = async (deviceId?: string) => {
  const token = localStorage.getItem("token");
  const endpoint = deviceId
    ? `https://api.spotify.com/v1/me/player/pause?device_id=${deviceId}`
    : "https://api.spotify.com/v1/me/player/pause";

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/overview-spotify/pause-spotify-track`,
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
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/overview-spotify/next-spotify-track`,
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
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/overview-spotify/prev-track`,
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

export const checkIfTrackIsSaved = async (trackId: string) => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No token found");

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/overview-spotify/check-track-saved/${trackId}`,
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
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/overview-spotify/remove-from-library/${trackId}`,
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
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/overview-spotify/save-to-library/${trackId}`,
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
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/overview-spotify/seek`,
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
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/overview-spotify/set-repeat-mode`,
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
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/overview-spotify/set-volume`,
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
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/overview-spotify/toggle-shuffle`,
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
export async function fetchQueue() {
  try {
    const token = localStorage.getItem("token");

    if (!token || token === "") {
      localStorage.clear();
      window.location.href = "/";
      throw new Error("Token not found");
    }

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/overview-spotify/get-queue`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Couldn't fetch queue");
    }

    const data = await response.json();
    return data.queue || [];
  } catch (error) {
    console.error("Failed to fetch queue:", error);
    return [];
  }
}
