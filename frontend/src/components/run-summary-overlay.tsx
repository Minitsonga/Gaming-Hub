'use client';

import { Button } from '@/components/ui/button';
import type { RunEndedPayload } from '@/lib/game-bridge';
import { formatRunDuration } from '@/lib/leaderboard-client';
import { cn } from '@/lib/utils';

type RunSummaryOverlayProps = {
  summary: RunEndedPayload;
  isRestarting?: boolean;
  onRestart: () => void;
  onDismiss?: () => void;
  t: (en: string, fr: string) => string;
};

export function RunSummaryOverlay({
  summary,
  isRestarting,
  onRestart,
  onDismiss,
  t,
}: RunSummaryOverlayProps) {
  return (
    <div
      className="absolute inset-0 z-20 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={t('Run summary', 'Résumé de la run')}
    >
      <div
        className={cn(
          'w-full max-w-md rounded-xl border border-sky-300/30',
          'bg-slate-950/95 p-5 shadow-[0_12px_40px_rgba(0,0,0,0.55)]'
        )}
      >
        <h2 className="space-etched text-xl font-semibold">
          {t('Run ended', 'Run terminée')}
        </h2>
        <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
          <p>
            {t('Level', 'Niveau')}: <span className="font-medium text-sky-100">{summary.levelReached}</span>
          </p>
          <p>
            {t('Score', 'Score')}: <span className="font-medium text-sky-100">{summary.score}</span>
          </p>
          <p>
            {t('Kills', 'Tués')}: <span className="font-medium">{summary.enemiesKilled}</span>
          </p>
          <p>
            {t('Duration', 'Durée')}:{' '}
            <span className="font-medium">{formatRunDuration(summary.runDuration)}</span>
          </p>
          <p className="sm:col-span-2">
            {t('Total Xyst', 'Xyst total')}:{' '}
            <span className="font-medium text-sky-100">{summary.totalXyst}</span>
          </p>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <Button
            type="button"
            disabled={isRestarting}
            className="flex-1 border-emerald-300/45 bg-gradient-to-r from-emerald-600/85 via-teal-600/85 to-cyan-600/85 text-white hover:brightness-110"
            onClick={onRestart}
          >
            {isRestarting
              ? t('Restarting...', 'Redémarrage...')
              : t('Restart run', 'Redémarrer la run')}
          </Button>
          {onDismiss ? (
            <Button type="button" variant="outline" className="border-sky-300/35" onClick={onDismiss}>
              {t('Close', 'Fermer')}
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
