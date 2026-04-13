export type LeaderboardEntry = {
  userId: string;
  gameSlug: string;
  value: number;
  metric: string;
};

const SUBMIT_SCORE_MUTATION = `
  mutation SubmitScore($input: UpsertPlayerMetricInput!) {
    upsertPlayerMetric(input: $input) {
      id
    }
  }
`;

const GAME_LEADERBOARD_QUERY = `
  query GameLeaderboard($gameSlug: String!, $metric: String, $limit: Int) {
    gameLeaderboard(gameSlug: $gameSlug, metric: $metric, limit: $limit) {
      userId
      gameSlug
      value
      metric
    }
  }
`;

function authHeaders() {
  const accessToken = localStorage.getItem("accessToken");
  return {
    "Content-Type": "application/json",
    Authorization: accessToken ? `Bearer ${accessToken}` : "",
  };
}

export async function submitScore(gameSlug: string, value: number): Promise<void> {
  const endpoint = process.env.NEXT_PUBLIC_GRAPHQL_URL ?? "http://localhost:4000/graphql";
  const user = JSON.parse(localStorage.getItem("user") ?? "{}") as { id?: string };
  const response = await fetch(endpoint, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      query: SUBMIT_SCORE_MUTATION,
      variables: {
        input: {
          userId: user.id ?? "",
          gameSlug,
          metric: "score",
          value,
        },
      },
    }),
  });

  const payload = (await response.json()) as { errors?: Array<{ message: string }> };
  if (!response.ok || payload.errors?.length) {
    throw new Error(payload.errors?.[0]?.message ?? "Unable to submit score.");
  }
}

export async function fetchLeaderboard(gameSlug: string): Promise<LeaderboardEntry[]> {
  const endpoint = process.env.NEXT_PUBLIC_GRAPHQL_URL ?? "http://localhost:4000/graphql";
  const response = await fetch(endpoint, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      query: GAME_LEADERBOARD_QUERY,
      variables: { gameSlug, metric: "score", limit: 10 },
    }),
  });
  const payload = (await response.json()) as {
    data?: { gameLeaderboard?: LeaderboardEntry[] };
    errors?: Array<{ message: string }>;
  };
  if (!response.ok || payload.errors?.length) {
    throw new Error(payload.errors?.[0]?.message ?? "Unable to fetch leaderboard.");
  }
  return payload.data?.gameLeaderboard ?? [];
}
