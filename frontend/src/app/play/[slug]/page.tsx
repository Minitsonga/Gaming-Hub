"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { FeedbackMessage } from "../../../components/feedback-message";
import { useAppPreferences } from "../../../components/app-preferences";
import { RunDecisionOverlay } from "../../../components/run-decision-overlay";
import { fetchCatalogGames } from "../../../lib/catalog-client";
import { buildLaunchUrl, isLaunchableStatus } from "../../../lib/game-launch";
import { isDecisionOverlayEvent } from "../../../lib/overlay-events";
import { getRunPrompt, RunState } from "../../../lib/run-prompts";
import { loadRunSave, persistRunSave } from "../../../lib/save-client";
import { submitScore } from "../../../lib/leaderboard-client";
import { withRetry } from "../../../lib/retry";
import { CatalogGame } from "../../../types/catalog";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

export default function PlayPage() {
  const { t } = useAppPreferences();
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const slug = params?.slug ?? "";
  const [game, setGame] = useState<CatalogGame | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [overlayData, setOverlayData] = useState<{
    title: string;
    description: string;
    choices: string[];
  } | null>(null);
  const [runState, setRunState] = useState<RunState>("idle");
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [restoreStatus, setRestoreStatus] = useState<"idle" | "restoring" | "restored" | "empty" | "error">("idle");
  const [scoreStatus, setScoreStatus] = useState<"idle" | "submitting" | "submitted" | "error">("idle");
  const [persistenceError, setPersistenceError] = useState<string | null>(null);
  const launchUrl = useMemo(() => {
    const baseUrl = process.env.NEXT_PUBLIC_GAME_HOST_URL ?? "http://localhost:8080";
    return game ? buildLaunchUrl(baseUrl, game.slug) : "";
  }, [game]);
  const launchOrigin = useMemo(() => {
    if (!launchUrl) return null;
    try {
      return new URL(launchUrl).origin;
    } catch {
      return null;
    }
  }, [launchUrl]);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      router.replace(`/login?next=${encodeURIComponent(`/play/${slug}`)}`);
      return;
    }
  }, [router, slug]);

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      setError(t("Invalid game slug.", "Slug de jeu invalide."));
      return;
    }

    const controller = new AbortController();
    let cancelled = false;
    async function loadGame() {
      setLoading(true);
      setError(null);
      try {
        const games = await fetchCatalogGames({}, controller.signal);
        if (cancelled) return;
        const selectedGame = games.find((entry) => entry.slug === slug) ?? null;
        if (!selectedGame) {
          setError(t("Game not found.", "Jeu introuvable."));
          setGame(null);
          return;
        }
        if (!isLaunchableStatus(selectedGame.status)) {
          setError(t("Game is not ready for launch.", "Le jeu n'est pas pret pour le lancement."));
          setGame(selectedGame);
          return;
        }
        setGame(selectedGame);
      } catch {
        if (!cancelled) {
          setError(t("Unable to load game metadata.", "Impossible de charger les metadonnees du jeu."));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    loadGame();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [slug]);

  useEffect(() => {
    if (!game || !iframeLoaded) return;
    const gameSlug = game.slug;
    let cancelled = false;
    async function restoreSave() {
      setRestoreStatus("restoring");
      try {
        const saveData = await loadRunSave(gameSlug);
        if (cancelled) return;
        if (!saveData) {
          setRestoreStatus("empty");
          return;
        }
        iframeRef.current?.contentWindow?.postMessage(
          { type: "LOAD_SAVE", payload: saveData },
          launchOrigin ?? "*"
        );
        setRestoreStatus("restored");
      } catch {
        if (!cancelled) {
          setRestoreStatus("error");
        }
      }
    }
    restoreSave();
    return () => {
      cancelled = true;
    };
  }, [game, iframeLoaded, launchOrigin]);

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (event.source !== iframeRef.current?.contentWindow) return;
      if (launchOrigin && event.origin !== launchOrigin) return;
      if (isDecisionOverlayEvent(event.data)) {
        setOverlayData(event.data.payload);
        setRunState("paused");
      }
      if (event.data?.type === "RUN_STATE_CHANGED") {
        const nextState = event.data?.payload?.state as RunState | undefined;
        if (nextState) setRunState(nextState);
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [launchOrigin]);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 px-6 py-8 sm:py-10">
      <h1 className="text-2xl font-semibold tracking-tight">{t("Game Session", "Session de jeu")}</h1>
      {loading ? <p role="status">{t("Preparing game session...", "Preparation de la session...")}</p> : null}
      {!loading && error ? <FeedbackMessage variant="error" message={error} /> : null}
      {!loading && game && !error ? (
        <section className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {t("Launching", "Lancement")} {game.title} ({game.technology})
              </CardTitle>
              <p className="text-sm text-muted-foreground">{getRunPrompt(runState)}</p>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  iframeRef.current?.contentWindow?.postMessage(
                    { type: "RESTART_RUN" },
                    launchOrigin ?? "*"
                  );
                  setRunState("idle");
                }}
              >
                {t("Restart run", "Redemarrer la run")}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={async () => {
                  if (!game) return;
                  setSaveStatus("saving");
                  setPersistenceError(null);
                  try {
                    await withRetry(() =>
                      persistRunSave({
                        gameSlug: game.slug,
                        playtimeMinutes: 5,
                        saveData: {
                          level: 1,
                          xp: 20,
                          xyst: 10,
                          runsCompleted: 1,
                          highestWave: 2,
                          totalKills: 15,
                          ownedSkills: [],
                        },
                      })
                    );
                    setSaveStatus("saved");
                  } catch {
                    console.error("[persistence] save_failed");
                    setSaveStatus("error");
                    setPersistenceError(t("Save failed after retry.", "Echec de sauvegarde apres tentative."));
                  }
                }}
              >
                {t("Save progression", "Sauvegarder la progression")}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={async () => {
                  if (!game) return;
                  setScoreStatus("submitting");
                  setPersistenceError(null);
                  try {
                    await withRetry(() => submitScore(game.slug, 1200));
                    setScoreStatus("submitted");
                  } catch {
                    console.error("[persistence] score_submit_failed");
                    setScoreStatus("error");
                    setPersistenceError(t("Score submission failed after retry.", "Echec d'envoi du score apres tentative."));
                  }
                }}
              >
                {t("Submit score", "Envoyer le score")}
              </Button>
              <Link href={`/leaderboard/${slug}`} className={cn(buttonVariants({ variant: "ghost" }))}>
                {t("Open leaderboard", "Ouvrir le classement")}
              </Link>
            </CardContent>
          </Card>

          {!iframeLoaded ? <p role="status" className="text-sm text-muted-foreground">{t("Loading game client...", "Chargement du client de jeu...")}</p> : null}
          {restoreStatus === "restoring" ? <p role="status" className="text-sm text-muted-foreground">{t("Restoring progression...", "Restauration de la progression...")}</p> : null}
          {restoreStatus === "restored" ? <FeedbackMessage variant="success" message={t("Progression restored.", "Progression restauree.")} /> : null}
          {restoreStatus === "empty" ? <FeedbackMessage variant="info" message={t("No previous progression found.", "Aucune progression precedente trouvee.")} /> : null}
          {restoreStatus === "error" ? <FeedbackMessage variant="error" message={t("Unable to restore progression.", "Impossible de restaurer la progression.")} /> : null}
          {saveStatus === "saving" ? <p role="status" className="text-sm text-muted-foreground">{t("Saving progression...", "Sauvegarde de la progression...")}</p> : null}
          {saveStatus === "saved" ? <FeedbackMessage variant="success" message={t("Progression saved.", "Progression sauvegardee.")} /> : null}
          {saveStatus === "error" ? <FeedbackMessage variant="error" message={t("Unable to save progression.", "Impossible de sauvegarder la progression.")} /> : null}
          {scoreStatus === "submitting" ? <p role="status" className="text-sm text-muted-foreground">{t("Submitting score...", "Envoi du score...")}</p> : null}
          {scoreStatus === "submitted" ? <FeedbackMessage variant="success" message={t("Score submitted.", "Score envoye.")} /> : null}
          {scoreStatus === "error" ? <FeedbackMessage variant="error" message={t("Unable to submit score.", "Impossible d'envoyer le score.")} /> : null}
          {persistenceError ? <FeedbackMessage variant="error" message={persistenceError} /> : null}

          <Separator />
          <iframe
            ref={iframeRef}
            title={`${game.title} ${t("launch frame", "zone de lancement")}`}
            src={launchUrl}
            className="h-[70vh] w-full rounded-lg border"
            onLoad={() => setIframeLoaded(true)}
          />
        </section>
      ) : null}
      {overlayData ? (
        <RunDecisionOverlay
          title={overlayData.title}
          description={overlayData.description}
          choices={overlayData.choices}
          onSelect={(choice) => {
            iframeRef.current?.contentWindow?.postMessage(
              { type: "DECISION_SELECTED", payload: { choice } },
              launchOrigin ?? "*"
            );
            setOverlayData(null);
            setRunState("running");
          }}
          onClose={() => setOverlayData(null)}
        />
      ) : null}
    </main>
  );
}
