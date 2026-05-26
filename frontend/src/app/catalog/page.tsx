"use client";

import { useEffect, useState } from "react";
import { CatalogControls } from "../../components/catalog-controls";
import { FeedbackMessage } from "../../components/feedback-message";
import { useAppPreferences } from "../../components/app-preferences";
import { GameCardGrid } from "../../components/game-card-grid";
import { fetchCatalogGames } from "../../lib/catalog-client";
import {
  filterAndSortGames,
  paginateGames,
  type CatalogSortBy,
  type CatalogSortOrder,
} from "../../lib/catalog-view-model";
import { toRoguesurvivalCatalogCard } from "@/lib/roguesurvival-featured";
import { CatalogGame } from "../../types/catalog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const PAGE_SIZE = 6;

export default function CatalogPage() {
  const { t } = useAppPreferences();
  const [games, setGames] = useState<CatalogGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [activeTag, setActiveTag] = useState("");
  const [sortBy, setSortBy] = useState<CatalogSortBy>("relevant");
  const [sortOrder, setSortOrder] = useState<CatalogSortOrder>("desc");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const controller = new AbortController();

    async function loadGames() {
      setLoading(true);
      setError(null);
      try {
        const nextGames = await fetchCatalogGames({ tag: activeTag }, controller.signal);
        setGames(nextGames);
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          setError(t("Unable to load catalog.", "Impossible de charger le catalogue."));
        }
      } finally {
        setLoading(false);
      }
    }

    loadGames();
    return () => controller.abort();
  }, [activeTag]);

  const refinedGames = filterAndSortGames(games, search, sortBy, sortOrder);
  const pageCount = Math.max(1, Math.ceil(refinedGames.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const visibleGames = paginateGames(refinedGames, currentPage, PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [search, activeTag, sortBy, sortOrder]);

  useEffect(() => {
    const query = new URLSearchParams(window.location.search).get("search") ?? "";
    setSearch(query);
  }, []);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="space-etched text-3xl font-semibold tracking-tight">{t("Game catalog", "Catalogue de jeux")}</h1>
        <p className="space-subtitle mt-2 text-sm">
          {t("Filter and open game details.", "Filtre et ouvre les details des jeux.")}
        </p>
      </div>

      <Card className="border-sky-300/20 bg-slate-950/55 shadow-[0_8px_28px_rgba(0,0,0,0.35)]">
        <CardHeader>
          <CardTitle className="space-etched text-lg">{t("Filters", "Filtres")}</CardTitle>
        </CardHeader>
        <CardContent>
          <CatalogControls
            search={search}
            activeTag={activeTag}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSearchChange={setSearch}
            onTagChange={setActiveTag}
            onSortByChange={setSortBy}
            onSortOrderChange={setSortOrder}
          />
        </CardContent>
      </Card>

      {loading ? (
        <p className="text-muted-foreground" role="status">
          {t("Loading catalog...", "Chargement du catalogue...")}
        </p>
      ) : null}
      {!loading && error ? <FeedbackMessage variant="error" message={error} /> : null}
      {!loading && !error && refinedGames.length === 0 ? (
        <>
          <FeedbackMessage
            variant="info"
            message={t(
              "No other game matches this search. You can still play Rogue Survival.",
              "Aucun autre jeu ne correspond a cette recherche. Tu peux quand meme jouer a Rogue Survival."
            )}
          />
          <GameCardGrid games={[toRoguesurvivalCatalogCard()]} />
        </>
      ) : null}
      {!loading && !error && refinedGames.length > 0 ? <GameCardGrid games={visibleGames} /> : null}
      {!loading && !error && refinedGames.length > 0 ? (
        <nav aria-label="Catalog pagination" className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="border-sky-300/35 bg-slate-950/45 hover:bg-sky-500/10"
            onClick={() => setPage((previous) => Math.max(1, previous - 1))}
            disabled={currentPage <= 1}
          >
            {t("Previous", "Precedent")}
          </Button>
          <span className="text-sm text-muted-foreground">
            {t("Page", "Page")} {currentPage} / {pageCount}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="border-sky-300/35 bg-slate-950/45 hover:bg-sky-500/10"
            onClick={() => setPage((previous) => Math.min(pageCount, previous + 1))}
            disabled={currentPage >= pageCount}
          >
            {t("Next", "Suivant")}
          </Button>
        </nav>
      ) : null}
    </main>
  );
}
