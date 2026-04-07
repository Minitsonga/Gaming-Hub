"use client";

import Link from "next/link";
import { useAppPreferences } from "../components/app-preferences";

export default function Home() {
  const { t } = useAppPreferences();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col items-start justify-center gap-4 p-6">
      <h1 className="text-3xl font-semibold">{t("Gaming Hub Frontend", "Frontend Gaming Hub")}</h1>
      <p className="text-zinc-600">
        {t(
          "Frontend initialized. Continue with authentication flow.",
          "Frontend initialise. Continue avec le flux d'authentification."
        )}
      </p>
      <div className="flex gap-3">
        <Link className="rounded bg-black px-4 py-2 text-white" href="/register">
          {t("Create account", "Creer un compte")}
        </Link>
        <Link className="rounded border px-4 py-2" href="/login">
          {t("Login", "Connexion")}
        </Link>
      </div>
    </main>
  );
}
