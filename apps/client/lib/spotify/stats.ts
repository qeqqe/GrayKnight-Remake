import { StatsResponse } from "../types/StatTypes";

export async function fetchListeningStats(
  timeRange: "week" | "month" | "year" = "week"
): Promise<StatsResponse> {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No token found");

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/stats-spotify/listening-stats?timeRange=${timeRange}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch listening stats");
    }

    const data = await response.json();
    console.log("Received stats data:", data); // Debug log
    return data;
  } catch (error) {
    console.error("Error fetching listening stats:", error);
    throw error;
  }
}
