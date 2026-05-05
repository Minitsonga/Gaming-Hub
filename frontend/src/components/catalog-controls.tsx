"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { useAppPreferences } from "./app-preferences";
import { CatalogSortBy, CatalogSortOrder } from "@/lib/catalog-view-model";

type CatalogControlsProps = {
  search: string;
  activeTag: string;
  sortBy: CatalogSortBy;
  sortOrder: CatalogSortOrder;
  onSearchChange: (value: string) => void;
  onTagChange: (value: string) => void;
  onSortByChange: (value: CatalogSortBy) => void;
  onSortOrderChange: (value: CatalogSortOrder) => void;
};

const genreTags = ["Action", "Roguelike", "RPG", "Adventure", "Puzzle"];

export function CatalogControls({
  search,
  activeTag,
  sortBy,
  sortOrder,
  onSearchChange,
  onTagChange,
  onSortByChange,
  onSortOrderChange,
}: CatalogControlsProps) {
  const { t } = useAppPreferences();

  return (
    <section aria-label="Catalog controls" className="grid grid-cols-1 gap-4">
      <div className="space-y-2 sm:max-w-xl">
        <Label htmlFor="catalog-search">{t("Search", "Recherche")}</Label>
        <div className="flex items-center gap-2">
          <Input
            id="catalog-search"
            className="border-white/12 bg-slate-950/70 text-slate-100 placeholder:text-slate-400 focus-visible:border-sky-300/45"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={t("Search by title...", "Rechercher par titre...")}
          />
          <button
            type="button"
            className={cn(
              buttonVariants({ size: "sm", variant: "outline" }),
              "border-white/12 bg-slate-950/72 text-slate-100 hover:bg-slate-900/85"
            )}
            onClick={() => onSearchChange(search.trim())}
          >
            {t("Search", "Rechercher")}
          </button>
        </div>
      </div>
      <div className="space-y-2">
        <Label>{t("Genre tags", "Tags de genre")}</Label>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onTagChange("")}
            className={cn(
              buttonVariants({ size: "sm", variant: activeTag === "" ? "default" : "outline" }),
              activeTag === "" ? "bg-sky-500/30 text-sky-50" : "border-white/12 bg-slate-950/65 text-slate-200 hover:bg-slate-900/85"
            )}
          >
            {t("All", "Tous")}
          </button>
          {genreTags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => onTagChange(tag.toLowerCase())}
              className={cn(
                buttonVariants({
                  size: "sm",
                  variant: activeTag === tag.toLowerCase() ? "default" : "outline",
                }),
                activeTag === tag.toLowerCase()
                  ? "bg-sky-500/30 text-sky-50"
                  : "border-white/12 bg-slate-950/65 text-slate-200 hover:bg-slate-900/85"
              )}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="catalog-sort-by">{t("Sort by", "Trier par")}</Label>
          <Select value={sortBy} onValueChange={(value) => onSortByChange(value as CatalogSortBy)}>
            <SelectTrigger
              id="catalog-sort-by"
              className="w-full border-white/12 bg-slate-950/70 text-slate-100 hover:bg-slate-900/85"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="border-white/12 bg-slate-950/95 text-slate-100">
              <SelectItem value="relevant">{t("relevant", "pertinent")}</SelectItem>
              <SelectItem value="alphabetical">{t("alphabetical", "alphabetique")}</SelectItem>
              <SelectItem value="creation-age">{t("creation age", "date de creation")}</SelectItem>
              <SelectItem value="favorite-count">{t("favorite count", "nombre de favoris")}</SelectItem>
              <SelectItem value="playtime">{t("playtime", "temps de jeu")}</SelectItem>
              <SelectItem value="rating">{t("rating", "note")}</SelectItem>
              <SelectItem value="update-time">{t("update time", "date de mise a jour")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="catalog-sort-order">{t("Order", "Ordre")}</Label>
          <Select value={sortOrder} onValueChange={(value) => onSortOrderChange(value as CatalogSortOrder)}>
            <SelectTrigger
              id="catalog-sort-order"
              className="w-full border-white/12 bg-slate-950/70 text-slate-100 hover:bg-slate-900/85"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="border-white/12 bg-slate-950/95 text-slate-100">
              <SelectItem value="asc">{t("ascending", "croissant")}</SelectItem>
              <SelectItem value="desc">{t("descending", "decroissant")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </section>
  );
}
