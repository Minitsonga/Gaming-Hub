'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useParams, useRouter } from 'next/navigation';

import { FeedbackMessage } from '../../../components/feedback-message';

import { useAppPreferences } from '../../../components/app-preferences';

import { GameLeaderboardPanel } from '../../../components/game-leaderboard-panel';

import { RunSummaryOverlay } from '../../../components/run-summary-overlay';

import { SkillsSelectionOverlay } from '../../../components/skills-selection-overlay';
import {
  buildSkillsPanelNotification,
  SkillsSidePanel,
} from '../../../components/skills-side-panel';

import { fetchCatalogGames } from '../../../lib/catalog-client';

import {
  isRoguesurvivalSlug,
  toRoguesurvivalCatalogCard,
} from '../../../lib/roguesurvival-featured';

import { buildLaunchUrl, isLaunchableStatus } from '../../../lib/game-launch';

import {
  focusGameIframe,
  isMessageFromGameFrame,
  parseGameBridgeMessage,
  postToGameIframe,
  waitForUnityBridge,
  type RunEndedPayload,
  type SkillOffer,
} from '../../../lib/game-bridge';

import { getRunPrompt } from '../../../lib/run-prompts';

import { loadRunSave, persistUnitySave, toUnityLoadPayload } from '../../../lib/save-client';

import { submitRunScore } from '../../../lib/leaderboard-client';

import { withRetry } from '../../../lib/retry';

import {
  ownedSkillsToHistory,
  mergeAcquiredSkill,
  registerSkillOffers,
  type RunSkillHistoryEntry,
  type SkillMetaLookup,
} from '../../../lib/run-skill-history';

import { CatalogGame } from '../../../types/catalog';

import { Card, CardContent } from '@/components/ui/card';

import { cn } from '@/lib/utils';

const hubCard = 'border-sky-300/20 bg-slate-950/60 shadow-[0_10px_30px_rgba(0,0,0,0.42)]';

