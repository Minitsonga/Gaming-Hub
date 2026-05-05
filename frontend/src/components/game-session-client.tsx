"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { graphqlRequest } from "@/lib/graphql";

type GameSessionClientProps = {
  gameId: string;
  gameTitle: string;
  launchUrl: string;
};

type OverlayChoice = { id: string; label: string; primary?: boolean };
type DecisionOverlayEvent = {
  type: "DECISION_OVERLAY";
  title: string;
  description?: string;
  choices: OverlayChoice[];
};
type PromptEvent = {
  type: "PROMPT";
  title: string;
  message: string;
};
type RunEndedEvent = {
  type: "RUN_ENDED";
  score: number;
  savePayload: string;
};
type RuntimeEvent = DecisionOverlayEvent | PromptEvent | RunEndedEvent;

type LeaderboardItem = {
  rank: number;
  user: string;
  score: number;
};

type LeaderboardQuery = {
  leaderboard: LeaderboardItem[];
};

type FailedAction =
  | { kind: "save"; payload: string }
  | { kind: "score"; payload: number }
  | null;

const SAVE_PROGRESSION_MUTATION = `
  mutation SaveProgression($input: SaveProgressionInput!) {
    saveProgression(input: $input) {
      id
    }
  }
`;

const RESTORE_PROGRESSION_QUERY = `
  query RestoreProgression($gameId: ID!) {
    restoreProgression(gameId: $gameId) {
      payload
    }
  }
`;

const SUBMIT_SCORE_MUTATION = `
  mutation SubmitScore($input: SubmitScoreInput!) {
    submitScore(input: $input) {
      id
    }
  }
`;

const LEADERBOARD_QUERY = `
  query Leaderboard($gameId: ID!) {
    leaderboard(gameId: $gameId) {
      rank
      user
      score
    }
  }
`;

