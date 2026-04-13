"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { FeedbackMessage } from "../../../components/feedback-message";
import { fetchCatalogGames } from "../../../lib/catalog-client";
import { buildLaunchUrl, isLaunchableStatus } from "../../../lib/game-launch";
import { CatalogGame } from "../../../types/catalog";

export default function PlayPage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug ?? "";
  const [game, setGame] = useState<CatalogGame | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [iframeLoaded, setIframeLoaded] = useState(false);

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      setError("Invalid game slug.");
      return;
    }

    const controller = new AbortController();
    async function loadGame() {
      setLoading(true);
      setError(null);
      try {
        const games = await fetchCatalogGames({}, controller.signal);
        const selectedGame = games.find((entry) => entry.slug === slug) ?? null;
        if (!selectedGame) {
          setError("Game not found.");
          setGame(null);
          return;
        }
        if (!isLaunchableStatus(selectedGame.status)) {
          setError("Game is not ready for launch.");
          setGame(selectedGame);
          return;
        }
        setGame(selectedGame);
      } catch {
        setError("Unable to load game metadata.");
      } finally {
        setLoading(false);
      }
    }
    loadGame();
    return () => controller.abort();
  }, [slug]);

  const launchUrl = useMemo(() => {
    const baseUrl = process.env.NEXT_PUBLIC_GAME_HOST_URL ?? "http://localhost:8080";
    return game ? buildLaunchUrl(baseUrl, game.slug) : "";
  }, [game]);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-4 p-6">
      <h1 className="text-2xl font-semibold">Game Session</h1>
      {loading ? <p role="status">Preparing game session...</p> : null}
      {!loading && error ? <FeedbackMessage variant="error" message={error} /> : null}
      {!loading && game && !error ? (
        <section className="flex flex-col gap-3">
          <p className="text-sm text-zinc-600 dark:text-zinc-300">
            Launching <strong>{game.title}</strong> ({game.technology}).
          </p>
          {!iframeLoaded ? <p role="status">Loading game client...</p> : null}
          <iframe
            title={`${game.title} launch frame`}
            src={launchUrl}
            className="h-[70vh] w-full rounded border"
            onLoad={() => setIframeLoaded(true)}
          />
        </section>
      ) : null}
    </main>
  );
}
