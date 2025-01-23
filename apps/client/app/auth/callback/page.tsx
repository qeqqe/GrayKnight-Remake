"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function CallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get("token");
    const expires = searchParams.get("expires");

    if (token) {
      localStorage.setItem("token", token);
      localStorage.setItem("tokenExpiry", expires || "");
      router.push("/dashboard");
    } else {
      router.push("/");
    }
  }, [router, searchParams]);

  return <div>Authenticating...</div>;
}