export function GameSessionClient({ gameId, gameTitle, launchUrl }: GameSessionClientProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [runtimeError, setRuntimeError] = useState<string | null>(null);
  const [overlay, setOverlay] = useState<DecisionOverlayEvent | null>(null);
  const [prompt, setPrompt] = useState<PromptEvent | null>(null);
  const [lastSavePayload, setLastSavePayload] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [scoreStatus, setScoreStatus] = useState<string | null>(null);
  const [operationError, setOperationError] = useState<string | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardItem[]>([]);
  const [lastFailedAction, setLastFailedAction] = useState<FailedAction>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const token = useMemo(() => localStorage.getItem("accessToken") ?? "", []);

  const refreshLeaderboard = useCallback(async () => {
    try {
      const data = await graphqlRequest<LeaderboardQuery>(
        LEADERBOARD_QUERY,
        { gameId },
        { token }
      );
      setLeaderboard(data.leaderboard);
    } catch {
      setLeaderboard([]);
    }
  }, [gameId, token]);

  const saveProgression = useCallback(
    async (savePayload: string) => {
      setOperationError(null);
      setSaveStatus("Saving progression...");
      try {
        await graphqlRequest(
          SAVE_PROGRESSION_MUTATION,
          { input: { gameId, payload: savePayload } },
          { token }
        );
        setSaveStatus("Progression saved.");
        setLastFailedAction(null);
      } catch (error) {
        setSaveStatus("Save failed.");
        setOperationError(
          error instanceof Error ? error.message : "Unable to save progression right now."
        );
        setLastFailedAction({ kind: "save", payload: savePayload });
      }
    },
    [gameId, token]
  );

  const submitScore = useCallback(
    async (score: number) => {
      setOperationError(null);
      setScoreStatus("Submitting score...");
      try {
        await graphqlRequest(
          SUBMIT_SCORE_MUTATION,
          { input: { gameId, score } },
          { token }
        );
        setScoreStatus("Score submitted.");
        setLastFailedAction(null);
        await refreshLeaderboard();
      } catch (error) {
        setScoreStatus("Score submission failed.");
        setOperationError(
          error instanceof Error ? error.message : "Unable to submit score right now."
        );
        setLastFailedAction({ kind: "score", payload: score });
      }
    },
    [gameId, refreshLeaderboard, token]
  );

  useEffect(() => {
    let active = true;
    graphqlRequest<{ restoreProgression?: { payload?: string } | null }>(
      RESTORE_PROGRESSION_QUERY,
      { gameId },
      { token }
    )
      .then((data) => {
        if (!active) return;
        const payload = data.restoreProgression?.payload;
        if (payload) {
          setLastSavePayload(payload);
          setSaveStatus("Previous progression restored.");
        } else {
          setSaveStatus("No previous progression found. Starting a new run.");
        }
      })
      .catch(() => {
        if (active) {
          setSaveStatus("Unable to restore progression. Starting a new run.");
        }
      });

    void graphqlRequest<LeaderboardQuery>(LEADERBOARD_QUERY, { gameId }, { token })
      .then((data) => {
        if (active) setLeaderboard(data.leaderboard);
      })
      .catch(() => {
        if (active) setLeaderboard([]);
      });
    return () => {
      active = false;
    };
  }, [gameId, token]);

  useEffect(() => {
    function onMessage(event: MessageEvent<RuntimeEvent>) {
      if (typeof event.data !== "object" || !event.data) return;

      switch (event.data.type) {
        case "DECISION_OVERLAY":
          setOverlay(event.data);
          break;
        case "PROMPT":
          setPrompt(event.data);
          break;
        case "RUN_ENDED":
          setLastSavePayload(event.data.savePayload);
          void saveProgression(event.data.savePayload);
          void submitScore(event.data.score);
          break;
        default:
          break;
      }
    }

    window.addEventListener("message", onMessage as EventListener);
    return () => window.removeEventListener("message", onMessage as EventListener);
  }, [saveProgression, submitScore]);

  function chooseOverlayChoice(choiceId: string) {
    iframeRef.current?.contentWindow?.postMessage(
      {
        type: "OVERLAY_CHOICE",
        payload: { gameId, choiceId },
      },
      "*"
    );
    setOverlay(null);
  }

  function restartRun() {
    setPrompt(null);
    setOverlay(null);
    setRuntimeError(null);
    setIsLoading(true);
    iframeRef.current?.contentWindow?.postMessage(
      {
        type: "RESTART_RUN",
        payload: { gameId, restorePayload: lastSavePayload ?? null },
      },
      "*"
    );
  }

  async function retryLastOperation() {
    if (!lastFailedAction) return;
    if (lastFailedAction.kind === "save") {
      await saveProgression(lastFailedAction.payload);
      return;
    }
    await submitScore(lastFailedAction.payload);
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-4 p-6">
      <h1 className="text-3xl font-semibold">{gameTitle}</h1>

      <div className="relative overflow-hidden rounded border bg-black">
        {isLoading ? (
          <p className="absolute inset-x-0 top-0 bg-zinc-900/80 p-2 text-sm text-white">
            Initializing game runtime...
          </p>
        ) : null}
        <iframe
          ref={iframeRef}
          title={`${gameTitle} runtime`}
          src={launchUrl}
          className="h-[620px] w-full"
          onLoad={() => setIsLoading(false)}
          onError={() => setRuntimeError("The runtime could not be loaded. Check launch URL.")}
        />
      </div>

      {runtimeError ? (
        <p className="rounded border border-red-300 bg-red-50 p-3 text-red-700" role="alert">
          {runtimeError}
        </p>
      ) : null}

      {overlay ? (
        <section className="rounded border bg-white p-4 shadow">
          <h2 className="text-lg font-semibold">{overlay.title}</h2>
          {overlay.description ? <p className="mt-1 text-sm text-zinc-700">{overlay.description}</p> : null}
          <div className="mt-3 flex flex-wrap gap-2">
            {overlay.choices.map((choice) => (
              <button
                key={choice.id}
                type="button"
                className={`rounded px-4 py-2 ${choice.primary ? "bg-black text-white" : "border"}`}
                onClick={() => chooseOverlayChoice(choice.id)}
              >
                {choice.label}
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {prompt ? (
        <section className="rounded border bg-blue-50 p-4">
          <h2 className="text-lg font-semibold">{prompt.title}</h2>
          <p className="mt-1 text-sm">{prompt.message}</p>
          <button
            type="button"
            className="mt-3 rounded bg-black px-4 py-2 text-white"
            onClick={restartRun}
          >
            Restart run
          </button>
        </section>
      ) : null}

      <section className="grid gap-3 rounded border p-4">
        <h2 className="text-lg font-semibold">Persistence and score status</h2>
        {saveStatus ? <p className="text-sm">{saveStatus}</p> : null}
        {scoreStatus ? <p className="text-sm">{scoreStatus}</p> : null}
        {operationError ? (
          <div className="rounded border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
            <p>{operationError}</p>
            <button type="button" className="mt-2 rounded border px-3 py-1" onClick={retryLastOperation}>
              Retry last operation
            </button>
          </div>
        ) : null}
      </section>

      <section className="rounded border p-4">
        <h2 className="text-lg font-semibold">Leaderboard</h2>
        {leaderboard.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-600">No leaderboard data available yet.</p>
        ) : (
          <ol className="mt-2 space-y-2">
            {leaderboard.map((entry) => (
              <li key={`${entry.rank}-${entry.user}`} className="flex justify-between rounded border p-2 text-sm">
                <span>
                  #{entry.rank} {entry.user}
                </span>
                <span>{entry.score}</span>
              </li>
            ))}
          </ol>
        )}
      </section>
    </main>
  );
}
