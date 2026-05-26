/** Contrat postMessage Unity GameBridge ↔ hub (voir docs/BRIDGE_UNITY.md). */

export const MYTHICAL_RARITY = 5;

export type UnityOwnedSkill = {
  skillId: string;

  rarityHistory: number[];
};

export type UnitySavePayload = {
  level: number;

  xp: number;

  xyst: number;

  ownedSkills: UnityOwnedSkill[];

  runsCompleted?: number;

  highestWave?: number;

  totalKills?: number;
};

export type SkillOffer = {
  skillId: string;

  displayName: string;

  description: string;

  category: string;

  rarity: string;

  stacks: number;

  maxStacks: number;

  canBeMythical: boolean;

  mythicalXystCost: number;

  rarityHistory: number[];
};

export type RunEndedPayload = {
  levelReached: number;

  totalXP: number;

  enemiesKilled: number;

  xystEarned: number;

  totalXyst: number;

  runDuration: number;

  playtimeMinutes: number;

  score: number;

  skillsAcquired: string[];

  topRaritySkill: string;

  topStackedSkill: string;

  totalDamageDealt: number;

  totalDamageTaken: number;

  biggestHit: number;

  critsLanded: number;

  saveData: UnitySavePayload;
};

export type GameBridgeMessage =
  | { type: 'RUN_STATE_CHANGED'; payload: { state: 'running' | 'game-over' } }
  | { type: 'PENDING_ROLLS'; payload: { count: number } }
  | { type: 'SKILLS_OFFER'; payload: { skills: SkillOffer[] } }
  | { type: 'XYST_UPDATED'; payload: { xyst: number } }
  | { type: 'RUN_ENDED'; payload: RunEndedPayload };

const BRIDGE_TYPES = new Set([
  'RUN_STATE_CHANGED',

  'PENDING_ROLLS',

  'SKILLS_OFFER',

  'XYST_UPDATED',

  'RUN_ENDED',
]);

const TYPE_ALIASES: Record<string, GameBridgeMessage['type']> = {
  PENDINGROLLS: 'PENDING_ROLLS',
  PENDING_ROLL: 'PENDING_ROLLS',
  LEVEL_UP: 'PENDING_ROLLS',
  LEVELUP: 'PENDING_ROLLS',
  LEVEL_UP_AVAILABLE: 'PENDING_ROLLS',
  XYSTUPDATE: 'XYST_UPDATED',
  XYST_UPDATE: 'XYST_UPDATED',
  XYST: 'XYST_UPDATED',
  RUNSTATECHANGED: 'RUN_STATE_CHANGED',
  RUN_STATE: 'RUN_STATE_CHANGED',
  SKILLSOFFER: 'SKILLS_OFFER',
  SKILL_OFFER: 'SKILLS_OFFER',
  RUNENDED: 'RUN_ENDED',
  RUN_END: 'RUN_ENDED',
};

function normalizeBridgeType(type: string): GameBridgeMessage['type'] | null {
  const upper = type.trim().toUpperCase().replace(/[\s-]+/g, '_');
  if (BRIDGE_TYPES.has(upper)) return upper as GameBridgeMessage['type'];
  return TYPE_ALIASES[upper.replace(/_/g, '')] ?? TYPE_ALIASES[upper] ?? null;
}

function coercePendingRollsPayload(payload: unknown): { count: number } | null {
  if (!payload || typeof payload !== 'object') return null;
  const p = payload as Record<string, unknown>;
  const count = p.count ?? p.pendingRolls ?? p.rolls ?? p.levelUps ?? p.pending;
  if (typeof count === 'number' && Number.isFinite(count)) return { count: Math.max(0, Math.floor(count)) };
  return null;
}

function coerceXystPayload(payload: unknown): { xyst: number } | null {
  if (!payload || typeof payload !== 'object') return null;
  const p = payload as Record<string, unknown>;
  const xyst = p.xyst ?? p.totalXyst ?? p.Xyst ?? p.amount;
  if (typeof xyst === 'number' && Number.isFinite(xyst)) return { xyst: Math.max(0, Math.floor(xyst)) };
  return null;
}

function coerceRunStatePayload(payload: unknown): { state: 'running' | 'game-over' } | null {
  if (!payload || typeof payload !== 'object') return null;
  const p = payload as Record<string, unknown>;
  const state = p.state ?? p.runState;
  if (typeof state !== 'string') return null;
  const norm = state.trim().toLowerCase().replace(/[\s-]+/g, '_');
  if (norm === 'running') return { state: 'running' };
  if (norm === 'game_over' || norm === 'gameover') return { state: 'game-over' };
  return null;
}

function toInt(value: unknown, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : fallback;
}

function coerceOwnedSkill(raw: unknown): UnityOwnedSkill | null {
  if (!raw || typeof raw !== 'object') return null;
  const s = raw as Record<string, unknown>;
  const skillId = typeof s.skillId === 'string' ? s.skillId : typeof s.SkillId === 'string' ? s.SkillId : '';
  if (!skillId) return null;
  const history = s.rarityHistory ?? s.RarityHistory ?? [];
  const rarityHistory = Array.isArray(history)
    ? history.map((r) => toInt(r, 0))
    : [];
  return { skillId, rarityHistory };
}

