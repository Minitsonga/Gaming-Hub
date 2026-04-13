"use client";

import { useEffect, useState } from "react";
import { CatalogControls } from "../../components/catalog-controls";
import { FeedbackMessage } from "../../components/feedback-message";
import { GameCardGrid } from "../../components/game-card-grid";
import { fetchCatalogGames } from "../../lib/catalog-client";
import { filterAndSortGames, paginateGames } from "../../lib/catalog-view-model";
import { CatalogGame } from "../../types/catalog";

const PAGE_SIZE = 6;

export default function CatalogPage() {
  const [games, setGames] = useState<CatalogGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState<"title-asc" | "title-desc">("title-asc");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const controller = new AbortController();

    async function loadGames() {
      setLoading(true);
      setError(null);
      try {
        const nextGames = await fetchCatalogGames({ status }, controller.signal);
        setGames(nextGames);
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          setError("Unable to load catalog.");
        }
      } finally {
        setLoading(false);
      }
    }

    loadGames();
    return () => controller.abort();
  }, [status]);

  const refinedGames = filterAndSortGames(games, search, sort);
  const pageCount = Math.max(1, Math.ceil(refinedGames.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const visibleGames = paginateGames(refinedGames, currentPage, PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [search, status, sort]);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-4 p-6">
      <h1 className="text-2xl font-semibold">Game Catalog</h1>
      <CatalogControls
        search={search}
        status={status}
        sort={sort}
        onSearchChange={setSearch}
        onStatusChange={setStatus}
        onSortChange={setSort}
      />
      {loading ? <p role="status">Loading catalog...</p> : null}
      {!loading && error ? <FeedbackMessage variant="error" message={error} /> : null}
      {!loading && !error && refinedGames.length === 0 ? (
        <FeedbackMessage variant="info" message="No games available yet." />
      ) : null}
      {!loading && !error && refinedGames.length > 0 ? <GameCardGrid games={visibleGames} /> : null}
      {!loading && !error && refinedGames.length > 0 ? (
        <nav aria-label="Catalog pagination" className="mt-2 flex items-center gap-3">
          <button
            type="button"
            onClick={() => setPage((previous) => Math.max(1, previous - 1))}
            disabled={currentPage <= 1}
            className="rounded border px-3 py-1 disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm">
            Page {currentPage} / {pageCount}
          </span>
          <button
            type="button"
            onClick={() => setPage((previous) => Math.min(pageCount, previous + 1))}
            disabled={currentPage >= pageCount}
            className="rounded border px-3 py-1 disabled:opacity-50"
          >
            Next
          </button>
        </nav>
      ) : null}
    </main>
  );
}
