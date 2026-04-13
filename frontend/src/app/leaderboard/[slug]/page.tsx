"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { FeedbackMessage } from "../../../components/feedback-message";
import { LeaderboardPanel } from "../../../components/leaderboard-panel";
import { fetchLeaderboard, LeaderboardEntry } from "../../../lib/leaderboard-client";

export default function LeaderboardPage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug ?? "";
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      setError("Invalid game slug.");
      return;
    }
    async function load() {
      setLoading(true);
      setError(null);
      try {
        setEntries(await fetchLeaderboard(slug));
      } catch {
        setError("Unable to load leaderboard.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [slug]);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-4 p-6">
      <h1 className="text-2xl font-semibold">Leaderboard</h1>
      {loading ? <p role="status">Loading leaderboard...</p> : null}
      {!loading && error ? <FeedbackMessage variant="error" message={error} /> : null}
      {!loading && !error ? <LeaderboardPanel entries={entries} /> : null}
    </main>
  );
}
