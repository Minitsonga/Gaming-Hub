'use client';

import type { SkillOffer } from '@/lib/game-bridge';
import {
  buildStackCells,
  formatSkillDescriptionHtml,
  rarityToKey,
  shouldShowStackTrack,
} from '@/lib/skill-offer-ui';
import { cn } from '@/lib/utils';

import '@/styles/skill-pixel.css';

type SkillPixelCardProps = {
  skill: SkillOffer;
  currentXyst: number;
  layout?: 'default' | 'dock';
  onAcquire: () => void;
  onAcquireMythical?: () => void;
  t: (en: string, fr: string) => string;
};

export function SkillPixelCard({
  skill,
  currentXyst,
  layout = 'default',
  onAcquire,
  onAcquireMythical,
  t,
}: SkillPixelCardProps) {
  const isDock = layout === 'dock';
  const rarityKey = rarityToKey(skill.rarity);
  const showStacks = shouldShowStackTrack(skill.maxStacks, skill.rarityHistory);
  const stackCells = buildStackCells(
    skill.stacks,
    skill.maxStacks,
    skill.rarityHistory,
    skill.rarity
  );
  const canAffordMythical =
    skill.canBeMythical && currentXyst >= skill.mythicalXystCost;
  const isUnlock = skill.maxStacks <= 1 && skill.stacks === 0 && skill.rarityHistory.length === 0;

  return (
    <article
      className={cn(
        'skill-pixel-card flex flex-col',
        isDock ? 'skill-pixel-card--dock' : 'w-full max-w-[280px] p-[22px]',
        `skill-rarity-${rarityKey}`
      )}
      role="listitem"
    >
      <header className={cn('border-b border-[#333]', isDock ? 'skill-pixel-card__header' : 'mb-3.5 pb-3')}>
        <h3
          className={cn(
            'uppercase leading-tight text-white',
            isDock ? 'skill-pixel-card__title' : 'text-[26px]'
          )}
        >
          {skill.displayName}
        </h3>
        <p className={cn('uppercase text-[#888]', isDock ? 'text-sm' : 'text-base')}>
          [ {skill.category} ]
        </p>
      </header>

      <span className={cn('skill-rarity-tag', `skill-rarity-${rarityKey}`)}>
        {skill.rarity}
      </span>

      <div
        className={cn(
          isDock ? 'skill-pixel-card__desc' : 'mb-auto flex-1 pb-4 text-[19px] leading-relaxed text-[#b0b0b0]'
        )}
        dangerouslySetInnerHTML={{
          __html: formatSkillDescriptionHtml(skill.description, skill.rarity),
        }}
      />

      {showStacks ? (
        <div className={cn('flex justify-center gap-2', isDock ? 'mb-3' : 'mb-4')} aria-hidden>
          {stackCells.map((cell, index) => (
            <div
              key={index}
              className={cn(
                'skill-stack-box',
                `skill-rarity-${cell.rarity}`,
                cell.kind === 'empty' ? '' : 'filled',
                cell.kind === 'current' ? 'current' : ''
              )}
            />
          ))}
        </div>
      ) : null}

      <div className={cn(isDock && 'mt-auto w-full')}>
        <button type="button" className="skill-btn-pixel" onClick={onAcquire}>
          {isUnlock ? t('[ UNLOCK ]', '[ DÉBLOQUER ]') : t('[ SELECT ]', '[ CHOISIR ]')}
        </button>

        {skill.canBeMythical && onAcquireMythical ? (
          <button
            type="button"
            className={cn(
              'skill-btn-pixel mt-2',
              canAffordMythical ? 'affordable' : 'expensive'
            )}
            onClick={onAcquireMythical}
            disabled={!canAffordMythical}
          >
            {t(
              `[ BUY - ${skill.mythicalXystCost} ⟐ ]`,
              `[ ACHETER - ${skill.mythicalXystCost} ⟐ ]`
            )}
          </button>
        ) : null}
      </div>
    </article>
  );
}
