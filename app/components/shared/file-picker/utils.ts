export const ACCEPTED_TYPES = "image/jpeg,image/png,image/webp,image/gif,image/svg+xml,image/avif";
export const MAX_BYTES = 20 * 1024 * 1024;
export const MAX_POLLS = 15;

export function truncateStoreFileText(str: string, max: number): string {
  return str.length > max ? str.slice(0, max - 1) + "…" : str;
}

export function formatStoreFileDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

export function filenameFromUrl(url: string): string {
  try {
    const urlPath = new URL(url).pathname;
    const parts = urlPath.split("/");
    return decodeURIComponent(parts[parts.length - 1] ?? url);
  } catch {
    return url;
  }
}
