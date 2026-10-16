/** Turn API media paths into same-origin URLs (Vite proxies /media in dev). */
export function resolveMediaUrl(path: string | null | undefined): string | null {
  const trimmed = path?.trim();
  if (!trimmed) {
    return null;
  }
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:')) {
    return trimmed;
  }
  const normalized = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  if (typeof window !== 'undefined') {
    return `${window.location.origin}${normalized}`;
  }
  return normalized;
}
