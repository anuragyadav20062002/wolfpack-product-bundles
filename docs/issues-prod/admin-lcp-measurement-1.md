# Issue: Admin LCP Measurement Infrastructure

**Issue ID:** admin-lcp-measurement-1
**Status:** In Progress
**Priority:** 🟡 Medium
**Created:** 2026-06-06
**Last Updated:** 2026-06-06

## Overview

Phase 1 of the broader Admin LCP minimisation plan at `/Users/adityaawasthi/.claude/plans/plan-out-how-we-velvet-patterson.md`. Ships **measurement before optimisation** so every later phase has a before/after signal. Without this, "we made it faster" is hand-wavy.

The audit found:
- No Web Vitals telemetry anywhere in the admin.
- No `Server-Timing` headers on any loader.
- No Lighthouse CI gate on PRs.
- No developer-facing live readout of LCP / INP / CLS during reproduction.

This issue lands all four.

## Scope (Phase 1 only)

1. **Client-side Web Vitals reporter** — `web-vitals` lib (v5.3.0, 3 kB gz) wired into `app/root.tsx`, posts to a new endpoint.
2. **Durable storage** — new `AdminWebVital` Prisma model with `@@unique([shopId, sessionId, route, metric])` so duplicate beacons (StrictMode double-fire, retries) deduplicate at the DB layer.
3. **Server endpoint** — `/api/web-vitals` action, authenticated via the standard admin session guard, validates + persists.
4. **Server-Timing helper** — reusable `ServerTiming` class for loaders to instrument DB / Shopify GraphQL / service calls. Surfaces in Chrome DevTools' Network panel automatically.
5. **Lighthouse CI smoke** — GitHub Actions workflow runs on PRs that touch admin code; gates LCP / INP / CLS / TBT against the budgets in `lighthouserc.json`.
6. **Dev-only `?perf=1` overlay** — fixed-position card showing live Web Vitals values with rating-coloured backgrounds. Useful for the merchant-success team during reproductions.

Out of scope here (covered by later phases of the plan):
- Actual LCP optimisations (font preload, image conversion, loader parallelisation, code splitting). Those each get their own issue and PR.
- A merchant-visible perf dashboard. The data is collected; visualising it is a follow-up.

## Files

| Layer | Path |
|---|---|
| Prisma model | `prisma/schema.prisma` (`AdminWebVital`) |
| Migration | `prisma/migrations/20260606010000_add_admin_web_vital/migration.sql` |
| Server-Timing helper | `app/lib/server-timing.server.ts` |
| Helper tests | `tests/unit/lib/server-timing.test.ts` (9 cases) |
| Client reporter | `app/lib/web-vitals.client.ts` |
| Beacon endpoint | `app/routes/api/api.web-vitals.tsx` |
| Root wiring | `app/root.tsx` (`useEffect(reportWebVitals)`) |
| Dev overlay | `app/components/PerfDebugOverlay.tsx` |
| Overlay mount | `app/routes/app/app.tsx` (`?perf=1` gated) |
| Lighthouse config | `lighthouserc.json` |
| Lighthouse workflow | `.github/workflows/lighthouse-admin.yml` |

## Budgets (initial — tune after the first week of data)

| Metric | Warn | Fail |
|---|---|---|
| LCP | 2 000 ms | 3 000 ms |
| INP | 200 ms | (warn only) |
| CLS | 0.1 | 0.1 (error) |
| TBT | 200 ms | 600 ms |
| FCP | 1 500 ms | (warn only) |
| Speed Index | 2 500 ms | (warn only) |
| Render-blocking resources | max 2 | (warn only) |

## Phases Checklist

- [x] Phase 1.1: Prisma `AdminWebVital` model + migration + client regeneration.
- [x] Phase 1.2: `ServerTiming` helper + 9 unit tests.
- [x] Phase 1.3: `web-vitals` dep + client reporter + `/api/web-vitals` endpoint + `app/root.tsx` wiring.
- [x] Phase 1.4: `lighthouserc.json` + `.github/workflows/lighthouse-admin.yml`.
- [x] Phase 1.5: `?perf=1` dev overlay (`PerfDebugOverlay`).
- [ ] Phase 1.6 (deploy): `npx prisma migrate deploy` (applies the new table) + `npm run deploy:sit`. Render's start script runs `prisma migrate deploy` so this happens automatically on next boot.
- [ ] Phase 1.7 (validation): hit SIT admin with `?perf=1`, navigate Dashboard → Analytics → FPB Configure, watch the overlay numbers update; confirm `AdminWebVital` rows accumulate. Open Network tab and verify `Server-Timing` headers surface in DevTools after Phase 2 instrumentation lands.
- [ ] Phase 2 (next issue): apply universal LCP wins — font preload, vite manual chunking, Polaris CSS lazy, `v3_singleFetch` enable.

## Verification (post-deploy)

1. Open SIT admin: `https://admin.shopify.com/store/agent-5sfidg3m/apps/wolfpack-product-bundles-sit/app/dashboard?perf=1`.
2. Bottom-right card shows LCP / INP / CLS / TTFB / FCP with rating colours.
3. Navigate Dashboard → Analytics → FPB Configure; values update per route.
4. In Prisma Studio:
   ```sql
   SELECT route, metric,
          COUNT(*) AS samples,
          percentile_cont(0.75) WITHIN GROUP (ORDER BY value) AS p75
   FROM "AdminWebVital"
   WHERE "shopId" = 'agent-5sfidg3m.myshopify.com'
   GROUP BY route, metric
   ORDER BY route, metric;
   ```
5. Open a PR touching `app/routes/app/**` — GitHub Actions runs the Lighthouse workflow and uploads three HTML reports as artefacts.
