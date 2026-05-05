"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { FeedbackMessage } from "../../../components/feedback-message";
import { useAppPreferences } from "../../../components/app-preferences";
import { GameDetailView } from "../../../components/game-detail-view";
import { fetchGameById } from "../../../lib/game-client";
import { CatalogGame } from "../../../types/catalog";

export default function GameDetailPage() {
  const { t } = useAppPreferences();
  const params = useParams<{ id: string }>();
  const [game, setGame] = useState<CatalogGame | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const resolvedId = params?.id ?? "";

  useEffect(() => {
    if (!resolvedId) {
      setLoading(false);
      setError(t("Invalid game identifier.", "Identifiant de jeu invalide."));
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
          setError(t("Game not found.", "Jeu introuvable."));
          return;
        }
        setGame(nextGame);
      } catch {
        setError(t("Unable to load game detail.", "Impossible de charger le detail du jeu."));
      } finally {
        setLoading(false);
      }
    }

    loadGame();
    return () => controller.abort();
  }, [resolvedId]);

  const content = useMemo(() => {
    if (loading) return <p role="status">{t("Loading game detail...", "Chargement du detail du jeu...")}</p>;
    if (error) return <FeedbackMessage variant="error" message={error} />;
    if (!game) return <FeedbackMessage variant="info" message={t("No game to display.", "Aucun jeu a afficher.")} />;
    return <GameDetailView game={game} />;
  }, [error, game, loading, t]);

  return <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-4 px-6 py-8 sm:py-10">{content}</main>;
}
