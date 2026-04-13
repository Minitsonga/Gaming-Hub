"use client";

import Link from "next/link";
import Image from "next/image";
import { CatalogGame } from "../types/catalog";

type GameCardGridProps = {
  games: CatalogGame[];
};

export function getCatalogStateLabel(gamesCount: number): string {
  if (gamesCount === 0) return "No games available.";
  if (gamesCount === 1) return "1 game available.";
  return `${gamesCount} games available.`;
}

export function GameCardGrid({ games }: GameCardGridProps) {
  return (
    <section aria-label="Catalog results" className="flex flex-col gap-4">
      <p className="text-sm text-zinc-600 dark:text-zinc-300">{getCatalogStateLabel(games.length)}</p>
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {games.map((game) => (
          <li key={game.id} className="rounded-lg border bg-white p-4 dark:bg-zinc-900">
            <Image
              src={game.thumbnailUrl}
              alt={`${game.title} thumbnail`}
              className="mb-3 h-36 w-full rounded object-cover"
              width={480}
              height={240}
            />
            <h2 className="text-lg font-semibold">{game.title}</h2>
            <p className="mt-1 line-clamp-3 text-sm text-zinc-600 dark:text-zinc-300">{game.description}</p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <span className="rounded border px-2 py-1">{game.technology}</span>
              <span className="rounded border px-2 py-1">{game.status}</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              {game.tags.map((tag) => (
                <span key={`${game.id}-${tag}`} className="rounded bg-zinc-100 px-2 py-1 dark:bg-zinc-800">
                  #{tag}
                </span>
              ))}
            </div>
            <Link className="mt-4 inline-block underline" href={`/games/${game.id}`}>
              View details
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
