# Issue: FPB/PPB Parity Fixes Round 3 — Auto Next & Pending Badge Tooltip

**Issue ID:** eb-fpb-parity-clone-3
**Status:** In Progress
**Priority:** 🔴 High
**Created:** 2026-05-20
**Last Updated:** 2026-05-20

## Overview

Two targeted parity fixes based on Chrome DevTools E2E audit of EB:

1. **Auto Next checkbox** — EB shows "Auto Next When rule is met" only when exactly 1 rule exists per step. When Rule #2 is added, the checkbox disappears from both rules. WPB currently always shows the checkbox. Fix: conditionally render based on `ruleCount === 1`. Applies to both FPB and PPB routes.
2. **Bundle Visibility Pending badge tooltip** — EB renders the Pending badge area with a tooltip description: "Tracks whether your bundle is discoverable by shoppers. Optimises when you copy your bundle link and place it on your store, enable the Bundle Widget, or set up the Bundle Embed." Add a `QuestionHelpTooltip` alongside the Pending badge in the FPB nav (FPB-only — PPB has no Bundle Visibility section).

## Progress Log

### 2026-05-20 - E2E Chrome audit completed

- Verified Auto Next behavior in EB: with 1 rule, `uid=97_52 checkbox "Auto Next When rule is met"` present. After adding Rule #2 via "Add Rule", checkbox completely absent from a11y tree for both rules.
- Verified Pending badge tooltip: parent element has `description="Tracks whether your bundle is discoverable by shoppers..."`. Tooltip appears on hover.
- Files to modify: FPB `route.tsx`, PPB `route.tsx`, `app/constants/help-tooltips.ts`

## Files to Change

- `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/route.tsx`
- `app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/route.tsx`
- `app/constants/help-tooltips.ts` (add `bundleVisibilityPending` key)

## Progress Log

### 2026-05-20 - All changes implemented

- Added `bundleVisibilityPending` key to `HELP_TOOLTIPS` (no visual, no title — description-only tooltip)
- FPB route: Auto Next checkbox wrapped in `ruleCount === 1` guard; `QuestionHelpTooltip` added next to Pending badge with `stopPropagation` wrapper to prevent nav click
- PPB route: Auto Next checkbox wrapped in `ruleCount === 1` guard
- ESLint: 0 errors on modified files

## Phases Checklist

- [x] Add `bundleVisibilityPending` key to HELP_TOOLTIPS (no visual)
- [x] Conditionally render Auto Next checkbox in FPB route (ruleCount === 1)
- [x] Conditionally render Auto Next checkbox in PPB route (ruleCount === 1)
- [x] Add QuestionHelpTooltip to Pending badge in FPB nav
- [x] ESLint 0 errors
- [ ] E2E verify in Chrome
