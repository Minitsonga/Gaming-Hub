import { unitySaveToApiSave, type UnitySavePayload } from "./game-bridge";

type SavePayload = {
  gameSlug: string;
  saveData: {
    level: number;
    xp: number;
    xyst: number;
    runsCompleted: number;
    highestWave: number;
    totalKills: number;
    ownedSkills: Array<{ skillId: string; rarityHistory: number[]; isPermanent: boolean }>;
  };
  playtimeMinutes: number;
};

const UPSERT_SAVE_MUTATION = `
  mutation UpsertSave($gameSlug: String!, $saveData: SaveDataInput!, $playtimeMinutes: Int) {
    upsertSave(gameSlug: $gameSlug, saveData: $saveData, playtimeMinutes: $playtimeMinutes) {
      id
      gameSlug
    }
  }
`;

function formatGraphQLErrors(errors?: Array<{ message: string }>): string {
  if (!errors?.length) return "Unable to save progression.";
  return errors.map((e) => e.message).join(" — ");
}

export async function persistRunSave(payload: SavePayload): Promise<void> {
  const endpoint = process.env.NEXT_PUBLIC_GRAPHQL_URL ?? "http://localhost:4000/graphql";
  const accessToken = localStorage.getItem("accessToken");
  if (!accessToken) {
    throw new Error("Authentication required");
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      query: UPSERT_SAVE_MUTATION,
      variables: payload,
    }),
  });

  const body = (await response.json()) as {
    errors?: Array<{ message: string }>;
    data?: { upsertSave?: { id?: string } | null };
  };
  if (!response.ok || body.errors?.length) {
    throw new Error(formatGraphQLErrors(body.errors));
  }
  if (!body.data?.upsertSave?.id) {
    throw new Error("Save mutation returned no data.");
  }
}

export async function persistUnitySave(
  gameSlug: string,
  unitySave: UnitySavePayload,
  playtimeMinutes: number,
  previous?: {
    runsCompleted?: number;
    highestWave?: number;
    totalKills?: number;
    playtimeMinutes?: number;
  },
  runStats?: { enemiesKilled?: number; levelReached?: number }
): Promise<void> {
  const base = unitySaveToApiSave(unitySave, previous);
  const saveData = {
    ...base,
    runsCompleted: (previous?.runsCompleted ?? 0) + 1,
    totalKills: (previous?.totalKills ?? 0) + (runStats?.enemiesKilled ?? 0),
    highestWave: Math.max(
      previous?.highestWave ?? 0,
      runStats?.levelReached ?? base.level
    ),
  };
  const runMinutes = Math.max(1, Math.ceil(playtimeMinutes));
  const cumulativePlaytime = (previous?.playtimeMinutes ?? 0) + runMinutes;

  await persistRunSave({
    gameSlug,
    saveData,
    playtimeMinutes: cumulativePlaytime,
  });
}

const LOAD_SAVE_QUERY = `
  query LoadSave($gameSlug: String!) {
    mySave(gameSlug: $gameSlug) {
      saveData {
        level
        xp
        xyst
        runsCompleted
        highestWave
        totalKills
        ownedSkills {
          skillId
          rarityHistory
          isPermanent
        }
      }
      playtimeMinutes
    }
  }
`;

export type LoadedSave = {
  saveData: UnitySavePayload & {
    runsCompleted: number;
    highestWave: number;
    totalKills: number;
  };
  playtimeMinutes: number;
};

export async function loadRunSave(gameSlug: string): Promise<LoadedSave | null> {
  const endpoint = process.env.NEXT_PUBLIC_GRAPHQL_URL ?? "http://localhost:4000/graphql";
  const accessToken = localStorage.getItem("accessToken");
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: accessToken ? `Bearer ${accessToken}` : "",
    },
    body: JSON.stringify({
      query: LOAD_SAVE_QUERY,
      variables: { gameSlug },
    }),
  });

  const body = (await response.json()) as {
    data?: {
      mySave?: {
        saveData?: {
          level: number;
          xp: number;
          xyst: number;
          runsCompleted: number;
          highestWave: number;
          totalKills: number;
          ownedSkills?: Array<{
            skillId: string;
            rarityHistory: number[];
            isPermanent?: boolean;
          }>;
        };
        playtimeMinutes?: number;
      } | null;
    };
    errors?: Array<{ message: string }>;
  };
  if (!response.ok || body.errors?.length) {
    throw new Error(body.errors?.[0]?.message ?? "Unable to load progression.");
  }

  const row = body.data?.mySave;
  if (!row?.saveData) return null;

  const sd = row.saveData;
  return {
    playtimeMinutes: row.playtimeMinutes ?? 0,
    saveData: {
      level: sd.level,
      xp: sd.xp,
      xyst: sd.xyst,
      runsCompleted: sd.runsCompleted,
      highestWave: sd.highestWave,
      totalKills: sd.totalKills,
      ownedSkills: (sd.ownedSkills ?? []).map((s) => ({
        skillId: s.skillId,
        rarityHistory: s.rarityHistory,
      })),
    },
  };
}

/** Payload envoyé à Unity via LOAD_SAVE (sans champs hub-only). */
export function toUnityLoadPayload(save: LoadedSave["saveData"]): UnitySavePayload {
  return {
    level: save.level,
    xp: save.xp,
    xyst: save.xyst,
    ownedSkills: save.ownedSkills,
  };
}
