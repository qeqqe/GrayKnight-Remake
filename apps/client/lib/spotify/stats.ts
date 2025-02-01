import { OverviewPageStatisticsInterface } from "../types/StatTypes";

export async function fetchOverviewStats(): Promise<OverviewPageStatisticsInterface> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/stats-spotify/overview`,
    {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    }
  );
  if (!res.ok) throw new Error("Failed to fetch overview stats");
  return res.json();
}
