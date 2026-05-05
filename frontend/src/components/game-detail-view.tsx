"use client";

import Image from "next/image";
import Link from "next/link";
import { useAppPreferences } from "./app-preferences";
import { CatalogGame } from "../types/catalog";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function canLaunchGame(status: string): boolean {
  return status.toLowerCase() === "published";
}

export function GameDetailView({ game }: { game: CatalogGame }) {
  const { t } = useAppPreferences();
  const launchReady = canLaunchGame(game.status);

  return (
    <Card className="overflow-hidden border-sky-300/20 bg-slate-950/62 shadow-[0_10px_30px_rgba(0,0,0,0.45)]">
      <div className="grid grid-cols-1 gap-0 md:grid-cols-2">
        <div className="relative aspect-video bg-slate-900/60 md:min-h-[280px]">
          <Image
            src={game.thumbnailUrl}
            alt={`${game.title} thumbnail`}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
            priority
          />
        </div>
        <div className="flex flex-col">
          <CardHeader>
            <CardTitle className="text-2xl">{game.title}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col gap-3">
            <p className="text-sm text-muted-foreground">{game.description}</p>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="rounded-md border border-sky-300/20 bg-slate-900/55 px-2 py-0.5">{game.technology}</span>
              <span className="rounded-md border border-sky-300/20 bg-slate-900/55 px-2 py-0.5">{game.status}</span>
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              {game.tags.map((tag) => (
                <span key={`${game.id}-${tag}`} className="rounded-md border border-sky-300/20 bg-sky-400/10 px-2 py-0.5 text-sky-100">
                  #{tag}
                </span>
              ))}
            </div>
            {launchReady ? (
              <Link href={`/play/${game.slug}`} className={cn(buttonVariants(), "mt-2 w-fit")}>
                {t("Launch game", "Lancer le jeu")}
              </Link>
            ) : (
              <Button type="button" className="mt-2 w-fit" disabled>
                {t("Unavailable for launch", "Indisponible au lancement")}
              </Button>
            )}
            {!launchReady ? (
              <p className="text-sm text-amber-700 dark:text-amber-300">
                {t("This game is not in a launchable state yet.", "Ce jeu n'est pas encore dans un etat lancable.")}
              </p>
            ) : null}
          </CardContent>
          <CardFooter className="border-t border-sky-300/15 bg-slate-950/55">
            <Link href="/catalog" className={cn(buttonVariants({ variant: "link" }), "h-auto p-0")}>
              {t("Back to catalog", "Retour au catalogue")}
            </Link>
          </CardFooter>
        </div>
      </div>
    </Card>
  );
}
