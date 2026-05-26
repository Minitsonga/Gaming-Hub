'use client';

import { VT323 } from 'next/font/google';

import type { SkillOffer } from '@/lib/game-bridge';
import { cn } from '@/lib/utils';

import { SkillPixelCard } from './skill-pixel-card';

import '@/styles/skill-pixel.css';

const vt323 = VT323({
  weight: '400',
  subsets: ['latin'],
});

type SkillsOfferPanelProps = {
  skills: SkillOffer[];
  currentXyst: number;
  onAcquire: (skillId: string) => void;
  onAcquireMythical: (skillId: string) => void;
  t: (en: string, fr: string) => string;
};

export function SkillsOfferPanel({
  skills,
  currentXyst,
  onAcquire,
  onAcquireMythical,
  t,
}: SkillsOfferPanelProps) {
  return (
    <div className={cn('skill-pixel-root', vt323.className)}>
      <p className="skill-selection-title mb-7" role="heading" aria-level={2}>
        {t('═══ SKILL SELECTION ═══', '═══ SÉLECTION DE SKILLS ═══')}
      </p>
      <div
        className="grid grid-cols-1 justify-items-center gap-7 md:grid-cols-2 xl:grid-cols-3"
        role="list"
        aria-label={t('Skill choices', 'Choix de skills')}
      >
        {skills.map((skill) => (
          <SkillPixelCard
            key={skill.skillId}
            skill={skill}
            currentXyst={currentXyst}
            onAcquire={() => onAcquire(skill.skillId)}
            onAcquireMythical={
              skill.canBeMythical ? () => onAcquireMythical(skill.skillId) : undefined
            }
            t={t}
          />
        ))}
      </div>
    </div>
  );
}
