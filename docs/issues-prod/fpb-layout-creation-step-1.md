# Issue: Move FPB Layout Selection to Creation Step

**Issue ID:** fpb-layout-creation-step-1
**Status:** Completed
**Priority:** 🟡 Medium
**Created:** 2026-04-03
**Last Updated:** 2026-04-03 11:00

## Overview
Move the full-page bundle footer layout selection (Floating Cart Card vs Sidebar Panel) from the FPB configure page left sidebar into the Create Bundle modal. The picker appears conditionally when Full Page bundle type is selected.

## Related Documentation
- `docs/fpb-layout-creation-step/00-BR.md`
- `docs/fpb-layout-creation-step/02-PO-requirements.md`
- `docs/fpb-layout-creation-step/03-architecture.md`

## Progress Log

### 2026-04-03 00:00 — Starting Implementation
- Files to modify:
  1. `app/routes/app/app.dashboard/route.tsx` — add layout picker UI + state
  2. `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/route.tsx` — remove layout Card
- No server-side changes needed (handler already reads fullPageLayout from formData)

### 2026-04-03 10:00 — Completed Implementation
- ✅ Added `fullPageLayout` state to `useDashboardState` hook (default: `footer_bottom`)
- ✅ Reset `fullPageLayout` to default in `closeCreateModal`
- ✅ Added `InlineGrid` import to dashboard route
- ✅ Added SVG layout picker UI in Create Bundle modal (conditional on Full Page type)
  - Two cards side-by-side: Floating Cart Card + Sidebar Panel
  - Selected state: blue border + surface-selected background
  - Matches existing type-selection card interaction pattern
- ✅ Added hidden `<input name="fullPageLayout">` to form (only when Full Page selected)
- ✅ Removed layout Card block (lines 1516–1623) from FPB configure page
- ✅ Lint: 0 errors on all 3 modified files
- ✅ Build: passes

### 2026-04-03 11:00 — Compact layout picker to avoid modal scroll
- ✅ SVG dimensions reduced from 140×96 to 100×68 (viewBox unchanged, scales correctly)
- ✅ Card padding reduced from 16px 12px to 8px
- ✅ Inner BlockStack gap reduced from 200 to 100
- ✅ Outer BlockStack gap reduced from 300 to 200
- ✅ InlineGrid gap reduced from 300 to 200
- ✅ Removed subtitle description lines under each card
- ✅ Label font changed from bodyMd to bodySm
- ✅ Lint: 0 errors

## Phases Checklist
- [x] Add fullPageLayout state + hidden input to dashboard modal
- [x] Add SVG layout picker UI (conditional on Full Page type selected)
- [x] Reset fullPageLayout on modal close
- [x] Remove layout Card from FPB configure page (lines 1516–1623)
- [x] Lint modified files
- [x] Build check
- [x] Commit
