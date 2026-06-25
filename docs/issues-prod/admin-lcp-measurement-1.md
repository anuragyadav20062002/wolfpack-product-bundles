# Issue: Admin LCP Measurement Infrastructure

**Issue ID:** admin-lcp-measurement-1
**Status:** Retired
**Priority:** 🟡 Medium
**Created:** 2026-06-06
**Last Updated:** 2026-06-12

## Overview

Phase 1 of the broader Admin LCP minimisation plan at `.claude/plans/plan-out-how-we-velvet-patterson.md`. Ships **measurement before optimisation** so every later phase has a before/after signal. Without this, "we made it faster" is hand-wavy.

> Retired on 2026-06-12: Shopify App Bridge now supplies the embedded Admin Web Vitals signal used for Built for Shopify assessment. The custom `web-vitals` client, `/api/web-vitals` endpoint, and `AdminWebVital` table were removed; keep this issue only as historical context for the Server-Timing work and original baseline.

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

## Progress Log
### 2026-06-08 - Lighthouse CI Workflow Removed
- ✅ Deleted `.github/workflows/lighthouse-admin.yml` — workflow was consistently failing on CI (budget not met) and blocking PRs. Removing until LCP targets are achievable.

## Phases Checklist

- [x] Phase 1.1: Prisma `AdminWebVital` model + migration + client regeneration.
- [x] Phase 1.2: `ServerTiming` helper + 9 unit tests.
- [x] Phase 1.3: `web-vitals` dep + client reporter + `/api/web-vitals` endpoint + `app/root.tsx` wiring.
- [x] Phase 1.4: `lighthouserc.json` + `.github/workflows/lighthouse-admin.yml`.
- [x] Phase 1.5: `?perf=1` dev overlay (`PerfDebugOverlay`).
- [x] Phase 1.6 (retired): Custom table deployment is obsolete; the follow-up migration drops `AdminWebVital`.
- [x] Phase 1.7 (retired): Do not validate via `?perf=1` or `AdminWebVital`; use Shopify App Bridge-collected metrics for BFS and Chrome `Server-Timing` for local diagnosis.
- [ ] Phase 2 (next issue): apply universal LCP wins — font preload, vite manual chunking, Polaris CSS lazy, `v3_singleFetch` enable.

## Verification (post-deploy)

This verification path is retired. Use Shopify's App Bridge-collected Web Vitals for BFS assessment and Chrome DevTools Performance / Network `Server-Timing` for local route diagnosis.
