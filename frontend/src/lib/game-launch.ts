export function buildLaunchUrl(baseUrl: string, gameSlug: string): string {
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
  return `${normalizedBase}/${encodeURIComponent(gameSlug)}`;
}

export function isLaunchableStatus(status: string): boolean {
  return status.toLowerCase() === "published";
}
