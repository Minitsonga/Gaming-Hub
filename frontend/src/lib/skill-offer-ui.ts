import { MYTHICAL_RARITY } from './game-bridge';

export type SkillRarityKey =
  | 'common'
  | 'uncommon'
  | 'rare'
  | 'epic'
  | 'legendary'
  | 'mythical';

const RARITY_FROM_INT: SkillRarityKey[] = [
  'common',
  'uncommon',
  'rare',
  'epic',
  'legendary',
  'mythical',
];

export function rarityToKey(rarity: string): SkillRarityKey {
  const norm = rarity.trim().toLowerCase();
  if (RARITY_FROM_INT.includes(norm as SkillRarityKey)) return norm as SkillRarityKey;
  return 'common';
}

export function rarityFromHistoryIndex(index: number): SkillRarityKey {
  if (index >= 0 && index < RARITY_FROM_INT.length) return RARITY_FROM_INT[index];
  return 'common';
}

/** Convertit les balises Unity <color> en spans stylés type testSkil.html */
export function formatSkillDescriptionHtml(description: string, rarity: string): string {
  const key = rarityToKey(rarity);
  let html = description.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '');

  html = html.replace(
    /<color=[^>]*>(.*?)<\/color>/gi,
    `<span class="skill-bonus skill-bonus-${key}">$1</span>`
  );
  html = html.replace(/<b>(.*?)<\/b>/gi, '<strong>$1</strong>');
  html = html.replace(
    /\b(PERMANENTLY|PERMANENT|définitivement)\b/gi,
    '<span class="skill-permanent">$1</span>'
  );

  return html;
}

export function shouldShowStackTrack(maxStacks: number, rarityHistory: number[]): boolean {
  return maxStacks > 1 || rarityHistory.length > 0;
}

export function buildStackCells(
  stacks: number,
  maxStacks: number,
  rarityHistory: number[],
  currentRarity: string
): Array<{ kind: 'empty' | 'history' | 'current'; rarity: SkillRarityKey }> {
  const cells: Array<{ kind: 'empty' | 'history' | 'current'; rarity: SkillRarityKey }> = [];
  const currentKey = rarityToKey(currentRarity);

  for (let i = 0; i < maxStacks; i += 1) {
    if (i < rarityHistory.length) {
      cells.push({ kind: 'history', rarity: rarityFromHistoryIndex(rarityHistory[i]) });
    } else if (i === stacks && stacks < maxStacks) {
      cells.push({ kind: 'current', rarity: currentKey });
    } else {
      cells.push({ kind: 'empty', rarity: 'common' });
    }
  }

  return cells;
}

export function isMythicalPermanent(rarityHistory: number[]): boolean {
  return rarityHistory.some((r) => r === MYTHICAL_RARITY);
}
