"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type StoredUser = {
  username?: string;
  email?: string;
};

export default function ProtectedPage() {
  const router = useRouter();
  const [user] = useState<StoredUser | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem("user");
      return raw ? (JSON.parse(raw) as StoredUser) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      router.replace("/login");
    }
  }, [router]);

  if (!user) {
    return <main className="p-6">Checking session...</main>;
  }

  function handleLogout() {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    router.push("/login");
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-4 p-6">
      <h1 className="text-2xl font-semibold">Protected area</h1>
      <p>Welcome {user.username ?? user.email ?? "player"}.</p>
      <button
        type="button"
        onClick={handleLogout}
        className="w-fit rounded bg-black px-4 py-2 text-white"
      >
        Logout
      </button>
      <Link className="underline" href="/">
        Back home
      </Link>
    </main>
  );
}
