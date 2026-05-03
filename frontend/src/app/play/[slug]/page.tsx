"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { FeedbackMessage } from "../../../components/feedback-message";
import { RunDecisionOverlay } from "../../../components/run-decision-overlay";
import { fetchCatalogGames } from "../../../lib/catalog-client";
import { buildLaunchUrl, isLaunchableStatus } from "../../../lib/game-launch";
import { isDecisionOverlayEvent } from "../../../lib/overlay-events";
import { getRunPrompt, RunState } from "../../../lib/run-prompts";
import { loadRunSave, persistRunSave } from "../../../lib/save-client";
import { submitScore } from "../../../lib/leaderboard-client";
import { withRetry } from "../../../lib/retry";
import { CatalogGame } from "../../../types/catalog";

export default function PlayPage() {
  const params = useParams<{ slug: string }>();
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

  useEffect(() => {
    if (!game || !iframeLoaded) return;
    async function restoreSave() {
      setRestoreStatus("restoring");
      try {
        const saveData = await loadRunSave(game.slug);
        if (!saveData) {
          setRestoreStatus("empty");
          return;
        }
        iframeRef.current?.contentWindow?.postMessage({ type: "LOAD_SAVE", payload: saveData }, "*");
        setRestoreStatus("restored");
      } catch {
        setRestoreStatus("error");
      }
    }
    restoreSave();
  }, [game, iframeLoaded]);

  useEffect(() => {
    function onMessage(event: MessageEvent) {
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
  }, []);

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
          {restoreStatus === "restoring" ? <p role="status">Restoring progression...</p> : null}
          {restoreStatus === "restored" ? (
            <FeedbackMessage variant="success" message="Progression restored." />
          ) : null}
          {restoreStatus === "empty" ? (
            <FeedbackMessage variant="info" message="No previous progression found." />
          ) : null}
          {restoreStatus === "error" ? (
            <FeedbackMessage variant="error" message="Unable to restore progression." />
          ) : null}
          <p className="text-sm text-zinc-600 dark:text-zinc-300">{getRunPrompt(runState)}</p>
          <button
            type="button"
            className="w-fit rounded border px-3 py-1"
            onClick={() => {
              iframeRef.current?.contentWindow?.postMessage({ type: "RESTART_RUN" }, "*");
              setRunState("idle");
            }}
          >
            Restart run
          </button>
          <button
            type="button"
            className="w-fit rounded border px-3 py-1"
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
                setPersistenceError("Save failed after retry.");
              }
            }}
          >
            Save progression
          </button>
          <button
            type="button"
            className="w-fit rounded border px-3 py-1"
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
                setPersistenceError("Score submission failed after retry.");
              }
            }}
          >
            Submit score
          </button>
          <Link className="underline" href={`/leaderboard/${slug}`}>
            Open leaderboard
          </Link>
          {saveStatus === "saving" ? <p role="status">Saving progression...</p> : null}
          {saveStatus === "saved" ? <FeedbackMessage variant="success" message="Progression saved." /> : null}
          {saveStatus === "error" ? (
            <FeedbackMessage variant="error" message="Unable to save progression." />
          ) : null}
          {scoreStatus === "submitting" ? <p role="status">Submitting score...</p> : null}
          {scoreStatus === "submitted" ? <FeedbackMessage variant="success" message="Score submitted." /> : null}
          {scoreStatus === "error" ? <FeedbackMessage variant="error" message="Unable to submit score." /> : null}
          {persistenceError ? <FeedbackMessage variant="error" message={persistenceError} /> : null}
          <iframe
            ref={iframeRef}
            title={`${game.title} launch frame`}
            src={launchUrl}
            className="h-[70vh] w-full rounded border"
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
              "*"
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