export default function PlayPage() {
  const { t } = useAppPreferences();

  const params = useParams<{ slug: string }>();

  const router = useRouter();

  const slug = params?.slug ?? '';

  const [game, setGame] = useState<CatalogGame | null>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  const [iframeLoaded, setIframeLoaded] = useState(false);

  const [runState, setRunState] = useState<'idle' | 'running' | 'paused' | 'game-over'>('idle');

  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  const postToGameRef = useRef<(message: Record<string, unknown>) => void>(() => {});

  const loadedSaveRef = useRef<Awaited<ReturnType<typeof loadRunSave>>>(null);

  const initialSaveAppliedRef = useRef(false);

  const [pendingRolls, setPendingRolls] = useState(0);

  const [currentXyst, setCurrentXyst] = useState(0);

  const [skillsOffer, setSkillsOffer] = useState<SkillOffer[] | null>(null);

  const [runSummary, setRunSummary] = useState<RunEndedPayload | null>(null);

  const [persistenceError, setPersistenceError] = useState<string | null>(null);
  const [leaderboardRefreshKey, setLeaderboardRefreshKey] = useState(0);
  const [skillsPanelOpen, setSkillsPanelOpen] = useState(false);
  const [runSkillHistory, setRunSkillHistory] = useState<RunSkillHistoryEntry[]>([]);
  const [skillRollHint, setSkillRollHint] = useState<string | null>(null);

  const [isDrawingSkills, setIsDrawingSkills] = useState(false);

  const [isRestarting, setIsRestarting] = useState(false);

  const skillsOfferRef = useRef<SkillOffer[] | null>(null);

  const isDrawingSkillsRef = useRef(false);

  const skillMetaRef = useRef<SkillMetaLookup>(new Map());

  const gameHostBase = process.env.NEXT_PUBLIC_GAME_HOST_URL ?? 'http://localhost:3000/games';

  const launchUrl = useMemo(
    () => (game ? buildLaunchUrl(gameHostBase, game.slug) : ''),
    [game, gameHostBase]
  );

  const launchOrigin = useMemo(() => {
    if (!launchUrl) return null;

    try {
      return new URL(launchUrl).origin;
    } catch {
      return null;
    }
  }, [launchUrl]);

  const sendToGame = useCallback(
    (message: Record<string, unknown>) => {
      postToGameIframe(iframeRef.current, message, launchOrigin ?? '*');
    },
    [launchOrigin]
  );

  const postToGame = useCallback(
    (message: Record<string, unknown>) => {
      if (
        runState === 'game-over' &&
        message.type !== 'RESTART_RUN' &&
        message.type !== 'LOAD_SAVE'
      ) {
        return;
      }
      sendToGame(message);
    },
    [runState, sendToGame]
  );

  postToGameRef.current = postToGame;

  const syncSkillsOffer = useCallback((offer: SkillOffer[] | null) => {
    skillsOfferRef.current = offer;
    setSkillsOffer(offer);
  }, []);

  const requestDrawSkills = useCallback(async () => {
    if (isDrawingSkillsRef.current) return;

    isDrawingSkillsRef.current = true;
    setIsDrawingSkills(true);
    syncSkillsOffer(null);
    setSkillRollHint(null);

    try {
      await waitForUnityBridge(iframeRef.current, { timeoutMs: 10_000 });
      postToGame({ type: 'DRAW_SKILLS', payload: { count: 3 } });
    } catch {
      isDrawingSkillsRef.current = false;
      setIsDrawingSkills(false);
      setSkillRollHint(
        t(
          'Game is still loading. Wait a moment and try again.',
          'Le jeu charge encore. Patiente un instant et réessaie.'
        )
      );
    }
  }, [postToGame, syncSkillsOffer, t]);

  const scheduleDrawIfNeeded = useCallback(
    (count: number) => {
      if (count <= 0) {
        isDrawingSkillsRef.current = false;
        setIsDrawingSkills(false);
        syncSkillsOffer(null);
      }
    },
    [syncSkillsOffer]
  );

  const handleAcquireSkill = useCallback(
    (skillId: string, mythical = false) => {
      const offer = skillsOfferRef.current?.find((skill) => skill.skillId === skillId);
      if (offer) {
        registerSkillOffers(skillMetaRef.current, [offer]);
        setRunSkillHistory((prev) => mergeAcquiredSkill(prev, offer, mythical));
      }

      syncSkillsOffer(null);
      setRunState('running');
      postToGame({
        type: mythical ? 'ACQUIRE_MYTHICAL' : 'ACQUIRE_SKILL',
        payload: { skillId },
      });

      setPendingRolls((prev) => Math.max(0, prev - 1));
      requestAnimationFrame(() => focusGameIframe(iframeRef.current));
    },
    [postToGame, syncSkillsOffer]
  );

  const toggleSkillsPanel = useCallback(() => {
    setSkillsPanelOpen((wasOpen) => {
      if (wasOpen) {
        requestAnimationFrame(() => focusGameIframe(iframeRef.current));
      }
      return !wasOpen;
    });
  }, []);

  const resetHubAfterRestart = useCallback(
    (xyst: number) => {
      setRunSummary(null);
      setRunState('running');
      setPendingRolls(0);
      setCurrentXyst(xyst);
      syncSkillsOffer(null);
      setRunSkillHistory(
        ownedSkillsToHistory(loadedSaveRef.current?.saveData.ownedSkills ?? [], skillMetaRef.current)
      );
      setSkillRollHint(null);
      setPersistenceError(null);
      isDrawingSkillsRef.current = false;
      setIsDrawingSkills(false);
    },
    [syncSkillsOffer]
  );

  const restartRun = useCallback(async () => {
    if (!game || isRestarting || !iframeLoaded) return;

    const saveData = loadedSaveRef.current?.saveData;
    const xyst = saveData?.xyst ?? currentXyst;

    resetHubAfterRestart(xyst);
    setIsRestarting(true);

    try {
      sendToGame({ type: 'RESTART_RUN', payload: {} });

      if (saveData) {
        sendToGame({ type: 'LOAD_SAVE', payload: toUnityLoadPayload(saveData) });
      }

      requestAnimationFrame(() => {
        focusGameIframe(iframeRef.current);
        requestAnimationFrame(() => focusGameIframe(iframeRef.current));
      });
    } catch {
      setSkillRollHint(
        t(
          'Unable to restart the run. Try again in a moment.',
          'Impossible de redémarrer la run. Réessaie dans un instant.'
        )
      );
    } finally {
      setIsRestarting(false);
    }
  }, [
    currentXyst,
    game,
    iframeLoaded,
    isRestarting,
    resetHubAfterRestart,
    sendToGame,
    t,
  ]);

  useEffect(() => {
    const ensureAuth = () => {
      const token = localStorage.getItem('accessToken');

      if (!token) {
        router.replace(`/login?next=${encodeURIComponent(`/play/${slug}`)}`);
      }
    };

    ensureAuth();

    window.addEventListener('gaming-hub-auth', ensureAuth);

    return () => window.removeEventListener('gaming-hub-auth', ensureAuth);
  }, [router, slug]);

  useEffect(() => {
    if (!slug) {
      setLoading(false);

      setError(t('Invalid game slug.', 'Slug de jeu invalide.'));

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

        let selectedGame = games.find((entry) => entry.slug === slug) ?? null;

        if (!selectedGame && isRoguesurvivalSlug(slug)) {
          selectedGame = toRoguesurvivalCatalogCard();
        }

        if (!selectedGame) {
          setError(t('Game not found.', 'Jeu introuvable.'));

          setGame(null);

          return;
        }

        if (!isLaunchableStatus(selectedGame.status)) {
          setError(t('Game is not ready for launch.', "Le jeu n'est pas pret pour le lancement."));

          setGame(selectedGame);

          return;
        }

        setGame(selectedGame);
      } catch {
        if (!cancelled) {
          setError(
            t('Unable to load game metadata.', 'Impossible de charger les metadonnees du jeu.')
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadGame();

    return () => {
      cancelled = true;

      controller.abort();
    };
  }, [slug, t]);

  useEffect(() => {
    if (!game || !iframeLoaded || initialSaveAppliedRef.current) return;

    const gameSlug = game.slug;
    const origin = launchOrigin ?? '*';

    let cancelled = false;

    async function restoreSave() {
      try {
        await waitForUnityBridge(iframeRef.current, { timeoutMs: 15_000 });
        if (cancelled) return;

        const loaded = await loadRunSave(gameSlug);
        loadedSaveRef.current = loaded;
        if (cancelled) return;

        initialSaveAppliedRef.current = true;

        setRunState((s) => (s === 'game-over' ? s : 'running'));

        if (loaded) {
          setCurrentXyst(loaded.saveData.xyst);
          setRunSkillHistory(
            ownedSkillsToHistory(loaded.saveData.ownedSkills, skillMetaRef.current)
          );
          postToGameIframe(
            iframeRef.current,
            { type: 'LOAD_SAVE', payload: toUnityLoadPayload(loaded.saveData) },
            origin
          );
        } else {
          setCurrentXyst(0);
          setRunSkillHistory([]);
        }
      } catch {
        if (!cancelled) {
          initialSaveAppliedRef.current = true;
          setRunState((s) => (s === 'game-over' ? s : 'running'));
        }
      }
    }

    restoreSave();

    return () => {
      cancelled = true;
    };
  }, [game, iframeLoaded, launchOrigin]);

  const handleRunEnded = useCallback(
    async (payload: RunEndedPayload) => {
      if (!game) return;

      setRunState('game-over');
      setRunSummary(payload);
      setCurrentXyst(payload.totalXyst);
      registerSkillOffers(skillMetaRef.current, skillsOfferRef.current ?? []);
      setRunSkillHistory(
        ownedSkillsToHistory(payload.saveData.ownedSkills, skillMetaRef.current)
      );
      syncSkillsOffer(null);
      setPersistenceError(null);

      const token = localStorage.getItem('accessToken');
      if (!token) {
        setPersistenceError(
          t(
            'Sign in to save your run and appear on the leaderboard.',
            'Connecte-toi pour sauvegarder ta run et apparaître au classement.'
          )
        );
        return;
      }

      const prev = loadedSaveRef.current?.saveData;

      try {
        await withRetry(() =>
          persistUnitySave(
            game.slug,
            payload.saveData,
            payload.playtimeMinutes,
            prev
              ? {
                  runsCompleted: prev.runsCompleted,
                  highestWave: prev.highestWave,
                  totalKills: prev.totalKills,
                  playtimeMinutes: loadedSaveRef.current?.playtimeMinutes,
                }
              : undefined,
            { enemiesKilled: payload.enemiesKilled, levelReached: payload.levelReached }
          )
        );

        loadedSaveRef.current = {
          playtimeMinutes: Math.round(payload.playtimeMinutes),
          saveData: {
            ...payload.saveData,
            runsCompleted: (prev?.runsCompleted ?? 0) + 1,
            highestWave: Math.max(prev?.highestWave ?? 0, payload.levelReached),
            totalKills: (prev?.totalKills ?? 0) + payload.enemiesKilled,
          },
        };
      } catch (err) {
        const detail = err instanceof Error ? err.message : '';
        setPersistenceError(
          detail
            ? t(`Save failed: ${detail}`, `Echec de sauvegarde : ${detail}`)
            : t('Save failed after retry.', 'Echec de sauvegarde apres tentative.')
        );
      }

      try {
        await withRetry(() =>
          submitRunScore(game.slug, payload.score, payload.runDuration)
        );
        setLeaderboardRefreshKey((k) => k + 1);
      } catch (err) {
        const detail = err instanceof Error ? err.message : '';
        setPersistenceError(
          (p) =>
            p ??
            (detail
              ? t(`Leaderboard: ${detail}`, `Classement : ${detail}`)
              : t('Leaderboard submission failed.', "Echec d'enregistrement au classement."))
        );
      }
    },
    [game, syncSkillsOffer, t]
  );

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (!isMessageFromGameFrame(event, iframeRef.current?.contentWindow)) return;

      const msg = parseGameBridgeMessage(event.data);
      if (!msg) return;

      switch (msg.type) {
        case 'RUN_STATE_CHANGED': {
          const state = msg.payload.state;
          setRunState(state === 'game-over' ? 'game-over' : 'running');
          break;
        }
        case 'PENDING_ROLLS': {
          setRunState((s) => (s === 'game-over' ? s : 'running'));
          const nextRolls = msg.payload.count;
          setPendingRolls(nextRolls);
          scheduleDrawIfNeeded(nextRolls);
          setSkillRollHint(null);
          break;
        }
        case 'SKILLS_OFFER': {
          isDrawingSkillsRef.current = false;
          setIsDrawingSkills(false);

          if (msg.payload.skills.length === 0) {
            syncSkillsOffer(null);
            setRunState('running');
            setSkillRollHint(
              t(
                'No skill roll available right now.',
                'Aucun tirage de skill disponible pour le moment.'
              )
            );
            break;
          }

          registerSkillOffers(skillMetaRef.current, msg.payload.skills);
          syncSkillsOffer(msg.payload.skills);
          setRunState('paused');
          setSkillRollHint(null);
          break;
        }
        case 'XYST_UPDATED':
          setRunState((s) => (s === 'game-over' ? s : 'running'));
          setCurrentXyst(msg.payload.xyst);
          break;
        case 'RUN_ENDED':
          void handleRunEnded(msg.payload);
          break;
        default:
          break;
      }
    }

    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [handleRunEnded, scheduleDrawIfNeeded, syncSkillsOffer, t]);

  const choosing = skillsOffer !== null && skillsOffer.length > 0;
  const skillsNotification = buildSkillsPanelNotification(
    choosing,
    pendingRolls,
    isDrawingSkills,
    runState
  );

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 px-4 py-6 sm:px-6 sm:py-8">
      <header className="space-y-1">
        <h1 className="space-etched text-2xl font-semibold tracking-tight sm:text-3xl">
          {game?.title ?? t('Game Session', 'Session de jeu')}
        </h1>

        <p className="space-subtitle text-sm text-muted-foreground">
          {game
            ? getRunPrompt(runState)
            : t('Preparing game session...', 'Preparation de la session...')}
        </p>
      </header>

      {loading ? (
        <p role="status" className="text-sm text-muted-foreground">
          {t('Loading...', 'Chargement...')}
        </p>
      ) : null}

      {!loading && error ? <FeedbackMessage variant="error" message={error} /> : null}

      {persistenceError ? <FeedbackMessage variant="error" message={persistenceError} /> : null}

      {!loading && game && !error ? (
        <section className="relative flex flex-col gap-4">
          {!runSummary ? (
            <SkillsSidePanel
              expanded={skillsPanelOpen}
              onToggle={toggleSkillsPanel}
              notification={skillsNotification}
              pendingRolls={pendingRolls}
              currentXyst={currentXyst}
              runState={runState}
              choosing={choosing}
              isDrawingSkills={isDrawingSkills}
              skillHistory={runSkillHistory}
              onRequestDraw={() => void requestDrawSkills()}
              t={t}
            />
          ) : null}

          <Card className={cn(hubCard, 'mx-auto w-full max-w-[1080px] overflow-hidden p-0')}>
            <CardContent className="relative p-0">
              <div className="relative aspect-[3/2] w-full bg-black">
                {!iframeLoaded ? (
                  <p
                    role="status"
                    className="absolute inset-0 z-[1] flex items-center justify-center bg-slate-950/80 text-sm text-muted-foreground"
                  >
                    {t('Loading game client...', 'Chargement du client de jeu...')}
                  </p>
                ) : null}

                <iframe
                  ref={iframeRef}
                  title={`${game.title} ${t('launch frame', 'zone de lancement')}`}
                  src={launchUrl}
                  className="absolute inset-0 h-full w-full border-0"
                  onLoad={() => setIframeLoaded(true)}
                />

                {choosing && skillsOffer ? (
                  <SkillsSelectionOverlay
                    skills={skillsOffer}
                    currentXyst={currentXyst}
                    onAcquire={(skillId) => handleAcquireSkill(skillId)}
                    onAcquireMythical={(skillId) => handleAcquireSkill(skillId, true)}
                    t={t}
                  />
                ) : null}

                {runSummary ? (
                  <RunSummaryOverlay
                    summary={runSummary}
                    isRestarting={isRestarting}
                    onRestart={() => void restartRun()}
                    t={t}
                  />
                ) : null}
              </div>
            </CardContent>
          </Card>

          {skillRollHint ? <FeedbackMessage variant="info" message={skillRollHint} /> : null}

          <GameLeaderboardPanel gameSlug={slug} refreshKey={leaderboardRefreshKey} />
        </section>
      ) : null}
    </main>
  );
}
