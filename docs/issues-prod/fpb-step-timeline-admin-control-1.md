# Issue: Admin-Controlled Step Timeline Visibility for Full-Page Bundles

**Issue ID:** fpb-step-timeline-admin-control-1
**Status:** Completed
**Priority:** 🟡 Medium
**Created:** 2026-03-17
**Last Updated:** 2026-03-20 04:30

## Overview

Add "Show step timeline" checkbox to the Pricing Tiers section in the FPB configure page.
Appears only when ≥ 2 tiers are configured. Persisted in DB as nullable boolean.
Warning modal when steps + tiers conflict is configured simultaneously.

## Related Documentation
- docs/fpb-step-timeline-admin-control/00-BR.md
- docs/fpb-step-timeline-admin-control/02-PO-requirements.md
- docs/fpb-step-timeline-admin-control/03-architecture.md

## Phases Checklist

- [x] Phase 1: Tests (15 tests) ✅
- [x] Phase 2: DB + API + Widget + Admin UI + Handler ✅
- [x] Phase 3: Build + verify ✅

## Progress Log

### 2026-03-20 04:30 - Bug fixes: warning logic was one-directional and fired too many times

Two bugs found on review:

**Bug 1 — Warning fired on 3rd/4th tier addition (should only fire on 1→2 transition)**
`PricingTiersSection.addTier()` used `tiers.length + 1 >= 2` which is true for any tiers.length ≥ 1.
So after a merchant acknowledged the warning once, it would fire again on every subsequent tier add.
Fixed: changed to `tiers.length === 1` — only the 1→2 transition triggers the modal.

**Bug 2 — No warning when adding a 2nd step while tiers are already active**
The "Add New Tab" button called `stepsState.addStep()` directly with no conflict check.
A merchant could have 2 tiers configured, then add a 2nd step with zero warning.
Fixed: "Add New Tab" now checks `stepsState.steps.length === 1 && tierConfig.length >= 2`
and shows the same warning modal (with confirm callback) before proceeding.

Files: `PricingTiersSection.tsx`, `route.tsx`

### 2026-03-17 23:00 - All Phases Completed

- ✅ `prisma/schema.prisma` — added `showStepTimeline Boolean?` to Bundle model
- ✅ `prisma db push` — SIT DB updated (no migration due to existing drift)
- ✅ `api.bundle.$bundleId[.]json.tsx` — returns `showStepTimeline: bundle.showStepTimeline ?? null`
- ✅ `bundle-widget-full-page.js` — added `resolveShowStepTimeline()` helper; called in `init()` and `switchTier()` after `selectBundle()` (EC-1 fix)
- ✅ `handlers.server.ts` — parses `showStepTimeline` from formData; resets to null when < 2 tiers (EC-3 fix)
- ✅ `route.tsx` — `showStepTimeline` useState; formData append; warning modal; new props passed to PricingTiersSection
- ✅ `PricingTiersSection.tsx` — Checkbox shown when >= 2 tiers; warning triggered when adding 2nd tier with > 1 step
- ✅ WIDGET_VERSION bumped 1.7.0 → 1.7.1
- ✅ 15 new tests, 547 total passing, zero regressions
- ✅ Zero ESLint errors

**Files Modified:**
- `prisma/schema.prisma`
- `app/routes/api/api.bundle.$bundleId[.]json.tsx`
- `app/assets/bundle-widget-full-page.js`
- `app/assets/bundle-widget-full-page-bundled.js` (rebuilt)
- `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/handlers/handlers.server.ts`
- `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/route.tsx`
- `app/components/PricingTiersSection.tsx`
- `scripts/build-widget-bundles.js`

**Files Created:**
- `tests/unit/assets/fpb-show-step-timeline.test.ts`
- `docs/fpb-step-timeline-admin-control/` (BR, PO, Architecture)
- `docs/issues-prod/fpb-step-timeline-admin-control-1.md`
