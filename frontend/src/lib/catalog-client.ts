import { CatalogGame } from "../types/catalog";

type GamesQueryResponse = {
  data?: {
    games: CatalogGame[];
  };
  errors?: Array<{ message: string }>;
};

const GAMES_QUERY = `
  query Games {
    games {
      id
      slug
      title
      description
      thumbnailUrl
      technology
      status
      tags
    }
  }
`;

export async function fetchCatalogGames(signal?: AbortSignal): Promise<CatalogGame[]> {
  const endpoint = process.env.NEXT_PUBLIC_GRAPHQL_URL ?? "http://localhost:4000/graphql";
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: GAMES_QUERY }),
    signal,
  });

  const payload = (await response.json()) as GamesQueryResponse;
  if (!response.ok || payload.errors?.length) {
    throw new Error(payload.errors?.[0]?.message ?? "Unable to load catalog.");
  }

  return payload.data?.games ?? [];
}
