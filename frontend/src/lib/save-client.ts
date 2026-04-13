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

export async function persistRunSave(payload: SavePayload): Promise<void> {
  const endpoint = process.env.NEXT_PUBLIC_GRAPHQL_URL ?? "http://localhost:4000/graphql";
  const accessToken = localStorage.getItem("accessToken");
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: accessToken ? `Bearer ${accessToken}` : "",
    },
    body: JSON.stringify({
      query: UPSERT_SAVE_MUTATION,
      variables: payload,
    }),
  });

  const body = (await response.json()) as { errors?: Array<{ message: string }> };
  if (!response.ok || body.errors?.length) {
    throw new Error(body.errors?.[0]?.message ?? "Unable to save progression.");
  }
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
      }
    }
  }
`;

export async function loadRunSave(gameSlug: string): Promise<Record<string, unknown> | null> {
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
    data?: { mySave?: { saveData?: Record<string, unknown> } | null };
    errors?: Array<{ message: string }>;
  };
  if (!response.ok || body.errors?.length) {
    throw new Error(body.errors?.[0]?.message ?? "Unable to load progression.");
  }

  return body.data?.mySave?.saveData ?? null;
}
