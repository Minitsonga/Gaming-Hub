import Link from "next/link";
import { graphqlRequest } from "@/lib/graphql";

type LeaderboardEntry = {
  rank: number;
  user: string;
  score: number;
};

type LeaderboardQuery = {
  leaderboard: LeaderboardEntry[];
};

const LEADERBOARD_QUERY = `
  query Leaderboard($gameId: ID!) {
    leaderboard(gameId: $gameId) {
      rank
      user
      score
    }
  }
`;

export default async function GameLeaderboardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let leaderboard: LeaderboardEntry[] = [];
  let error: string | null = null;

  try {
    const response = await graphqlRequest<LeaderboardQuery>(LEADERBOARD_QUERY, {
      gameId: id,
    });
    leaderboard = response.leaderboard;
  } catch (requestError: unknown) {
    error = requestError instanceof Error ? requestError.message : "Unable to load leaderboard.";
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl p-6">
      <Link className="underline" href={`/games/${id}`}>
        Back to game
      </Link>
      <h1 className="mt-4 text-3xl font-semibold">Leaderboard</h1>

      {error ? (
        <p className="mt-4 rounded border border-red-300 bg-red-50 p-3 text-red-700">{error}</p>
      ) : null}

      {!error && leaderboard.length === 0 ? (
        <p className="mt-4 rounded border p-4 text-sm">No score has been submitted yet.</p>
      ) : null}

      {!error && leaderboard.length > 0 ? (
        <ol className="mt-4 space-y-2">
          {leaderboard.map((entry) => (
            <li key={`${entry.rank}-${entry.user}`} className="flex justify-between rounded border p-3">
              <span>
                #{entry.rank} {entry.user}
              </span>
              <span>{entry.score}</span>
            </li>
          ))}
        </ol>
      ) : null}
    </main>
  );
}
