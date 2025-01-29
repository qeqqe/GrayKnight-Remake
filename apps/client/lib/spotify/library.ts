export async function fetchCurrentUser() {
  try {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("No token found");

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/library-spotify/current-user-playlist`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Falied to fetch current user playlist");
    }

    return response.json();
  } catch (error) {
    console.error("Error Fetching current user playlist:", error);
    throw error;
  }
}

export async function getPlayListItem(playlistId: string) {
  try {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("No token found");

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/library-spotify/get-playlist-item/${playlistId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch playlist item");
    }

    return response.json();
  } catch (error) {
    console.error("Error fetching playlist item:", error);
    throw error;
  }
}
