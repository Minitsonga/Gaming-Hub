export type LeaderboardSortBy = 'SCORE' | 'TIME';

export type RunLeaderboardEntry = {
  id: string;
  userId: string;
  playerName: string;
  gameSlug: string;
  score: number;
  runDurationSeconds: number;
  rank: number;
  isViewer: boolean;
};

export type GameRunLeaderboardPayload = {
  sortBy: LeaderboardSortBy;
  top: RunLeaderboardEntry[];
  viewer: RunLeaderboardEntry | null;
  totalPlayers: number;
};

export type MyGameRecord = {
  gameSlug: string;
  playerName: string;
  bestScore: number;
  bestScoreDuration: number;
  bestTimeDuration: number;
  bestTimeScore: number;
  rankScore: number | null;
  rankTime: number | null;
};

export const LEADERBOARD_TOP_N = 10;
export const LEADERBOARD_REFRESH_MS = 60_000;

const RECORD_RUN_SCORE_MUTATION = `
  mutation RecordRunScore($input: RecordRunScoreInput!) {
    recordRunScore(input: $input) {
      scoreImproved
      timeImproved
      personalBestImproved
      ranks {
        score
        time
      }
      run {
        id
        playerName
        score
        runDurationSeconds
        rank
      }
    }
  }
`;

const GAME_RUN_LEADERBOARD_QUERY = `
  query GameRunLeaderboard($gameSlug: String!, $sortBy: LeaderboardSortBy!, $limit: Int) {
    gameRunLeaderboard(gameSlug: $gameSlug, sortBy: $sortBy, limit: $limit) {
      sortBy
      totalPlayers
      top {
        id
        userId
        playerName
        score
        runDurationSeconds
        rank
        isViewer
      }
      viewer {
        id
        userId
        playerName
        score
        runDurationSeconds
        rank
        isViewer
      }
    }
  }
`;

const MY_GAME_RECORDS_QUERY = `
  query MyGameRecords {
    myGameRecords {
      gameSlug
      playerName
      bestScore
      bestScoreDuration
      bestTimeDuration
      bestTimeScore
      rankScore
      rankTime
    }
  }
`;

function getGraphqlEndpoint(): string {
  return process.env.NEXT_PUBLIC_GRAPHQL_URL ?? 'http://localhost:4000/graphql';
}

function authHeaders(): HeadersInit {
  const accessToken = localStorage.getItem('accessToken');
  return {
    'Content-Type': 'application/json',
    Authorization: accessToken ? `Bearer ${accessToken}` : '',
  };
}

export function getPlayerDisplayName(): string {
  try {
    const user = JSON.parse(localStorage.getItem('user') ?? '{}') as {
      username?: string;
      email?: string;
    };
    const name = user.username?.trim() || user.email?.trim();
    return name || 'Joueur';
  } catch {
    return 'Joueur';
  }
}

export function getStoredUserId(): string {
  try {
    const user = JSON.parse(localStorage.getItem('user') ?? '{}') as {
      id?: string;
      _id?: string;
      userId?: string;
    };
    return user.id ?? user._id ?? user.userId ?? '';
  } catch {
    return '';
  }
}

export function formatRunDuration(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  if (mins > 0) {
    return `${mins}m ${secs.toString().padStart(2, '0')}s`;
  }
  return `${secs}s`;
}

export async function submitRunScore(
  gameSlug: string,
  score: number,
  runDurationSeconds: number
): Promise<void> {
  const accessToken = localStorage.getItem('accessToken');
  if (!accessToken) {
    throw new Error('Authentication required');
  }

  const response = await fetch(getGraphqlEndpoint(), {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({
      query: RECORD_RUN_SCORE_MUTATION,
      variables: {
        input: {
          gameSlug,
          playerName: getPlayerDisplayName(),
          score: Math.max(0, Math.floor(score)),
          runDurationSeconds: Math.max(0, Number(runDurationSeconds) || 0),
        },
      },
    }),
  });

  const payload = (await response.json()) as { errors?: Array<{ message: string }> };
  if (!response.ok || payload.errors?.length) {
    throw new Error(payload.errors?.[0]?.message ?? 'Unable to submit run score.');
  }
}

export async function fetchRunLeaderboard(
  gameSlug: string,
  sortBy: LeaderboardSortBy = 'SCORE',
  limit = LEADERBOARD_TOP_N
): Promise<GameRunLeaderboardPayload> {
  const response = await fetch(getGraphqlEndpoint(), {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({
      query: GAME_RUN_LEADERBOARD_QUERY,
      variables: { gameSlug, sortBy, limit },
    }),
  });

  const payload = (await response.json()) as {
    data?: { gameRunLeaderboard?: GameRunLeaderboardPayload };
    errors?: Array<{ message: string }>;
  };

  if (!response.ok || payload.errors?.length) {
    throw new Error(payload.errors?.[0]?.message ?? 'Unable to fetch leaderboard.');
  }

  return (
    payload.data?.gameRunLeaderboard ?? {
      sortBy,
      top: [],
      viewer: null,
      totalPlayers: 0,
    }
  );
}

export async function fetchMyGameRecords(): Promise<MyGameRecord[]> {
  const accessToken = localStorage.getItem('accessToken');
  if (!accessToken) return [];

  const response = await fetch(getGraphqlEndpoint(), {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ query: MY_GAME_RECORDS_QUERY }),
  });

  const payload = (await response.json()) as {
    data?: { myGameRecords?: MyGameRecord[] };
    errors?: Array<{ message: string }>;
  };

  if (!response.ok || payload.errors?.length) {
    return [];
  }

  return payload.data?.myGameRecords ?? [];
}
