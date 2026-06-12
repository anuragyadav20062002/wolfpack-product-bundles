/**
 * OptimisedImage — `<picture>` wrapper with AVIF / WebP / source fallback.
 *
 * Use anywhere the admin wants a static `/public/*.png` or `/public/*.jpg`
 * delivered as a modern format with graceful fallback. Pairs with the
 * `scripts/optimise-public-images.mjs` build step which emits the .avif
 * and .webp siblings.
 *
 * Below-fold images should pass `loading="lazy"` and `decoding="async"`.
 * Above-the-fold images (template selector hero, dashboard hero) should
 * stay `loading="eager"` and may want `fetchPriority="high"`.
 *
 * Always pass `width`/`height` so the browser reserves space and CLS
 * stays low — that's why the props are required.
 *
 * Issue: docs/issues-prod/admin-lcp-phase3-images-1.md.
 */

import type { ImgHTMLAttributes } from "react";

export interface OptimisedImageProps
  extends Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "width" | "height"> {
  /** Path under /public, including leading slash and original extension (e.g. "/FPB-Standard.png"). */
  src: string;
  /** Required — reserves layout space to keep CLS low. */
  width: number | string;
  /** Required — reserves layout space to keep CLS low. */
  height: number | string;
  /** Defaults to "lazy". Pass "eager" for above-the-fold images. */
  loading?: "lazy" | "eager";
  /** Defaults to "async". */
  decoding?: "async" | "sync" | "auto";
  /** Optional fetch priority hint. */
  fetchPriority?: "high" | "low" | "auto";
}

/** Returns sibling paths with the .avif and .webp extensions. */
function deriveSiblings(src: string): { avif: string | null; webp: string | null; ext: string } {
  const match = /\.(png|jpe?g)$/i.exec(src);
  if (!match) return { avif: null, webp: null, ext: "" };
  const base = src.slice(0, src.length - match[0].length);
  return { avif: `${base}.avif`, webp: `${base}.webp`, ext: match[0] };
}

export function OptimisedImage({
  src,
  width,
  height,
  loading = "lazy",
  decoding = "async",
  fetchPriority,
  alt,
  ...rest
}: OptimisedImageProps) {
  const { avif, webp } = deriveSiblings(src);

  const imgProps: ImgHTMLAttributes<HTMLImageElement> = {
    ...rest,
    src,
    width,
    height,
    loading,
    decoding,
  };
  if (fetchPriority) {
    // React 18 warns on camel-cased fetchPriority in the DOM.
    (imgProps as Record<string, unknown>).fetchpriority = fetchPriority;
  }

  // If neither sibling is derivable (svg, gif, dynamic url, etc.) just emit the plain img.
  if (!avif && !webp) return <img {...imgProps} alt={alt ?? ""} />;

  return (
    <picture>
      {avif && <source type="image/avif" srcSet={avif} />}
      {webp && <source type="image/webp" srcSet={webp} />}
      <img {...imgProps} alt={alt ?? ""} />
    </picture>
  );
}
