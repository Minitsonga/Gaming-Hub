"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import { useAppPreferences } from "../components/app-preferences";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { fetchCatalogGames } from "@/lib/catalog-client";
import type { CatalogGame } from "@/types/catalog";

type HeroGame = {
  id: string;
  slug: string;
  title: string;
  description: string;
  rating: number;
  totalHours: number;
  tags: string[];
};

const placeholderGames: HeroGame[] = [
  {
    id: "ph-roguelike",
    slug: "roguelike-arena",
    title: "ROGUELIKE ARENA",
    description: "Fast paced runs, procedural maps, and brutal boss loops.",
    rating: 4.8,
    totalHours: 1842,
    tags: ["ROGUELIKE", "ACTION"],
  },
  {
    id: "ph-rpg",
    slug: "stellar-chronicles",
    title: "STELLAR CHRONICLES",
    description: "Narrative space-RPG with tactical squad progression.",
    rating: 4.7,
    totalHours: 1620,
    tags: ["RPG", "ADVENTURE"],
  },
  {
    id: "ph-puzzle",
    slug: "orbit-puzzle",
    title: "ORBIT PUZZLE",
    description: "Gravity-based challenge rooms and brain-burning mechanics.",
    rating: 4.5,
    totalHours: 980,
    tags: ["PUZZLE", "SCI-FI"],
  },
  {
    id: "ph-action",
    slug: "neon-strike",
    title: "NEON STRIKE",
    description: "High-speed combat arenas with co-op and score chasing.",
    rating: 4.6,
    totalHours: 1430,
    tags: ["ACTION", "MULTIPLAYER"],
  },
];

