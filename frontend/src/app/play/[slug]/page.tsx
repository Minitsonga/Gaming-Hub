"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { FeedbackMessage } from "../../../components/feedback-message";
import { RunDecisionOverlay } from "../../../components/run-decision-overlay";
import { fetchCatalogGames } from "../../../lib/catalog-client";
import { buildLaunchUrl, isLaunchableStatus } from "../../../lib/game-launch";
import { isDecisionOverlayEvent } from "../../../lib/overlay-events";
import { getRunPrompt, RunState } from "../../../lib/run-prompts";
import { persistRunSave } from "../../../lib/save-client";
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
              try {
                await persistRunSave({
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
                });
                setSaveStatus("saved");
              } catch {
                setSaveStatus("error");
              }
            }}
          >
            Save progression
          </button>
          {saveStatus === "saving" ? <p role="status">Saving progression...</p> : null}
          {saveStatus === "saved" ? <FeedbackMessage variant="success" message="Progression saved." /> : null}
          {saveStatus === "error" ? (
            <FeedbackMessage variant="error" message="Unable to save progression." />
          ) : null}
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
            window.postMessage({ type: "DECISION_SELECTED", payload: { choice } }, "*");
            setOverlayData(null);
            setRunState("running");
          }}
          onClose={() => setOverlayData(null)}
        />
      ) : null}
    </main>
  );
}
