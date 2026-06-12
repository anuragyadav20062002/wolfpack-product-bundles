# Issue: Remove PerfDebugOverlay (?perf=1 LCP overlay)
**Issue ID:** admin-lcp-overlay-removal-1
**Status:** Completed
**Priority:** 🟢 Low
**Created:** 2026-06-07
**Last Updated:** 2026-06-12

## Overview

The `?perf=1` debug overlay shipped in `admin-lcp-measurement-1` to give merchant-success a screenshot-able Web Vitals readout. The live overlay was distracting during the Phase 5/6 LCP work, so it was removed first. On 2026-06-12, the remaining custom `/api/web-vitals` telemetry path was also removed in favor of Shopify App Bridge-collected Web Vitals for Built for Shopify assessment.

## Progress Log

### 2026-06-07 22:43 - Plan + cleanup scope
- Confirmed `PerfDebugOverlay` is the sole caller of `subscribeLiveVitals` / `LiveVitalsSnapshot`.
- Deleting both the component and the live-vitals subscription helpers. Historical note: `reportWebVitals` + `getSessionId` were retained at this point, then removed on 2026-06-12 with the rest of the custom telemetry pipeline.
- Files: `app/components/PerfDebugOverlay.tsx` (delete), `app/routes/app/app.tsx` (unwire), `app/lib/web-vitals.client.ts` (trim).

## Related Documentation
- Predecessor issue: `docs/issues-prod/admin-lcp-measurement-1.md`
- Successors: `admin-lcp-phase5-recharts-lazy-1`, `admin-lcp-phase6-defer-skeletons-1`

### 2026-06-07 22:46 - Cleanup applied
- Deleted `app/components/PerfDebugOverlay.tsx`.
- Removed `useIsPerfOverlayEnabled` hook, import, and `<PerfDebugOverlay/>` mount from `app/routes/app/app.tsx`. Dropped the now-unused `useState` from the React import.
- Removed `subscribeLiveVitals`, `LiveVitalsSnapshot`, and the in-module `live` snapshot store from `app/lib/web-vitals.client.ts`. `reportWebVitals` + `getSessionId` retained — both still wired into the telemetry pipeline.
- Lint pass: 0 errors on the three edited files. Pre-existing warnings untouched.

### 2026-06-12 - Remaining custom telemetry retired
- Deleted `app/lib/web-vitals.client.ts` and `app/routes/api/api.web-vitals.tsx`.
- Removed `AdminWebVital` from Prisma and added a drop-table migration.
- Removed the `web-vitals` npm dependency.

## Phases Checklist
- [x] Delete `PerfDebugOverlay.tsx`
- [x] Unwire from `app/routes/app/app.tsx`
- [x] Trim `subscribeLiveVitals` + `LiveVitalsSnapshot` from `web-vitals.client.ts`
- [x] Lint pass on edited files
- [x] Commit
