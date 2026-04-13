"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FeedbackMessage } from "../../components/feedback-message";
import { useAppPreferences } from "../../components/app-preferences";

type StoredUser = {
  username?: string;
  email?: string;
};

export default function ProtectedPage() {
  const router = useRouter();
  const { t } = useAppPreferences();
  const [logoutError, setLogoutError] = useState<string | null>(null);
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

  async function handleLogout() {
    setLogoutError(null);
    const accessToken = localStorage.getItem("accessToken");
    const endpoint = process.env.NEXT_PUBLIC_GRAPHQL_URL ?? "http://localhost:4000/graphql";

    try {
      if (accessToken) {
        await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            query: "mutation Logout { logout }",
          }),
        });
      }
    } catch {
      setLogoutError(t("Unable to contact server during logout.", "Echec deconnexion serveur."));
    } finally {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
      router.replace("/login?loggedOut=1");
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-4 p-6">
      <h1 className="text-2xl font-semibold">{t("Protected area", "Espace protege")}</h1>
      <p>{t("Welcome", "Bienvenue")} {user.username ?? user.email ?? "player"}.</p>
      <button
        type="button"
        onClick={handleLogout}
        className="w-fit rounded bg-black px-4 py-2 text-white dark:bg-zinc-200 dark:text-black"
        aria-label={t("Logout from current session", "Se deconnecter de la session")}
      >
        {t("Logout", "Deconnexion")}
      </button>
      {logoutError ? <FeedbackMessage variant="error" message={logoutError} /> : null}
      <Link className="underline" href="/">
        {t("Back home", "Retour accueil")}
      </Link>
    </main>
  );
}
