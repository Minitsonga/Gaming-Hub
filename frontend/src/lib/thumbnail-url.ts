/** Chemins relatifs pour next/image (évite hostname localhost non configuré). */
export function normalizeThumbnailUrl(url: string): string {
  if (!url) return '';

  try {
    if (url.startsWith('/')) return url;
    const parsed = new URL(url);
    if (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') {
      return `${parsed.pathname}${parsed.search}`;
    }
    return url;
  } catch {
    return url.startsWith('/') ? url : `/${url.replace(/^\//, '')}`;
  }
}

export function isSameOriginThumbnail(url: string): boolean {
  if (url.startsWith('/')) return true;
  try {
    const parsed = new URL(url);
    return parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1';
  } catch {
    return false;
  }
}
