"use client";

import Image from "next/image";
import Link from "next/link";
import { CatalogGame } from "../types/catalog";

export function canLaunchGame(status: string): boolean {
  return status.toLowerCase() === "published";
}

export function GameDetailView({ game }: { game: CatalogGame }) {
  const launchReady = canLaunchGame(game.status);

  return (
    <article className="rounded-lg border bg-white p-4 dark:bg-zinc-900">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Image
          src={game.thumbnailUrl}
          alt={`${game.title} thumbnail`}
          width={800}
          height={420}
          className="h-auto w-full rounded object-cover"
        />
        <div className="flex flex-col gap-3">
          <h1 className="text-2xl font-semibold">{game.title}</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-300">{game.description}</p>
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="rounded border px-2 py-1">{game.technology}</span>
            <span className="rounded border px-2 py-1">{game.status}</span>
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            {game.tags.map((tag) => (
              <span key={`${game.id}-${tag}`} className="rounded bg-zinc-100 px-2 py-1 dark:bg-zinc-800">
                #{tag}
              </span>
            ))}
          </div>
          <button
            type="button"
            className="mt-2 w-fit rounded bg-black px-4 py-2 text-white disabled:opacity-50 dark:bg-zinc-200 dark:text-black"
            disabled={!launchReady}
            aria-label="Launch game"
          >
            {launchReady ? "Launch game" : "Unavailable for launch"}
          </button>
          {!launchReady ? (
            <p className="text-sm text-amber-700 dark:text-amber-300">
              This game is not in a launchable state yet.
            </p>
          ) : null}
          <Link href="/catalog" className="underline">
            Back to catalog
          </Link>
        </div>
      </div>
    </article>
  );
}
