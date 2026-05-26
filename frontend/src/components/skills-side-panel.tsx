'use client';

import type { MouseEvent } from 'react';

import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';

import { SkillsRunDockPanel } from '@/components/skills-run-dock-panel';
import type { RunSkillHistoryEntry } from '@/lib/run-skill-history';
import { cn } from '@/lib/utils';

export type SkillsPanelNotification = {
  active: boolean;
  kind: 'choose' | 'rolls' | 'drawing' | null;
  count: number;
};

export function buildSkillsPanelNotification(
  choosing: boolean,
  pendingRolls: number,
  isDrawingSkills: boolean,
  runState: string
): SkillsPanelNotification {
  if (runState === 'game-over') {
    return { active: false, kind: null, count: 0 };
  }
  if (choosing) {
    return { active: true, kind: 'choose', count: 0 };
  }
  if (isDrawingSkills) {
    return { active: true, kind: 'drawing', count: 0 };
  }
  if (pendingRolls > 0) {
    return { active: true, kind: 'rolls', count: pendingRolls };
  }
  return { active: false, kind: null, count: 0 };
}

type SkillsSidePanelProps = {
  expanded: boolean;
  onToggle: () => void;
  notification: SkillsPanelNotification;
  pendingRolls: number;
  currentXyst: number;
  runState: string;
  isDrawingSkills: boolean;
  choosing: boolean;
  skillHistory: RunSkillHistoryEntry[];
  onRequestDraw: () => void;
  t: (en: string, fr: string) => string;
};

function SkillsNotificationBadge({
  notification,
  t,
}: {
  notification: SkillsPanelNotification;
  t: (en: string, fr: string) => string;
}) {
  if (!notification.active || !notification.kind) return null;

  const label =
    notification.kind === 'choose'
      ? t('Skill choice on game', 'Choix de skill sur le jeu')
      : notification.kind === 'rolls'
        ? t(`${notification.count} level-up(s) available`, `${notification.count} niveau(x) disponible(s)`)
        : t('Drawing skills', 'Tirage en cours');

  return (
    <span
      className={cn(
        'skills-dock-badge absolute -right-1 -top-1 flex items-center justify-center rounded-full',
        'border-2 border-slate-950 font-sans text-[10px] font-bold leading-none text-slate-950',
        'shadow-[0_0_10px_rgba(251,191,36,0.55)]',
        notification.kind === 'choose' && 'size-3.5 bg-amber-400 skills-dock-badge--pulse',
        notification.kind === 'drawing' && 'size-3 bg-sky-400 skills-dock-badge--pulse',
        notification.kind === 'rolls' && 'min-h-4 min-w-4 px-1 bg-sky-400'
      )}
      role="status"
      aria-label={label}
      title={label}
    >
      {notification.kind === 'rolls'
        ? notification.count > 9
          ? '9+'
          : notification.count
        : null}
    </span>
  );
}

/** Languette + panneau latéral (rolls, xyst, historique) — sans sélection de skills. */
export function SkillsSidePanel({
  expanded,
  onToggle,
  notification,
  ...dockProps
}: SkillsSidePanelProps) {
  const handleToggle = (e: MouseEvent) => {
    e.preventDefault();
    onToggle();
  };

  return (
    <div
      className="fixed left-0 top-1/2 z-50 flex -translate-y-1/2 items-center"
      aria-label={dockProps.t('Skills dock', 'Dock skills')}
    >
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={handleToggle}
        aria-expanded={expanded}
        aria-controls="skills-dock-panel"
        className={cn(
          'skills-dock-handle relative z-[1] flex h-28 w-8 shrink-0 flex-col items-center justify-center gap-1.5',
          'rounded-r-md border border-l-0 border-sky-300/30 bg-slate-950/95',
          'text-sky-100/85 shadow-[4px_0_20px_rgba(0,0,0,0.45)]',
          'transition-colors hover:border-sky-300/50 hover:bg-slate-900/98',
          'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400/70'
        )}
        title={
          expanded
            ? dockProps.t('Collapse skills panel', 'Replier le panneau skills')
            : dockProps.t('Expand skills panel', 'Ouvrir le panneau skills')
        }
      >
        <SkillsNotificationBadge notification={notification} t={dockProps.t} />

        {expanded ? (
          <ChevronLeft className="size-4 opacity-70" aria-hidden />
        ) : (
          <ChevronRight className="size-4 opacity-70" aria-hidden />
        )}

        <Sparkles
          className={cn(
            'size-5',
            notification.active && notification.kind === 'choose' && 'text-amber-300',
            notification.active && notification.kind === 'rolls' && 'text-sky-300'
          )}
          aria-hidden
        />

        <span
          className="select-none text-[9px] font-medium uppercase tracking-[0.2em] [writing-mode:vertical-rl] rotate-180"
          aria-hidden
        >
          Skills
        </span>
      </button>

      <aside
        id="skills-dock-panel"
        aria-hidden={!expanded}
        className={cn(
          'overflow-hidden transition-[max-width,margin,opacity] duration-200 ease-out',
          expanded ? 'ml-2 max-w-[320px] opacity-100' : 'ml-0 max-w-0 opacity-0'
        )}
      >
        <div
          className={cn(
            'flex h-[min(80vh,720px)] min-h-0 w-[320px] flex-col',
            'rounded-r-lg border border-sky-300/25 bg-slate-950/98 shadow-[8px_0_32px_rgba(0,0,0,0.55)] backdrop-blur-sm',
            !expanded && 'pointer-events-none'
          )}
        >
          <div className="shrink-0 border-b border-sky-300/15 px-3 py-2.5">
            <p className="font-sans text-sm font-medium text-sky-100/90">
              {dockProps.t('Run info', 'Infos de run')}
            </p>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden p-3">
            <SkillsRunDockPanel {...dockProps} />
          </div>
        </div>
      </aside>
    </div>
  );
}
