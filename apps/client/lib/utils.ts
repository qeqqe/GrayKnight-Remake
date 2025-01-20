import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const handleSpotifyLogin = async () => {
  window.location.href = `${process.env.BACKEND_URL}/auth/spotify`;
};
