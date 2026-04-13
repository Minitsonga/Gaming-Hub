import { CatalogGame } from "../types/catalog";

type GameQueryResponse = {
  data?: {
    game: CatalogGame | null;
  };
  errors?: Array<{ message: string }>;
};

const GAME_QUERY = `
  query Game($id: ID!) {
    game(id: $id) {
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

export async function fetchGameById(id: string, signal?: AbortSignal): Promise<CatalogGame | null> {
  const endpoint = process.env.NEXT_PUBLIC_GRAPHQL_URL ?? "http://localhost:4000/graphql";
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: GAME_QUERY, variables: { id } }),
    signal,
  });

  const payload = (await response.json()) as GameQueryResponse;
  if (!response.ok || payload.errors?.length) {
    throw new Error(payload.errors?.[0]?.message ?? "Unable to load game detail.");
  }

  return payload.data?.game ?? null;
}
