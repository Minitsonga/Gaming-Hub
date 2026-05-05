"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAppPreferences } from "../../../components/app-preferences";
import { FeedbackMessage } from "../../../components/feedback-message";
import { LeaderboardPanel } from "../../../components/leaderboard-panel";
import { fetchLeaderboard, LeaderboardEntry } from "../../../lib/leaderboard-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function LeaderboardPage() {
  const { t } = useAppPreferences();
  const params = useParams<{ slug: string }>();
  const slug = params?.slug ?? "";
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      setError(t("Invalid game slug.", "Slug de jeu invalide."));
      return;
    }
    async function load() {
      setLoading(true);
      setError(null);
      try {
        setEntries(await fetchLeaderboard(slug));
      } catch {
        setError(t("Unable to load leaderboard.", "Impossible de charger le classement."));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [slug]);

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 px-6 py-8 sm:py-10">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{t("Leaderboard", "Classement")}</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? <p role="status" className="text-sm text-muted-foreground">{t("Loading leaderboard...", "Chargement du classement...")}</p> : null}
          {!loading && error ? <FeedbackMessage variant="error" message={error} /> : null}
          {!loading && !error ? <LeaderboardPanel entries={entries} /> : null}
        </CardContent>
      </Card>
    </main>
  );
}
