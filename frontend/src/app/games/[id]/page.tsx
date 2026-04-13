"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { FeedbackMessage } from "../../../components/feedback-message";
import { GameDetailView } from "../../../components/game-detail-view";
import { fetchGameById } from "../../../lib/game-client";
import { CatalogGame } from "../../../types/catalog";

export default function GameDetailPage() {
  const params = useParams<{ id: string }>();
  const [game, setGame] = useState<CatalogGame | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const resolvedId = params?.id ?? "";

  useEffect(() => {
    if (!resolvedId) {
      setLoading(false);
      setError("Invalid game identifier.");
      return;
    }

    const controller = new AbortController();
    async function loadGame() {
      setLoading(true);
      setError(null);
      try {
        const nextGame = await fetchGameById(resolvedId, controller.signal);
        if (!nextGame) {
          setGame(null);
          setError("Game not found.");
          return;
        }
        setGame(nextGame);
      } catch {
        setError("Unable to load game detail.");
      } finally {
        setLoading(false);
      }
    }

    loadGame();
    return () => controller.abort();
  }, [resolvedId]);

  const content = useMemo(() => {
    if (loading) return <p role="status">Loading game detail...</p>;
    if (error) return <FeedbackMessage variant="error" message={error} />;
    if (!game) return <FeedbackMessage variant="info" message="No game to display." />;
    return <GameDetailView game={game} />;
  }, [error, game, loading]);

  return <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-4 p-6">{content}</main>;
}
