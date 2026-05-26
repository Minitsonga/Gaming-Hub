'use client';

import { SkillsOfferPanel } from '@/components/skills-offer-panel';
import type { SkillOffer } from '@/lib/game-bridge';
import { cn } from '@/lib/utils';

type SkillsSelectionOverlayProps = {
  skills: SkillOffer[];
  currentXyst: number;
  onAcquire: (skillId: string) => void;
  onAcquireMythical: (skillId: string) => void;
  t: (en: string, fr: string) => string;
};

/** Sélection de skills en overlay sur la zone de jeu. */
export function SkillsSelectionOverlay({
  skills,
  currentXyst,
  onAcquire,
  onAcquireMythical,
  t,
}: SkillsSelectionOverlayProps) {
  return (
    <div
      className={cn(
        'absolute inset-0 z-20 flex items-center justify-center',
        'bg-black/72 p-3 backdrop-blur-[2px] sm:p-5'
      )}
      role="dialog"
      aria-modal="true"
      aria-label={t('Skill selection', 'Sélection de skill')}
    >
      <div className="max-h-full w-full max-w-[min(100%,1040px)] overflow-y-auto">
        <SkillsOfferPanel
          skills={skills}
          currentXyst={currentXyst}
          onAcquire={onAcquire}
          onAcquireMythical={onAcquireMythical}
          t={t}
        />
      </div>
    </div>
  );
}
