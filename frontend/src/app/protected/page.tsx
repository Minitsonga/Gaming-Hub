"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FeedbackMessage } from "../../components/feedback-message";
import { useAppPreferences } from "../../components/app-preferences";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { graphqlFetch } from "@/lib/graphql-client";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { fetchCatalogGames } from "@/lib/catalog-client";
import { loadRunSave } from "@/lib/save-client";

type StoredUser = {
  id?: string;
  username?: string;
  email?: string;
};

type PersonalStats = {
  savedGames: number;
  totalRuns: number;
  totalKills: number;
  bestWave: number;
};

export default function ProtectedPage() {
  const router = useRouter();
  const { t } = useAppPreferences();
  const [logoutError, setLogoutError] = useState<string | null>(null);
  const [user, setUser] = useState<StoredUser | null>(null);
  const [stats, setStats] = useState<PersonalStats>({
    savedGames: 0,
    totalRuns: 0,
    totalKills: 0,
    bestWave: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      router.replace("/login");
      return;
    }
    try {
      const raw = localStorage.getItem("user");
      setUser(raw ? (JSON.parse(raw) as StoredUser) : {});
    } catch {
      setUser({});
    }
  }, [router]);

  useEffect(() => {
    let cancelled = false;
    async function loadPersonalStats() {
      setStatsLoading(true);
      try {
        const games = await fetchCatalogGames();
        let savedGames = 0;
        let totalRuns = 0;
        let totalKills = 0;
        let bestWave = 0;
        for (const game of games) {
          const save = await loadRunSave(game.slug);
          if (!save) continue;
          savedGames += 1;
          const runsCompleted = Number(save.runsCompleted ?? 0);
          const kills = Number(save.totalKills ?? 0);
          const wave = Number(save.highestWave ?? 0);
          totalRuns += Number.isFinite(runsCompleted) ? runsCompleted : 0;
          totalKills += Number.isFinite(kills) ? kills : 0;
          bestWave = Math.max(bestWave, Number.isFinite(wave) ? wave : 0);
        }
        if (!cancelled) {
          setStats({ savedGames, totalRuns, totalKills, bestWave });
        }
      } catch {
        if (!cancelled) {
          setStats({ savedGames: 0, totalRuns: 0, totalKills: 0, bestWave: 0 });
        }
      } finally {
        if (!cancelled) {
          setStatsLoading(false);
        }
      }
    }
    loadPersonalStats();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleLogout() {
    setLogoutError(null);

    try {
      const accessToken = localStorage.getItem("accessToken");
      if (accessToken) {
        const result = await graphqlFetch(
          { query: "mutation Logout { logout }" },
          { withAuth: true }
        );
        if (!result.ok && result.errors?.length) {
          setLogoutError(
            t("Unable to contact server during logout.", "Echec deconnexion serveur.")
          );
        }
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

  if (user === null) {
    return (
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-6 py-8 sm:py-10">
        <p className="text-muted-foreground" role="status">
          {t("Checking session...", "Verification de la session...")}
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-6 py-8 sm:py-10">
      <Card>
        <CardHeader>
          <CardTitle>{t("Protected area", "Espace protege")}</CardTitle>
          <CardDescription>
            {t("You are signed in.", "Vous etes connecte.")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-lg">
            {t("Welcome", "Bienvenue")}{" "}
            <span className="font-semibold text-primary">
              {user.username ?? user.email ?? "player"}
            </span>
            .
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-border/70 p-3">
              <p className="text-xs uppercase text-muted-foreground">{t("Username", "Pseudo")}</p>
              <p className="mt-1 font-medium">{user.username ?? "-"}</p>
            </div>
            <div className="rounded-lg border border-border/70 p-3">
              <p className="text-xs uppercase text-muted-foreground">{t("Email", "Email")}</p>
              <p className="mt-1 font-medium">{user.email ?? "-"}</p>
            </div>
          </div>
          <div className="rounded-lg border border-border/70 p-4">
            <h2 className="text-sm font-semibold">{t("Personal stats", "Stats personnelles")}</h2>
            {statsLoading ? (
              <p className="mt-2 text-sm text-muted-foreground">
                {t("Loading personal stats...", "Chargement des stats personnelles...")}
              </p>
            ) : (
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs uppercase text-muted-foreground">{t("Saved games", "Jeux sauvegardes")}</p>
                  <p className="text-lg font-semibold">{stats.savedGames}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-muted-foreground">{t("Total runs", "Total runs")}</p>
                  <p className="text-lg font-semibold">{stats.totalRuns}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-muted-foreground">{t("Total kills", "Kills totaux")}</p>
                  <p className="text-lg font-semibold">{stats.totalKills}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-muted-foreground">{t("Best wave", "Meilleure vague")}</p>
                  <p className="text-lg font-semibold">{stats.bestWave}</p>
                </div>
              </div>
            )}
          </div>
          <Separator />
          <Button
            type="button"
            variant="destructive"
            onClick={handleLogout}
            aria-label={t("Logout from current session", "Se deconnecter de la session")}
          >
            {t("Logout", "Deconnexion")}
          </Button>
          {logoutError ? <FeedbackMessage variant="error" message={logoutError} /> : null}
        </CardContent>
        <CardFooter>
          <Link href="/" className={cn(buttonVariants({ variant: "link" }), "h-auto p-0")}>
            {t("Back home", "Retour accueil")}
          </Link>
        </CardFooter>
      </Card>
    </main>
  );
}
