import { OverviewPageStatisticsInterface } from "../types/StatTypes";

export async function fetchOverviewStats(): Promise<OverviewPageStatisticsInterface> {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No token found");

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/stats-spotify/overview`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch overview stats");
    }

    const data = await response.json();

    return data;
  } catch (error) {
    console.error("Error fetching overview stats:", error);
    throw error;
  }
}
