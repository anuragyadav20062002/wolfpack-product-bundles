# Issue: UX Gap Fixes — Batch 1

**Issue ID:** ux-gap-fixes-batch1-1
**Status:** Completed
**Priority:** 🟡 Medium
**Created:** 2026-03-26
**Last Updated:** 2026-03-26 02:00

## Overview

Batch 1 of UX gap fixes from the 2026-03-26 UX gap analysis. Covers:
- GAP-11: Rename "Images & GIFs" tab to "Bundle Assets"
- GAP-23: Rename "Events" page to "Updates & FAQs"
- GAP-32: Fix back arrows on secondary pages (already resolved in code)
- GAP-02: Onboarding guide auto-hides when bundles exist; replaced with CartPropertyFixCard

## Phases Checklist
- [x] GAP-11: Rename tab label in both configure routes
- [x] GAP-23: Rename Events → Updates & FAQs in nav, page title, section header
- [x] GAP-32: Confirmed already resolved
- [x] GAP-02: Onboarding guide conditional render + fade-in animation

## Progress Log

### 2026-03-26 02:00 - Starting batch 1
- Files to modify: both configure route.tsx files, app.tsx nav, app.events.tsx, app.dashboard/route.tsx, dashboard.module.css

### 2026-03-26 02:00 - GAP-11 complete
- ✅ Renamed "Images & GIFs" → "Bundle Assets" in both PDP and FPB configure routes
- Files: `app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/route.tsx:253`, `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/route.tsx:261`

### 2026-03-26 02:30 - GAP-02 complete
- ✅ Dashboard left column: when `bundles.length === 0` → `BundleSetupInstructions`; when `bundles.length > 0` → `CartPropertyFixCard` (surfaced from Events page where it was buried)
- ✅ Added `fadeIn` CSS animation (0.25s ease, translateY 4px → 0) — whichever card renders, it fades in smoothly; no blank space ever shown
- ✅ Imported `CartPropertyFixContent` into dashboard route
- Files: `app/routes/app/app.dashboard/route.tsx`, `app/routes/app/app.dashboard/dashboard.module.css`

### 2026-03-26 02:00 - GAP-23 complete
- ✅ Nav label: "Events" → "Updates & FAQs" in `app/routes/app/app.tsx`
- ✅ Page title: "Events" → "Updates & FAQs" in `app/routes/app/app.events.tsx`
- ✅ Section header: "Latest Events" → "Latest Updates"

### 2026-03-26 02:00 - GAP-32 confirmed resolved
- Back arrows already have correct `backAction` on Analytics, Pricing, and Events pages

## Related Documentation
- `docs/ux-gap-analysis-2026-03-26.md`
