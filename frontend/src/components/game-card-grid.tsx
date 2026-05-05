"use client";

import Link from "next/link";
import Image from "next/image";
import { CatalogGame } from "../types/catalog";
import { useAppPreferences } from "./app-preferences";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Star } from "lucide-react";

type GameCardGridProps = {
  games: CatalogGame[];
};

export function GameCardGrid({ games }: GameCardGridProps) {
  const { t } = useAppPreferences();

  function getCatalogStateLabel(gamesCount: number): string {
    if (gamesCount === 0) return t("No games available.", "Aucun jeu disponible.");
    if (gamesCount === 1) return t("1 game available.", "1 jeu disponible.");
    return `${gamesCount} ${t("games available.", "jeux disponibles.")}`;
  }

  function getPlaceholderMetrics(game: CatalogGame) {
    if (game.slug.toLowerCase().includes("rogue")) {
      return { rating: 4.8, totalHours: 1842 };
    }
    return { rating: 4.5, totalHours: 760 };
  }

  return (
    <section aria-label="Catalog results" className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">{getCatalogStateLabel(games.length)}</p>
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {games.map((game) => (
          <li key={game.id}>
            <Card className="h-full overflow-hidden border-sky-300/20 bg-slate-950/62 pt-0 transition-shadow hover:border-sky-300/45 hover:shadow-[0_10px_28px_rgba(0,0,0,0.45)]">
              <div className="relative aspect-video w-full bg-slate-900/60">
                <Image
                  src={game.thumbnailUrl}
                  alt={`${game.title} thumbnail`}
                  className="object-cover"
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
              </div>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg leading-snug">{game.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pb-2">
                <p className="line-clamp-3 text-sm text-muted-foreground">{game.description}</p>
                <div className="flex items-center gap-4 text-xs">
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-1 text-amber-300">
                    <Star className="size-3 fill-amber-300 text-amber-300" />
                    {getPlaceholderMetrics(game).rating.toFixed(1)}
                  </span>
                  <span className="rounded-full bg-primary/10 px-2 py-1 text-primary">
                    {getPlaceholderMetrics(game).totalHours}h {t("total played", "jouees au total")}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="rounded-md border border-sky-300/20 bg-slate-900/55 px-2 py-0.5">
                    {game.technology}
                  </span>
                  <span className="rounded-md border border-sky-300/20 bg-slate-900/55 px-2 py-0.5">
                    {game.status}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  {game.tags.map((tag) => (
                    <span
                      key={`${game.id}-${tag}`}
                      className="rounded-md border border-sky-300/20 bg-sky-400/10 px-2 py-0.5 text-sky-100"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="border-t border-sky-300/15 bg-slate-950/55 pt-3">
                <Link href={`/games/${game.id}`} className={cn(buttonVariants({ variant: "link" }), "h-auto p-0")}>
                  {t("View details", "Voir details")}
                </Link>
              </CardFooter>
            </Card>
          </li>
        ))}
      </ul>
    </section>
  );
}
