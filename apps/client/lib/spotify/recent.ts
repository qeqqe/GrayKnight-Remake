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
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/recent-spotify/recently-played?${params}`,
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
