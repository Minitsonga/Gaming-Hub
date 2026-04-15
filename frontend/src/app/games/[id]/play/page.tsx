import Link from "next/link";
import { GameSessionClient } from "@/components/game-session-client";
import { graphqlRequest } from "@/lib/graphql";

type Game = {
  id: string;
  title: string;
  slug: string;
};

type GameQuery = {
  game: Game | null;
};

const GAME_QUERY = `
  query Game($id: ID!) {
    game(id: $id) {
      id
      title
      slug
    }
  }
`;

export default async function PlayGamePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let game: Game | null = null;
  try {
    const response = await graphqlRequest<GameQuery>(GAME_QUERY, { id });
    game = response.game;
  } catch {
    game = null;
  }

  if (!game) {
    return (
      <main className="mx-auto min-h-screen w-full max-w-3xl p-6">
        <p className="rounded border border-red-300 bg-red-50 p-3 text-red-700">
          Unable to load game metadata for this session.
        </p>
        <Link className="mt-4 inline-block underline" href="/games">
          Back to catalog
        </Link>
      </main>
    );
  }

  const runtimeHost = process.env.NEXT_PUBLIC_RUNTIME_URL ?? "http://localhost:5173";
  const launchUrl = `${runtimeHost}/?game=${encodeURIComponent(game.slug)}&gameId=${encodeURIComponent(game.id)}`;

  return <GameSessionClient gameId={game.id} gameTitle={game.title} launchUrl={launchUrl} />;
}
