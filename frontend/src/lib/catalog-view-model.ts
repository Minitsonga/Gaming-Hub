import { CatalogGame } from "../types/catalog";

export function filterAndSortGames(
  games: CatalogGame[],
  search: string,
  sort: "title-asc" | "title-desc"
): CatalogGame[] {
  const normalizedSearch = search.trim().toLowerCase();
  const filtered = normalizedSearch
    ? games.filter((game) => game.title.toLowerCase().includes(normalizedSearch))
    : games;

  return [...filtered].sort((a, b) => {
    const comparison = a.title.localeCompare(b.title);
    return sort === "title-asc" ? comparison : -comparison;
  });
}

export function paginateGames(games: CatalogGame[], currentPage: number, pageSize: number): CatalogGame[] {
  const offset = (currentPage - 1) * pageSize;
  return games.slice(offset, offset + pageSize);
}