/** Normalise le blob saveData Unity avant envoi API. */
export function coerceUnitySavePayload(raw: unknown): UnitySavePayload {
  let data: unknown = raw;
  if (typeof data === 'string') {
    try {
      data = JSON.parse(data) as unknown;
    } catch {
      data = {};
    }
  }
  const r = data && typeof data === 'object' ? (data as Record<string, unknown>) : {};
  const skillsRaw = r.ownedSkills ?? r.OwnedSkills ?? [];
  const skills = Array.isArray(skillsRaw) ? skillsRaw : [];

  return {
    level: toInt(r.level, 1),
    xp: toInt(r.xp, 0),
    xyst: toInt(r.xyst, 0),
    ownedSkills: skills
      .map(coerceOwnedSkill)
      .filter((s): s is UnityOwnedSkill => s !== null),
  };
}

function coerceRunEndedPayload(payload: unknown): RunEndedPayload | null {
  if (!payload || typeof payload !== 'object') return null;
  const p = payload as Record<string, unknown>;
  const saveRaw = p.saveData ?? p.SaveData;
  if (saveRaw === undefined) return null;

  return {
    levelReached: toInt(p.levelReached ?? p.LevelReached, 1),
    totalXP: toInt(p.totalXP ?? p.totalXp ?? p.TotalXP, 0),
    enemiesKilled: toInt(p.enemiesKilled ?? p.EnemiesKilled, 0),
    xystEarned: toInt(p.xystEarned ?? p.XystEarned, 0),
    totalXyst: toInt(p.totalXyst ?? p.TotalXyst, 0),
    runDuration: Number(p.runDuration ?? p.RunDuration ?? 0) || 0,
    playtimeMinutes: Number(p.playtimeMinutes ?? p.PlaytimeMinutes ?? 0) || 0,
    score: toInt(p.score ?? p.Score, 0),
    skillsAcquired: Array.isArray(p.skillsAcquired) ? (p.skillsAcquired as string[]) : [],
    topRaritySkill: String(p.topRaritySkill ?? p.TopRaritySkill ?? ''),
    topStackedSkill: String(p.topStackedSkill ?? p.TopStackedSkill ?? ''),
    totalDamageDealt: toInt(p.totalDamageDealt, 0),
    totalDamageTaken: toInt(p.totalDamageTaken, 0),
    biggestHit: toInt(p.biggestHit, 0),
    critsLanded: toInt(p.critsLanded, 0),
    saveData: coerceUnitySavePayload(saveRaw),
  };
}

function normalizeBridgeRecord(obj: Record<string, unknown>): GameBridgeMessage | null {
  if (typeof obj.type !== 'string') return null;

  const type = normalizeBridgeType(obj.type);
  if (!type) return null;

  const payload = obj.payload ?? obj.data ?? obj.body;
  if (payload === undefined && type !== 'RUN_ENDED') return null;

  switch (type) {
    case 'PENDING_ROLLS': {
      const coerced = coercePendingRollsPayload(payload);
      return coerced ? { type, payload: coerced } : null;
    }
    case 'XYST_UPDATED': {
      const coerced = coerceXystPayload(payload);
      return coerced ? { type, payload: coerced } : null;
    }
    case 'RUN_STATE_CHANGED': {
      const coerced = coerceRunStatePayload(payload);
      return coerced ? { type, payload: coerced } : null;
    }
    case 'SKILLS_OFFER': {
      if (!payload || typeof payload !== 'object') return null;
      const p = payload as Record<string, unknown>;
      const skills = p.skills ?? p.Skills ?? p.skillOffers ?? p.offers;
      if (!Array.isArray(skills)) return null;
      return { type, payload: { skills: skills as SkillOffer[] } };
    }
    case 'RUN_ENDED': {
      const coerced = coerceRunEndedPayload(payload);
      return coerced ? { type, payload: coerced } : null;
    }
    default:
      return null;
  }
}

/** Parse le payload Unity (objet ou chaîne JSON, éventuellement enveloppé). */

export function parseGameBridgeMessage(data: unknown): GameBridgeMessage | null {
  let raw: unknown = data;

  if (typeof raw === 'string') {
    try {
      raw = JSON.parse(raw) as unknown;
    } catch {
      return null;
    }
  }

  if (!raw || typeof raw !== 'object') return null;

  const obj = raw as Record<string, unknown>;

  const normalized = normalizeBridgeRecord(obj);
  if (normalized) return normalized;

  if (typeof obj.message === 'string') {
    return parseGameBridgeMessage(obj.message);
  }

  if (typeof obj.message === 'object' && obj.message !== null) {
    return parseGameBridgeMessage(obj.message);
  }

  return null;
}
export function isGameBridgeMessage(data: unknown): data is GameBridgeMessage {
  return parseGameBridgeMessage(data) !== null;
}

