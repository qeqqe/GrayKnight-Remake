import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const handleSpotifyLogin = () => {
  window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/spotify`;
};

export const handleAuthCallback = (params: URLSearchParams) => {
  const token = params.get("token");
  const userId = params.get("userId");

  if (token && userId) {
    localStorage.setItem("token", token);
    localStorage.setItem("userId", userId);
    return true;
  }
  return false;
};
