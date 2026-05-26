import { MYTHICAL_RARITY, type SkillOffer, type UnityOwnedSkill } from '@/lib/game-bridge';
import { rarityFromHistoryIndex, rarityToKey } from '@/lib/skill-offer-ui';

export type RunSkillHistoryEntry = {
  skillId: string;
  displayName: string;
  category: string;
  description: string;
  stacks: number;
  maxStacks: number;
  rarityHistory: number[];
};

export type SkillMetaLookup = Map<
  string,
  { displayName: string; category: string; description?: string }
>;

const RARITY_INT: Record<string, number> = {
  common: 0,
  uncommon: 1,
  rare: 2,
  epic: 3,
  legendary: 4,
  mythical: 5,
};

export function formatSkillIdAsName(skillId: string): string {
  return skillId
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function registerSkillOffers(meta: SkillMetaLookup, offers: SkillOffer[]): void {
  for (const offer of offers) {
    meta.set(offer.skillId, {
      displayName: offer.displayName,
      category: offer.category,
      description: offer.description,
    });
  }
}

/** Retire les balises Unity pour affichage texte. */
export function stripUnityTags(text: string): string {
  return text
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/<color=[^>]*>/gi, '')
    .replace(/<\/color>/gi, '')
    .replace(/<b>/gi, '')
    .replace(/<\/b>/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Agrège le bonus affiché (ex. +5% × 3 stacks → +15%). */
export function buildSkillTotalBonusSummary(description: string, stackCount: number): string {
  const plain = stripUnityTags(description);
  if (!plain) return '';
  if (stackCount <= 1) return plain;

  const bonusMatch = plain.match(/([+-]\d+(?:\.\d+)?%?)/);
  if (!bonusMatch) return plain;

  const perStack = bonusMatch[1];
  const num = Number.parseFloat(perStack);
  if (Number.isNaN(num)) return plain;

  const suffix = perStack.includes('%') ? '%' : '';
  const total = num * stackCount;
  const totalStr = `${total >= 0 ? '+' : ''}${total}${suffix}`;
  return plain.replace(perStack, totalStr);
}

export function ownedSkillsToHistory(
  owned: UnityOwnedSkill[],
  meta: SkillMetaLookup
): RunSkillHistoryEntry[] {
  return owned.map((skill) => {
    const known = meta.get(skill.skillId);
    const stacks = skill.rarityHistory.length;
    const description = known?.description ?? '';
    return {
      skillId: skill.skillId,
      displayName: known?.displayName ?? formatSkillIdAsName(skill.skillId),
      category: known?.category ?? '—',
      description,
      stacks: Math.max(stacks, 1),
      maxStacks: Math.max(stacks, 1),
      rarityHistory: [...skill.rarityHistory],
    };
  });
}

export function mergeAcquiredSkill(
  history: RunSkillHistoryEntry[],
  offer: SkillOffer,
  mythical: boolean
): RunSkillHistoryEntry[] {
  const rarityInt = mythical ? MYTHICAL_RARITY : (RARITY_INT[rarityToKey(offer.rarity)] ?? 0);
  const existingIndex = history.findIndex((entry) => entry.skillId === offer.skillId);

  if (existingIndex === -1) {
    return [
      ...history,
      {
        skillId: offer.skillId,
        displayName: offer.displayName,
        category: offer.category,
        description: offer.description,
        stacks: 1,
        maxStacks: offer.maxStacks,
        rarityHistory: [rarityInt],
      },
    ];
  }

  return history.map((entry, index) => {
    if (index !== existingIndex) return entry;
    const rarityHistory = [...entry.rarityHistory, rarityInt];
    return {
      ...entry,
      description: offer.description || entry.description,
      stacks: Math.min(entry.maxStacks, rarityHistory.length),
      rarityHistory,
    };
  });
}
