'use client';

import { useCallback, useEffect, useState } from 'react';

import { useAppPreferences } from '@/components/app-preferences';
import { FeedbackMessage } from '@/components/feedback-message';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  fetchRunLeaderboard,
  formatRunDuration,
  LEADERBOARD_REFRESH_MS,
  LEADERBOARD_TOP_N,
  type GameRunLeaderboardPayload,
  type LeaderboardSortBy,
  type RunLeaderboardEntry,
} from '@/lib/leaderboard-client';
import { cn } from '@/lib/utils';

type GameLeaderboardPanelProps = {
  gameSlug: string;
  refreshKey?: number;
};

function LeaderboardRow({
  entry,
  sortBy,
  t,
}: {
  entry: RunLeaderboardEntry;
  sortBy: LeaderboardSortBy;
  t: (en: string, fr: string) => string;
}) {
  const highlight = entry.isViewer;

  return (
    <li
      className={cn(
        'flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-sm transition-colors',
        highlight
          ? 'border-emerald-400/70 bg-emerald-500/15 shadow-[0_0_16px_rgba(52,211,153,0.25)]'
          : 'border-sky-300/15 bg-slate-900/45'
      )}
    >
      <div className="min-w-0 flex-1">
        <p className={cn('truncate font-medium', highlight ? 'text-emerald-100' : 'text-sky-100/90')}>
          <span className="text-muted-foreground">#{entry.rank}</span> {entry.playerName}
          {highlight ? (
            <span className="ml-2 text-xs text-emerald-300/90">({t('You', 'Toi')})</span>
          ) : null}
        </p>
        <p className="text-xs text-muted-foreground">
          {sortBy === 'SCORE'
            ? `${t('Time', 'Temps')}: ${formatRunDuration(entry.runDurationSeconds)}`
            : `${t('Score', 'Score')}: ${entry.score}`}
        </p>
      </div>
      <p
        className={cn(
          'shrink-0 text-lg font-semibold tabular-nums',
          highlight ? 'text-emerald-200' : 'text-zinc-100'
        )}
      >
        {sortBy === 'SCORE' ? entry.score : formatRunDuration(entry.runDurationSeconds)}
      </p>
    </li>
  );
}

export function GameLeaderboardPanel({ gameSlug, refreshKey = 0 }: GameLeaderboardPanelProps) {
  const { t } = useAppPreferences();
  const [sortBy, setSortBy] = useState<LeaderboardSortBy>('SCORE');
  const [data, setData] = useState<GameRunLeaderboardPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!gameSlug) return;
    setLoading(true);
    setError(null);
    try {
      setData(await fetchRunLeaderboard(gameSlug, sortBy, LEADERBOARD_TOP_N));
    } catch {
      setError(t('Unable to load leaderboard.', 'Impossible de charger le classement.'));
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [gameSlug, sortBy, t]);

  useEffect(() => {
    void load();
  }, [load, refreshKey]);

  useEffect(() => {
    if (!gameSlug) return;
    const id = window.setInterval(() => void load(), LEADERBOARD_REFRESH_MS);
    return () => window.clearInterval(id);
  }, [gameSlug, load]);

  const tabClass = (active: boolean) =>
    cn(
      'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
      active
        ? 'bg-sky-500/25 text-sky-100'
        : 'text-muted-foreground hover:bg-slate-800/80 hover:text-foreground'
    );

  return (
    <Card className="border-sky-300/20 bg-slate-950/75 shadow-[0_8px_28px_rgba(0,0,0,0.35)]">
      <CardHeader className="gap-3 border-b border-sky-300/15 pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="space-etched text-lg font-sans">
            {t('Leaderboard', 'Classement')}
          </CardTitle>
          <div className="flex gap-1 rounded-lg border border-sky-300/20 bg-slate-900/60 p-1">
            <button type="button" className={tabClass(sortBy === 'SCORE')} onClick={() => setSortBy('SCORE')}>
              {t('By score', 'Par score')}
            </button>
            <button type="button" className={tabClass(sortBy === 'TIME')} onClick={() => setSortBy('TIME')}>
              {t('By time', 'Par temps')}
            </button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          {t(
            `Top ${LEADERBOARD_TOP_N} — updates every minute`,
            `Top ${LEADERBOARD_TOP_N} — mis à jour chaque minute`
          )}
        </p>
      </CardHeader>
      <CardContent className="pt-3">
        {loading ? (
          <p role="status" className="text-sm text-muted-foreground">
            {t('Loading...', 'Chargement...')}
          </p>
        ) : null}
        {!loading && error ? <FeedbackMessage variant="error" message={error} /> : null}
        {!loading && !error && data?.top.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {t('No runs recorded yet.', 'Aucune run enregistrée.')}
          </p>
        ) : null}
        {!loading && !error && data && data.top.length > 0 ? (
          <ol className="flex max-h-[280px] flex-col gap-2 overflow-y-auto pr-1">
            {data.top.map((entry) => (
              <LeaderboardRow key={entry.id} entry={entry} sortBy={sortBy} t={t} />
            ))}
          </ol>
        ) : null}
        {!loading && !error && data?.viewer ? (
          <div className="mt-3 border-t border-sky-300/15 pt-3">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {t('Your ranking', 'Ton classement')}
            </p>
            <LeaderboardRow entry={data.viewer} sortBy={sortBy} t={t} />
          </div>
        ) : null}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-3 w-full border-sky-300/35 hover:bg-sky-500/10"
          onClick={() => void load()}
          disabled={loading}
        >
          {t('Refresh now', 'Actualiser')}
        </Button>
      </CardContent>
    </Card>
  );
}
