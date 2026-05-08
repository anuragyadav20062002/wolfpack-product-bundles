# Issue: Guided Tour Gap Fixes (Competitor Parity)

**Issue ID:** guided-tour-improvements-1
**Status:** Completed
**Priority:** 🟡 Medium
**Created:** 2026-05-08
**Last Updated:** 2026-05-08 09:30

## Overview

Competitive analysis against EB | Easy Bundle Builder revealed four gaps in our guided tour:
1. **Trigger condition** — our tour fires per-bundle (localStorage key includes bundleId); should fire once per shop on first-ever bundle creation.
2. **Spotlight cutout** — we use a full-dim backdrop + raised element; competitor uses an SVG spotlight cutout that shows the target clearly.
3. **Tooltip positioning** — our tooltip is fixed at bottom-center; competitor anchors the tooltip near the highlighted element.
4. **Top-level dismiss** — competitor has a "Dismiss guided tour" link at the top of the card; we only have a bottom "Dismiss" button.

## Progress Log

### 2026-05-08 09:00 - Starting implementation
- Captured live screenshots of all 4 steps of our tour and all 5 steps of competitor tour
- Written comparison doc at `docs/guided-tour-comparison.md`
- Files to modify:
  - `app/components/bundle-configure/BundleGuidedTour.tsx`
  - `app/components/bundle-configure/BundleGuidedTour.module.css`
- Expected outcome: tour fires once per shop, shows spotlight cutout, tooltip anchors near target, has top-level dismiss

### 2026-05-08 09:30 - Completed all phases
- ✅ Storage key changed from `wpb_tour_seen_${shop}_${bundleId}` to `wpb_first_bundle_tour_seen_${shop}` — fires once per shop only
- ✅ `bundleId` prop removed from component interface and call site in route.tsx
- ✅ SVG spotlight backdrop with `<mask>` cutout over target element; falls back to full-dim overlay for steps with no targetSection
- ✅ Tooltip anchors near highlighted element (below if space permits, above otherwise); falls back to fixed bottom-center for targetSection-less steps
- ✅ Position recalculated immediately + again after 350ms to settle post-scroll
- ✅ "Dismiss guided tour" text link added at top-right of card
- ✅ Comparison doc written: `docs/guided-tour-comparison.md`
- Files changed: BundleGuidedTour.tsx, BundleGuidedTour.module.css, route.tsx (bundleId prop removed)

## Phases Checklist
- [x] Phase 1: Capture screenshots and write comparison doc
- [x] Phase 2: Fix trigger condition (shop-level localStorage key)
- [x] Phase 3: Add top-level "Dismiss guided tour" link
- [x] Phase 4: SVG spotlight cutout backdrop
- [x] Phase 5: Anchor tooltip near highlighted element
