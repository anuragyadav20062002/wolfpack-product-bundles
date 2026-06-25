# Issue: Admin LCP Phase 3 — Image Optimisation

**Issue ID:** admin-lcp-phase3-images-1
**Status:** In Progress
**Priority:** 🟡 Medium
**Created:** 2026-06-07
**Last Updated:** 2026-06-07

## Overview

Phase 3 of the Admin LCP minimisation plan (`.claude/plans/plan-out-how-we-velvet-patterson.md`). Phase 1 captured measurement; Phase 2 shipped universal wins (font preload, vendor chunks, single-fetch). This phase tackles the image weight — `/public/` was **22 MB** of unoptimised PNGs, including 1.2–1.6 MB template preview screenshots loaded eagerly on the heaviest admin routes.

Baseline (`docs/perf/baseline-2026-06-07.md` § Phase 1):

| Route | LCP | TTFB | FCP | CLS |
|---|---|---|---|---|
| `/app/dashboard` | 4 416 ms | 4 104 ms | 4 416 ms | 0.156 |

CLS at 0.156 fails the strict budget — primarily because admin `<img>` tags shipped with no `width`/`height`, so layout shifted as images loaded.

## Changes

### 1. AVIF + WebP build pipeline

- New `scripts/optimise-public-images.mjs` (Node ESM) using `sharp@^0.34.5`.
- Walks `/public`, emits `.avif` (q60 effort 4) and `.webp` (q75 effort 4) siblings for every `.png` / `.jpg` / `.jpeg` source.
- Idempotent — skips when the modern variants are newer than the source.
- New npm script `optimise:images`; the existing `build` script now runs it as a prebuild step:
  ```
  "build": "npm run optimise:images && remix vite:build"
  ```

**Initial run results** (one-time, then incremental):

| Source | Original | AVIF | WebP |
|---|---|---|---|
| `FPB-Standard.png` | 1 228 KB | **53 KB** | 59 KB |
| `FPB-Classic.png` | 1 521 KB | **135 KB** | 133 KB |
| `FPB-Compact..png` | 1 434 KB | **54 KB** | 61 KB |
| `FPB-Horizontal.png` | 1 514 KB | **108 KB** | 103 KB |
| `Parth.jpeg` | 68 KB | **30 KB** | 29 KB |
| `appEmbed.png` | 76 KB | **23 KB** | 48 KB |
| `bundleGallery.png` | 219 KB | **23 KB** | 28 KB |
| `fpb.png` | 1 228 KB | **53 KB** | 59 KB |
| `ppb.png` | 1 227 KB | **58 KB** | 61 KB |

Net savings: **42 MB** across all variants from the 22 MB source pool (because each source emits two variants, both ≤ 1/10 the original on average).

### 2. `<OptimisedImage>` component

New `app/components/OptimisedImage.tsx` — a `<picture>` wrapper that:
- Derives `.avif` + `.webp` sibling paths from the source.
- Emits `<source type="image/avif">` + `<source type="image/webp">` + `<img>` fallback.
- Requires `width` and `height` props so the browser reserves layout space (kills CLS from late-loading images).
- Defaults `loading="lazy"` + `decoding="async"`; pass `loading="eager"` + `fetchPriority="high"` for above-the-fold images.
- Passes-through `onLoad`, `className`, `alt`, etc. for existing call sites.

### 3. Dashboard hero — preload moved to `<head>`

Before — post-hydration `new Image()` preload at `app.dashboard/route.tsx:253` (too late to influence LCP):

```ts
useEffect(() => {
  const image = new Image();
  image.src = "/Parth.jpeg";
  // ...
}, []);
```

After — `<link rel="preload" as="image">` emitted from the Remix `links` export and fired during HTML parse:

```ts
export const links: LinksFunction = () => [
  { rel: "preload", as: "image", href: "/Parth.avif", type: "image/avif", fetchPriority: "high" },
];
```

Preloads the AVIF variant (30 KB) so most browsers fetch ~half the JPEG size.

### 4. Call sites updated

| File | Image | Loading strategy |
|---|---|---|
| `app/routes/app/app.dashboard/route.tsx` | `/Parth.jpeg` (hero, above fold) | `eager` + `fetchPriority="high"` + matching `<link rel="preload">` |
| `app/routes/app/app.dashboard/route.tsx` | `/appEmbed.png` | `lazy` |
| `app/routes/app/app.dashboard/route.tsx` | `/bundle.png` (empty state) | `lazy` |
| `app/routes/app/app.dashboard/route.tsx` | `/bundleGallery.png` (resources) | `lazy` (both call sites updated via `replace_all`) |
| `app/routes/app/app.bundles.create/route.tsx` | `/ppb.png`, `/fpb.png` (type pickers, above fold) | `eager` + `fetchPriority="high"` |
| `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/route.tsx` | `/FPB-Standard.png`, `/FPB-Classic.png`, `/FPB-Compact..png`, `/FPB-Horizontal.png` (template selector, above fold on first paint) | `eager` + `fetchPriority="high"` |

All updated `<img>` → `<OptimisedImage>` now ship `width`/`height` props — kills the CLS contribution from these images.

Remaining `<img>` tags in admin code reference dynamic URLs (merchant uploads, Shopify CDN product images, GraphQL data) — those don't have build-time AVIF siblings and stay as plain `<img>`. They can adopt `loading="lazy"` + explicit `width`/`height` in a follow-up if Phase 8 telemetry shows them on the CLS critical path.

## Files

| Path | Change |
|---|---|
| `scripts/optimise-public-images.mjs` | New — sharp-based AVIF + WebP build step |
| `app/components/OptimisedImage.tsx` | New — `<picture>` wrapper |
| `package.json` | `build` script runs `optimise:images` first; adds `sharp@^0.34.5` devDep |
| `app/routes/app/app.dashboard/route.tsx` | `links` export + 4 `<OptimisedImage>` calls + drop `new Image()` |
| `app/routes/app/app.bundles.create/route.tsx` | 2 `<OptimisedImage>` calls (type pickers) |
| `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/route.tsx` | 1 `<OptimisedImage>` call (template selector) |
| `public/*.avif`, `public/*.webp` | Generated variants (committed so production deploy ships them without running the build step server-side) |

## Phases Checklist

- [x] Sharp-based optimisation script + initial run.
- [x] `<OptimisedImage>` `<picture>` component.
- [x] Dashboard hero preload moved to `<link rel="preload">`.
- [x] High-traffic call sites migrated (dashboard, bundles.create, FPB template selector).
- [ ] Deploy (`npm run deploy:sit`).
- [ ] Re-record `/app/dashboard` and `/app/bundles/full-page-bundle/configure/<id>` metrics via the `?perf=1` overlay; append a new H2 in `docs/perf/baseline-2026-06-07.md`.
- [ ] Phase 4 (next issue): loader patterns — parallelise dashboard + attribution loaders, consolidate N+1 bundle queries, loader-level LRU cache. **TTFB-dominant fix.**

## Verification (post-deploy)

1. Hard reload `/app/dashboard?perf=1` — overlay should show LCP / FCP improvements vs `baseline-2026-06-07.md`. CLS especially should drop closer to 0.05.
2. Open Chrome DevTools → Network → filter by `image/avif` — confirm Parth.avif and bundleGallery.avif are fetched, NOT the .jpeg / .png siblings.
3. Navigate to `/app/bundles/full-page-bundle/configure/<id>` — confirm `FPB-*.avif` are fetched. Total image weight for the four-template picker should be ~350 KB (was ~5.7 MB).
4. Lighthouse → Image Optimisation audit — no opportunities > 100 ms.
