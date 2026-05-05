import { CatalogGame } from "../types/catalog";

export type CatalogSortBy =
  | "relevant"
  | "alphabetical"
  | "creation-age"
  | "favorite-count"
  | "playtime"
  | "rating"
  | "update-time";

export type CatalogSortOrder = "asc" | "desc";

function metricSeed(game: CatalogGame): number {
  return Array.from(`${game.id}:${game.slug}`).reduce((acc, char) => acc + char.charCodeAt(0), 0);
}

export function filterAndSortGames(
  games: CatalogGame[],
  search: string,
  sortBy: CatalogSortBy,
  order: CatalogSortOrder
): CatalogGame[] {
  const normalizedSearch = search.trim().toLowerCase();
  const filtered = normalizedSearch
    ? games.filter((game) =>
        [game.title, game.description, ...game.tags].join(" ").toLowerCase().includes(normalizedSearch)
      )
    : games;

  return [...filtered].sort((a, b) => {
    let comparison = 0;
    if (sortBy === "alphabetical") {
      comparison = a.title.localeCompare(b.title);
    } else if (sortBy === "relevant") {
      const aScore = Number(a.title.toLowerCase().includes(normalizedSearch)) * 2 + Number(a.description.toLowerCase().includes(normalizedSearch));
      const bScore = Number(b.title.toLowerCase().includes(normalizedSearch)) * 2 + Number(b.description.toLowerCase().includes(normalizedSearch));
      comparison = bScore - aScore;
    } else if (sortBy === "creation-age" || sortBy === "update-time") {
      comparison = metricSeed(a) - metricSeed(b);
    } else if (sortBy === "favorite-count") {
      comparison = (metricSeed(a) % 5000) - (metricSeed(b) % 5000);
    } else if (sortBy === "playtime") {
      comparison = (metricSeed(a) % 3000) - (metricSeed(b) % 3000);
    } else if (sortBy === "rating") {
      comparison = (metricSeed(a) % 50) - (metricSeed(b) % 50);
    }
    return order === "asc" ? comparison : -comparison;
  });
}

export function paginateGames(games: CatalogGame[], currentPage: number, pageSize: number): CatalogGame[] {
  const offset = (currentPage - 1) * pageSize;
  return games.slice(offset, offset + pageSize);
}