export function isMessageFromGameFrame(
  event: MessageEvent,

  iframeWindow: Window | null | undefined
): boolean {
  if (!iframeWindow) return false;

  if (event.source === iframeWindow) return true;

  try {
    return event.origin === window.location.origin;
  } catch {
    return false;
  }
}

export function skillIsPermanent(skill: UnityOwnedSkill): boolean {
  return skill.rarityHistory.some((r) => r === MYTHICAL_RARITY);
}

export function unitySaveToApiSave(
  unity: UnitySavePayload,

  previous?: {
    runsCompleted?: number;

    highestWave?: number;

    totalKills?: number;
  }
) {
  const save = coerceUnitySavePayload(unity);

  return {
    level: save.level,

    xp: save.xp,

    xyst: save.xyst,

    runsCompleted: unity.runsCompleted ?? (previous?.runsCompleted ?? 0) + 1,

    highestWave: Math.max(unity.highestWave ?? 0, previous?.highestWave ?? 0),

    totalKills: (previous?.totalKills ?? 0) + (unity.totalKills ?? 0),

    ownedSkills: save.ownedSkills.map((s) => ({
      skillId: s.skillId,

      rarityHistory: s.rarityHistory.map((r) => toInt(r, 0)),

      isPermanent: skillIsPermanent(s),
    })),
  };
}

export type GamingHubIframeWindow = Window & {
  __gamingHubUnity?: unknown;
  __gamingHubBridge?: (json: string) => void;
  /** Listener Unity (gamebridge.jslib) — utilise le bon GameObject / méthode C#. */
  _gameBridgeListener?: (event: Pick<MessageEvent, 'data' | 'source'>) => void;
  __gamingHubEnqueue?: (data: Record<string, unknown>) => boolean;
  /** Réveille le canvas Unity (focus + unpause) après une action du hub. */
  __gamingHubWakeGame?: () => void;
};

/** Réveille le canvas Unity sans recharger la page ni voler le focus du hub. */
export function focusGameIframe(iframe: HTMLIFrameElement | null): void {
  if (!iframe) return;

  try {
    const win = iframe.contentWindow as GamingHubIframeWindow | null | undefined;
    if (typeof win?.__gamingHubWakeGame === 'function') {
      win.__gamingHubWakeGame();
      return;
    }
    const canvas = iframe.contentDocument?.querySelector('#unity-canvas') as
      | HTMLCanvasElement
      | null
      | undefined;
    canvas?.focus({ preventScroll: true });
  } catch {
    /* cross-origin */
  }
}

/** True si le hub peut envoyer des messages au jeu (même origine ou file d’attente). */
export function isUnityBridgeReady(iframe: HTMLIFrameElement | null): boolean {
  if (!iframe?.contentWindow) return false;
  try {
    const win = iframe.contentWindow as GamingHubIframeWindow & { unityInstance?: unknown };
    if (win.__gamingHubEnqueue || win._gameBridgeListener || win.__gamingHubBridge) return true;
    if (win.__gamingHubUnity || win.unityInstance) return true;
    return false;
  } catch {
    return true;
  }
}

/** Attend que le relais iframe → Unity soit prêt (chargement initial). */
export async function waitForUnityBridge(
  iframe: HTMLIFrameElement | null,
  options?: { timeoutMs?: number; intervalMs?: number }
): Promise<void> {
  const timeoutMs = options?.timeoutMs ?? 60_000;
  const intervalMs = options?.intervalMs ?? 150;
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    if (isUnityBridgeReady(iframe)) return;
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  throw new Error('Unity bridge not ready');
}

export function resolveIframePostTargetOrigin(
  iframe: HTMLIFrameElement | null,
  fallbackOrigin?: string | null
): string {
  try {
    const origin = iframe?.contentWindow?.location.origin;
    if (origin) return origin;
  } catch {
    /* cross-origin */
  }
  if (fallbackOrigin && fallbackOrigin !== '*') return fallbackOrigin;
  return '*';
}

/**
 * Envoie un message au jeu via le listener Unity (_InitMessageListener dans le .jslib).
 * N'utilise pas SendMessage("GameBridge", …) en dur : Unity enregistre le vrai nom d'objet.
 */
export function postToGameIframe(
  iframe: HTMLIFrameElement | null,

  message: Record<string, unknown>,

  targetOrigin: string
) {
  if (typeof message.type !== 'string') return;

  const win = iframe?.contentWindow as GamingHubIframeWindow | null | undefined;
  if (!win) return;

  try {
    if (typeof win.__gamingHubEnqueue === 'function') {
      win.__gamingHubEnqueue(message);
      return;
    }

    if (typeof win.__gamingHubBridge === 'function') {
      win.__gamingHubBridge(JSON.stringify(message));
      return;
    }

    if (typeof win._gameBridgeListener === 'function') {
      win._gameBridgeListener({ data: message, source: window });
      return;
    }
  } catch {
    /* accès cross-origin : repli postMessage ci-dessous */
  }

  const origin = resolveIframePostTargetOrigin(iframe, targetOrigin);
  win.postMessage(message, origin);
}
