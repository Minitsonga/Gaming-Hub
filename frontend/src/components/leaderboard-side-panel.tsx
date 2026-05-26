'use client';

import { useCallback, useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useAppPreferences } from './app-preferences';
import { FeedbackMessage } from './feedback-message';
import {
  fetchRunLeaderboard,
  formatRunDuration,
  LEADERBOARD_TOP_N,
  type RunLeaderboardEntry,
} from '@/lib/leaderboard-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type LeaderboardSidePanelProps = {
  gameSlug: string;
  open: boolean;
  onClose: () => void;
  refreshKey?: number;
};

export function LeaderboardSidePanel({
  gameSlug,
  open,
  onClose,
  refreshKey = 0,
}: LeaderboardSidePanelProps) {
  const { t } = useAppPreferences();
  const [entries, setEntries] = useState<RunLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!gameSlug) return;
    setLoading(true);
    setError(null);
    try {
      setEntries(await fetchRunLeaderboard(gameSlug));
    } catch {
      setError(t('Unable to load leaderboard.', 'Impossible de charger le classement.'));
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [gameSlug, t]);

  useEffect(() => {
    if (open) void load();
  }, [open, load, refreshKey]);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[1px] lg:bg-black/25"
        aria-label={t('Close leaderboard', 'Fermer le classement')}
        onClick={onClose}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={t('Leaderboard', 'Classement')}
        className={cn(
          'fixed right-0 top-14 z-50 flex h-[calc(100vh-3.5rem)] w-full max-w-sm flex-col',
          'border-l border-sky-300/25 bg-slate-950/95 shadow-[-12px_0_40px_rgba(0,0,0,0.55)] backdrop-blur-md'
        )}
      >
        <Card className="flex h-full flex-col rounded-none border-0 bg-transparent shadow-none">
          <CardHeader className="flex flex-row items-start justify-between gap-2 border-b border-sky-300/15 pb-4">
            <div>
              <CardTitle className="space-etched text-lg">
                {t('Leaderboard', 'Classement')}
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                {t(
                  `Top ${LEADERBOARD_TOP_N} — score, then fastest time (one best run per player)`,
                  `Top ${LEADERBOARD_TOP_N} — score, puis temps le plus rapide (une meilleure run par joueur)`
                )}
              </p>
            </div>
            <Button
              type="button"
              size="icon-sm"
              variant="ghost"
              className="shrink-0 text-muted-foreground hover:text-foreground"
              onClick={onClose}
              aria-label={t('Close', 'Fermer')}
            >
              <X className="size-4" />
            </Button>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto pt-4">
            {loading ? (
              <p role="status" className="text-sm text-muted-foreground">
                {t('Loading leaderboard...', 'Chargement du classement...')}
              </p>
            ) : null}
            {!loading && error ? <FeedbackMessage variant="error" message={error} /> : null}
            {!loading && !error && entries.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {t('No runs recorded yet.', 'Aucune run enregistrée pour le moment.')}
              </p>
            ) : null}
            {!loading && !error && entries.length > 0 ? (
              <ol className="flex flex-col gap-3 text-sm">
                {entries.map((entry, index) => (
                  <li
                    key={entry.id}
                    className="rounded-lg border border-sky-300/15 bg-slate-900/40 px-3 py-2"
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="font-medium text-sky-100/90">
                        {index + 1}. {entry.playerName}
                      </span>
                      <span className="shrink-0 font-semibold text-zinc-100">{entry.score}</span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {t('Time', 'Temps')}: {formatRunDuration(entry.runDurationSeconds)}
                    </p>
                  </li>
                ))}
              </ol>
            ) : null}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-4 w-full border-sky-300/35 hover:bg-sky-500/10"
              onClick={() => void load()}
              disabled={loading}
            >
              {t('Refresh', 'Actualiser')}
            </Button>
          </CardContent>
        </Card>
      </aside>
    </>
  );
}
