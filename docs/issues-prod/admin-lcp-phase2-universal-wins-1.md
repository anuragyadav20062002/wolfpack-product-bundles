# Issue: Admin LCP Phase 2 — Universal Wins

**Issue ID:** admin-lcp-phase2-universal-wins-1
**Status:** In Progress
**Priority:** 🟡 Medium
**Created:** 2026-06-07
**Last Updated:** 2026-06-07

## Overview

Phase 2 of the Admin LCP minimisation plan at `/Users/adityaawasthi/.claude/plans/plan-out-how-we-velvet-patterson.md`. Phase 1 (`admin-lcp-measurement-1`) shipped the Web Vitals telemetry + Server-Timing helper + Lighthouse CI; this issue ships the cheap universal wins those measurements unlock. Same scope across all 17 admin routes (the user picked "ALL" during planning).

Baseline (`docs/perf/baseline-2026-06-07.md`):

| Route | LCP | TTFB | FCP | CLS |
|---|---|---|---|---|
| `/app/dashboard` | 4 416 ms | 4 104 ms | 4 416 ms | 0.156 |

## Changes

### 1. Font loading (`app/root.tsx`)

Before — single render-blocking `<link rel="stylesheet">` for Shopify CDN's Inter font:

```html
<link rel="preconnect" href="https://cdn.shopify.com/" />
<link rel="stylesheet" href="https://cdn.shopify.com/static/fonts/inter/v4/styles.css" />
```

After — non-render-blocking preload + swap, with a noscript fallback:

```html
<link rel="preconnect" href="https://cdn.shopify.com/" crossorigin="anonymous" />
<link rel="preload" as="style" href=".../styles.css" />
<link rel="stylesheet" href=".../styles.css" media="print" onload="this.media='all'" />
<noscript><link rel="stylesheet" href=".../styles.css" /></noscript>
<style>@font-face{font-family:Inter;font-display:swap}</style>
```

Three independent wins layered together:
- `crossorigin` on the preconnect — Inter fetch uses a same-credentialed pre-warmed connection. Without `crossorigin`, the browser opens a second connection for the font fetch, defeating the preconnect.
- `preload` + `media="print"` swap — the stylesheet downloads as a non-render-blocking resource and is promoted to `media="all"` once it lands.
- `font-display: swap` override — the system font fallback paints immediately; Inter swaps in when ready. Converts FOIT to FOUT.

Expected p75 LCP drop: 100–300 ms on cold loads where the Inter download was on the critical path. Larger gain on slow networks.

### 2. Vite manual chunking (`vite.config.ts`)

Splits long-lived vendor code into named chunks so admin navigations re-use cached files across routes and across deploys:

| Chunk | What ends up inside |
|---|---|
| `vendor-react` | `react`, `react-dom`, `scheduler` |
| `vendor-charts` | `recharts`, `d3-*`, `victory-vendor` |
| `vendor-shopify` | `@shopify/*` (polaris, app-bridge-react, app-bridge, polaris-icons, etc.) |
| `vendor-remix` | `@remix-run/*` |
| (default) | everything else (route-specific code) |

Previously every admin route's entry chunk re-bundled `react`, `polaris`, and (on analytics-touching routes) `recharts`. Each route navigation re-downloaded ~600 KB. Now those vendor chunks land once per session.

Expected p75 LCP drop on second-and-later-route-navigation: 150–400 ms (one network round-trip + parse saved).

### 3. `v3_singleFetch` enabled (`vite.config.ts`)

```ts
v3_singleFetch: true
```

Remix's single-fetch parallelises child-route data loading. Before: navigation to `/app/dashboard` made one HTTP call per matched route loader (`app.tsx` + `app.dashboard/route.tsx`) and the child waited on the parent's response. After: one HTTP call returns both, the parent + child loaders run concurrently on the server.

Audited 2026-06-07 — every admin loader returns plain JSON shapes via Remix `json()`; no `Date` / `Map` / `Set` / `BigInt` in payloads. Safe to enable.

Expected p75 TTFB drop on multi-route navigations: 200–500 ms.

## Files

| Path | Change |
|---|---|
| `app/root.tsx` | Font preload + swap + crossorigin + `font-display: swap` override |
| `vite.config.ts` | `manualChunks` for vendor split + `v3_singleFetch: true` |
| `docs/perf/baseline-2026-06-07.md` | Phase 1 baseline (Phase 1 commit) |
| `docs/issues-prod/admin-lcp-phase2-universal-wins-1.md` | This file |

## Phases Checklist

- [x] Font loading rewrite in `app/root.tsx`.
- [x] Vite `manualChunks` for `vendor-react` / `vendor-charts` / `vendor-shopify` / `vendor-remix`.
- [x] `v3_singleFetch: true`.
- [ ] Deploy (`npm run deploy:sit`).
- [ ] Re-record `/app/dashboard` metrics via `?perf=1` overlay; append a new H2 in `docs/perf/baseline-2026-06-07.md`.
- [ ] Verify `AdminWebVital` aggregate query shows p75 LCP shift on `agent-5sfidg3m.myshopify.com`.
- [ ] Phase 3 (next issue): image optimisation across the admin — AVIF/WebP for `/public/FPB-*.png`, `loading="lazy"` + `width`/`height` everywhere, drop the dashboard `new Image()` preload.

## Verification (post-deploy)

1. Hard reload `/app/dashboard?perf=1` — overlay should show LCP / FCP improvements vs `baseline-2026-06-07.md`.
2. Open Chrome DevTools → Network tab → filter by `chunk` — confirm three new files appear: `vendor-react-*.js`, `vendor-shopify-*.js`, `vendor-remix-*.js`. `vendor-charts-*.js` only appears on analytics navigation (it's still eager-loaded in Phase 2; lazy comes in Phase 5).
3. Navigate Dashboard → Settings → back to Dashboard — the vendor chunks should serve from cache (200 from disk cache).
4. Network tab → filter by font — Inter font request shows as priority "Low" (preload) and the stylesheet response shows `Stylesheet` content type but does NOT block FCP (look for a green arrow before its line in the Performance trace).