export default function Home() {
  const { t } = useAppPreferences();
  const [games, setGames] = useState<HeroGame[]>([]);
  const [loadingGames, setLoadingGames] = useState(true);
  const recentRef = useRef<HTMLDivElement | null>(null);
  const topRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadRecent() {
      try {
        const catalog = await fetchCatalogGames();
        if (!cancelled) {
          const mapped = catalog.slice(0, 8).map((game, index) => ({
            id: game.id,
            slug: game.slug,
            title: game.title.toUpperCase(),
            description: game.description,
            rating: Math.max(4.2, 4.9 - index * 0.1),
            totalHours: 2100 - index * 170,
            tags: (game.tags.length ? game.tags : ["ACTION"]).slice(0, 2).map((tag) => tag.toUpperCase()),
          }));
          setGames(mapped.length >= 4 ? mapped : placeholderGames);
        }
      } catch {
        if (!cancelled) setGames(placeholderGames);
      } finally {
        if (!cancelled) setLoadingGames(false);
      }
    }
    loadRecent();
    return () => {
      cancelled = true;
    };
  }, []);

  const recentGames = useMemo(() => games.slice(0, 8), [games]);
  const topGames = useMemo(
    () => [...games].sort((a, b) => b.rating - a.rating).slice(0, 6),
    [games]
  );

  function scrollCarousel(target: "recent" | "top", direction: "left" | "right") {
    const ref = target === "recent" ? recentRef.current : topRef.current;
    if (!ref) return;
    const amount = Math.round(ref.clientWidth * 0.72) * (direction === "left" ? -1 : 1);
    ref.scrollBy({ left: amount, behavior: "smooth" });
  }

  return (
    <main className="relative flex flex-1 flex-col overflow-hidden">
      <div className="relative mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-6 py-12">
        <section className="relative flex flex-col items-center space-y-4 py-6">
          <p className="space-subtitle max-w-2xl text-center text-sm sm:text-base">
            {t(
              "Travel through unique games in time and space.",
              "Voyage a travers des jeux uniques dans le temps et l'espace."
            )}
          </p>
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="space-etched text-xl font-semibold">{t("Recently added", "Ajouts recents")}</h2>
            <div className="flex items-center gap-2">
              <Link href="/catalog" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "text-zinc-300 hover:text-white")}>
                {t("Browse all", "Voir tout")}
              </Link>
            </div>
          </div>
          {loadingGames ? (
            <p className="text-sm text-muted-foreground">{t("Loading games...", "Chargement des jeux...")}</p>
          ) : (
            <div className="relative">
              <Button
                type="button"
                size="icon-sm"
                variant="outline"
                onClick={() => scrollCarousel("recent", "left")}
                aria-label="Scroll recent games left"
                className="carousel-arrow absolute left-0 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2"
              >
                <ChevronLeft className="size-4" />
              </Button>
              <Button
                type="button"
                size="icon-sm"
                variant="outline"
                onClick={() => scrollCarousel("recent", "right")}
                aria-label="Scroll recent games right"
                className="carousel-arrow absolute right-0 top-1/2 z-10 translate-x-1/2 -translate-y-1/2"
              >
                <ChevronRight className="size-4" />
              </Button>
              <div
                ref={recentRef}
                className="no-scrollbar flex snap-x gap-4 overflow-x-auto pb-2 [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]"
              >
                {recentGames.map((game) => (
                  <Link
                    key={game.id}
                    href={`/games/${game.id}`}
                    className="min-w-[280px] snap-start rounded-xl border border-sky-300/20 bg-gradient-to-b from-slate-950/90 to-slate-900/60 p-4 shadow-[0_10px_30px_rgba(0,0,0,0.45)] hover:border-sky-300/50"
                  >
                    <p className="font-semibold">{game.title}</p>
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{game.description}</p>
                    <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1 rounded-full border border-amber-300/30 bg-amber-400/10 px-2 py-0.5 text-amber-200">
                        <Star className="size-3 fill-amber-300 text-amber-300" />
                        {game.rating.toFixed(1)}
                      </span>
                      <span>{game.totalHours}h {t("PLAYED", "JOUEES")}</span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {game.tags.map((tag) => (
                        <span key={`${game.id}-${tag}`} className="rounded-full border border-sky-300/20 bg-sky-400/10 px-2 py-0.5 text-[10px] text-sky-200">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="space-etched text-xl font-semibold">{t("Top games", "Top games")}</h2>
          </div>
          <div className="relative">
            <Button
              type="button"
              size="icon-sm"
              variant="outline"
              onClick={() => scrollCarousel("top", "left")}
              aria-label="Scroll top games left"
              className="carousel-arrow absolute left-0 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              type="button"
              size="icon-sm"
              variant="outline"
              onClick={() => scrollCarousel("top", "right")}
              aria-label="Scroll top games right"
              className="carousel-arrow absolute right-0 top-1/2 z-10 translate-x-1/2 -translate-y-1/2"
            >
              <ChevronRight className="size-4" />
            </Button>
            <div
              ref={topRef}
              className="no-scrollbar flex snap-x gap-4 overflow-x-auto pb-2 [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]"
            >
              {topGames.map((game, index) => (
                <Card key={`${game.id}-top`} className="min-w-[280px] snap-start border-sky-300/20 bg-slate-950/70 shadow-[0_6px_24px_rgba(0,0,0,0.35)]">
                  <CardHeader>
                    <CardTitle className="text-base">
                      #{index + 1} {game.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    {t("Rating", "Note")}: {game.rating.toFixed(1)} • {t("Total playtime", "Temps de jeu total")}: {game.totalHours}h
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <div className="flex justify-center">
          <Link
            href="/catalog"
            className={cn(
              buttonVariants({ size: "lg" }),
              "rounded-full border border-sky-300/40 bg-gradient-to-r from-sky-600/80 via-indigo-500/80 to-violet-600/80 text-white shadow-[0_8px_25px_rgba(56,189,248,0.35)] hover:brightness-110"
            )}
          >
            {t("VIEW ALL GAMES", "VOIR TOUS LES JEUX")}
          </Link>
        </div>
      </div>
    </main>
  );
}
