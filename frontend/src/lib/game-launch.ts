/** Résolution native du build Unity WebGL (roguesurvival). */
export const GAME_VIEWPORT = { width: 1080, height: 720 } as const;

export const GAME_ASPECT_CLASS = "aspect-[3/2]" as const;

export function buildLaunchUrl(baseUrl: string, gameSlug: string): string {
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
  // index.html explicite : /games/[id] Next intercepte le dossier sans fichier
  return `${normalizedBase}/${encodeURIComponent(gameSlug)}/index.html`;
}

export function isLaunchableStatus(status: string): boolean {
  return status.toLowerCase() === "published";
}
