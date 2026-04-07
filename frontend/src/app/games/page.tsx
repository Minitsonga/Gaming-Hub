"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { graphqlRequest } from "../../lib/graphql";

type Game = {
  id: string;
  slug: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  technology: string;
  status: string;
  tags: string[];
};

type GamesQuery = {
  games: Game[];
};

const GAMES_QUERY = `
  query Games($status: String, $tag: String) {
    games(status: $status, tag: $tag) {
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

const PAGE_SIZE = 6;

export default function GamesPage() {
  const [games, setGames] = useState<Game[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState<"title" | "technology">("title");
  const [page, setPage] = useState(1);

  useEffect(() => {
    let active = true;
    graphqlRequest<GamesQuery>(GAMES_QUERY)
      .then((data) => {
        if (active) setGames(data.games);
      })
      .catch((err: unknown) => {
        if (active) setError(err instanceof Error ? err.message : "Unable to load games");
      });
    return () => {
      active = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const source = games ?? [];
    const term = search.trim().toLowerCase();

    return source
      .filter((game) => (status === "all" ? true : game.status === status))
      .filter((game) => {
        if (!term) return true;
        const haystack = `${game.title} ${game.description} ${game.tags.join(" ")}`.toLowerCase();
        return haystack.includes(term);
      })
      .sort((a, b) => a[sort].localeCompare(b[sort]));
  }, [games, search, status, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-4 p-6">
      <h1 className="text-3xl font-semibold">Games catalog</h1>

      <div className="grid gap-2 sm:grid-cols-3">
        <input
          className="rounded border px-3 py-2"
          placeholder="Search game"
          value={search}
          onChange={(event) => {
            setPage(1);
            setSearch(event.target.value);
          }}
        />

        <select
          className="rounded border px-3 py-2"
          value={status}
          onChange={(event) => {
            setPage(1);
            setStatus(event.target.value);
          }}
        >
          <option value="all">All statuses</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
        </select>

        <select
          className="rounded border px-3 py-2"
          value={sort}
          onChange={(event) => setSort(event.target.value as "title" | "technology")}
        >
          <option value="title">Sort by title</option>
          <option value="technology">Sort by technology</option>
        </select>
      </div>

      {error ? (
        <p className="rounded border border-red-300 bg-red-50 p-3 text-red-700" role="alert">
          {error}
        </p>
      ) : null}

      {games === null && !error ? <p>Loading games...</p> : null}

      {games !== null && filtered.length === 0 ? (
        <p className="rounded border p-4">No games found for current filters.</p>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {paginated.map((game) => (
          <article key={game.id} className="rounded border p-4">
            <h2 className="text-lg font-semibold">{game.title}</h2>
            <p className="mt-1 text-sm text-zinc-600">{game.technology}</p>
            <p className="mt-2 line-clamp-3 text-sm">{game.description}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {game.tags.map((tag) => (
                <span key={tag} className="rounded bg-zinc-100 px-2 py-1 text-xs">
                  {tag}
                </span>
              ))}
            </div>
            <Link className="mt-4 inline-block underline" href={`/games/${game.id}`}>
              View details
            </Link>
          </article>
        ))}
      </section>

      {filtered.length > PAGE_SIZE ? (
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="rounded border px-3 py-1 disabled:opacity-50"
            disabled={currentPage === 1}
            onClick={() => setPage((value) => value - 1)}
          >
            Previous
          </button>
          <span className="text-sm">
            Page {currentPage} / {totalPages}
          </span>
          <button
            type="button"
            className="rounded border px-3 py-1 disabled:opacity-50"
            disabled={currentPage === totalPages}
            onClick={() => setPage((value) => value + 1)}
          >
            Next
          </button>
        </div>
      ) : null}
    </main>
  );
}
