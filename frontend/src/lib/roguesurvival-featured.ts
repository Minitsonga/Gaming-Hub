import type { CatalogGame } from "@/types/catalog";

/** Jeu WebGL embarqué — dossier public/games/roguesurvival/ */
export const ROGUESURVIVAL_SLUG = "roguesurvival";

export const roguesurvivalFeatured = {
  id: "featured-roguesurvival",
  slug: ROGUESURVIVAL_SLUG,
  title: "ROGUE SURVIVAL",
  description:
    "Roguelike d'action WebGL : runs, skills, Xyst et progression sauvegardée sur le hub.",
  rating: 4.8,
  totalHours: 1842,
  tags: ["ROGUELIKE", "SURVIVAL", "UNITY"],
  thumbnailUrl: "/games/roguesurvival/TemplateData/unity-logo-dark.png",
  technology: "Unity",
  status: "published",
} as const;

export function isRoguesurvivalSlug(slug: string): boolean {
  return slug.toLowerCase() === ROGUESURVIVAL_SLUG;
}

/** Lien carte / hero : jeu jouable directement par slug. */
export function getPlayHref(slug: string): string {
  return `/play/${encodeURIComponent(slug)}`;
}

/** Carte catalogue quand l’API ne renvoie encore aucun jeu. */
export function toRoguesurvivalCatalogCard(): CatalogGame {
  return {
    id: roguesurvivalFeatured.id,
    slug: roguesurvivalFeatured.slug,
    title: "Rogue Survival",
    description: roguesurvivalFeatured.description,
    thumbnailUrl: roguesurvivalFeatured.thumbnailUrl,
    technology: roguesurvivalFeatured.technology,
    status: roguesurvivalFeatured.status,
    tags: [...roguesurvivalFeatured.tags],
  };
}

export function getGameCardHref(game: { id: string; slug: string }): string {
  if (isRoguesurvivalSlug(game.slug)) return getPlayHref(game.slug);
  if (game.id.startsWith("featured-") || game.id.startsWith("ph-")) {
    return isRoguesurvivalSlug(game.slug) ? getPlayHref(game.slug) : "/catalog";
  }
  return `/games/${game.id}`;
}
