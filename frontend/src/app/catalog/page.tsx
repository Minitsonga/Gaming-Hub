"use client";

import { useEffect, useState } from "react";
import { FeedbackMessage } from "../../components/feedback-message";
import { GameCardGrid } from "../../components/game-card-grid";
import { fetchCatalogGames } from "../../lib/catalog-client";
import { CatalogGame } from "../../types/catalog";

export default function CatalogPage() {
  const [games, setGames] = useState<CatalogGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadGames() {
      setLoading(true);
      setError(null);
      try {
        const nextGames = await fetchCatalogGames(controller.signal);
        setGames(nextGames);
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          setError("Unable to load catalog.");
        }
      } finally {
        setLoading(false);
      }
    }

    loadGames();
    return () => controller.abort();
  }, []);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-4 p-6">
      <h1 className="text-2xl font-semibold">Game Catalog</h1>
      {loading ? <p role="status">Loading catalog...</p> : null}
      {!loading && error ? <FeedbackMessage variant="error" message={error} /> : null}
      {!loading && !error && games.length === 0 ? (
        <FeedbackMessage variant="info" message="No games available yet." />
      ) : null}
      {!loading && !error && games.length > 0 ? <GameCardGrid games={games} /> : null}
    </main>
  );
}
