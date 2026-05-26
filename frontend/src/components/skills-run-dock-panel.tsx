'use client';

import { VT323 } from 'next/font/google';

import { Button } from '@/components/ui/button';
import type { RunSkillHistoryEntry } from '@/lib/run-skill-history';
import { buildSkillTotalBonusSummary } from '@/lib/run-skill-history';
import { rarityFromHistoryIndex } from '@/lib/skill-offer-ui';
import { cn } from '@/lib/utils';

import '@/styles/skill-pixel.css';

const vt323 = VT323({ weight: '400', subsets: ['latin'] });

type SkillsRunDockPanelProps = {
  pendingRolls: number;
  currentXyst: number;
  runState: string;
  isDrawingSkills: boolean;
  choosing: boolean;
  skillHistory: RunSkillHistoryEntry[];
  onRequestDraw: () => void;
  t: (en: string, fr: string) => string;
};

export function SkillsRunDockPanel({
  pendingRolls,
  currentXyst,
  runState,
  isDrawingSkills,
  choosing,
  skillHistory,
  onRequestDraw,
  t,
}: SkillsRunDockPanelProps) {
  const hasRolls = pendingRolls > 0;
  const isGameOver = runState === 'game-over';
  const isRunActive = runState === 'running' || runState === 'paused' || runState === 'idle';
  const canRequestDraw =
    isRunActive && !isGameOver && hasRolls && !choosing && !isDrawingSkills;

  return (
    <div className={cn('flex flex-col gap-4 font-sans', vt323.className)}>
      <div className="space-y-2 border-b border-sky-300/15 pb-3">
        <p
          className={cn(
            'text-sm font-medium',
            hasRolls ? 'text-sky-200' : 'text-muted-foreground'
          )}
        >
          {choosing
            ? t('Pick a skill on the game overlay', 'Choisis un skill sur le jeu')
            : isDrawingSkills
              ? t('Drawing skills...', 'Tirage des skills en cours...')
              : hasRolls
                ? t(
                    `${pendingRolls} level-up(s) available`,
                    `${pendingRolls} niveau(x) de skill disponible(s)`
                  )
                : t('Level up in-game to unlock skills', 'Monte de niveau en jeu pour débloquer des skills')}
        </p>
        <p className="text-sm text-muted-foreground">
          {t('Xyst', 'Xyst')}: <span className="text-sky-100/90">{currentXyst}</span>
        </p>
        {canRequestDraw ? (
          <Button
            type="button"
            size="sm"
            className="w-full border-sky-300/40 bg-gradient-to-r from-sky-600/80 via-indigo-500/80 to-violet-600/80 text-white hover:brightness-110"
            onClick={onRequestDraw}
          >
            {t('Draw skills', 'Tirer les skills')}
          </Button>
        ) : null}
        {hasRolls && isDrawingSkills ? (
          <p className="text-xs text-muted-foreground">{t('Drawing...', 'Tirage...')}</p>
        ) : null}
      </div>

      <div className="min-h-0 flex-1">
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-sky-200/80">
          {t('Skills this run', 'Skills de la run')}
        </p>
        {skillHistory.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {t('No skills acquired yet.', 'Aucun skill acquis pour le moment.')}
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {skillHistory.map((entry) => (
              <SkillHistoryRow key={entry.skillId} entry={entry} t={t} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function SkillHistoryRow({
  entry,
  t,
}: {
  entry: RunSkillHistoryEntry;
  t: (en: string, fr: string) => string;
}) {
  const stackCount = entry.rarityHistory.length;
  const bonusSummary = entry.description
    ? buildSkillTotalBonusSummary(entry.description, stackCount)
    : '';

  return (
    <li className="rounded-md border border-sky-300/15 bg-slate-900/50 p-2.5">
      <p className="truncate text-sm font-medium text-zinc-100">{entry.displayName}</p>
      <p className="text-[11px] uppercase text-muted-foreground">[ {entry.category} ]</p>

      {bonusSummary ? (
        <p className="mt-1.5 text-xs leading-snug text-[#b0b0b0]">{bonusSummary}</p>
      ) : (
        <p className="mt-1.5 text-xs text-muted-foreground">
          {stackCount > 0
            ? t(`${stackCount} stack(s)`, `${stackCount} stack(s)`)
            : t('No bonus data', 'Bonus non disponible')}
        </p>
      )}

      {stackCount > 0 ? (
        <div className="mt-2 flex justify-start gap-1.5" aria-label={t('Stack history', 'Historique des stacks')}>
          {entry.rarityHistory.map((rarityIndex, index) => (
            <div
              key={index}
              className={cn(
                'skill-stack-box filled',
                `skill-rarity-${rarityFromHistoryIndex(rarityIndex)}`
              )}
            />
          ))}
        </div>
      ) : null}
    </li>
  );
}
