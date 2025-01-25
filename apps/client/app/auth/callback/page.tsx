"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { Suspense } from "react";

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get("token");
    const error = searchParams.get("error");

    if (error) {
      console.error("Authentication error:", error);
      router.push("/");
      return;
    }

    if (token) {
      localStorage.setItem("token", token);
      localStorage.setItem(
        "tokenExpiry",
        (Date.now() + 7 * 24 * 60 * 60 * 1000).toString()
      );
      router.push("/dashboard");
    } else {
      router.push("/");
    }
  }, [router, searchParams]);

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <div className="text-white">Authenticating...</div>
    </div>
  );
}

export default function CallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
          <div className="text-white">Loading...</div>
        </div>
      }
    >
      <CallbackHandler />
    </Suspense>
  );
}
