# Issue: PPB/FPB EB Parity Gaps — Live Card, Bundle Product Card, Tooltips, Readiness Overlay

**Issue ID:** ppb-eb-parity-gaps-2
**Status:** In Progress
**Priority:** 🔴 High
**Created:** 2026-05-19
**Last Updated:** 2026-05-19 15:00

## Overview

UI parity gaps identified:
1. **"Take your bundle live" card** — visual doesn't match EB (should be bold text + button with external link icon in gray row). Also missing from FPB.
2. **Bundle Product Card** — missing ⋮ ellipsis menu; "Edit Bundle" should open product page via App Bridge.
3. **Tooltips** — use s-button icon trigger pattern; rich tooltip should show placeholder image; PPB missing tooltips.
4. **Bundle Readiness Overlay** — collapsed/expanded state mismatch; item layout wrong; items not clickable; copy doesn't match EB.

## Progress Log

### 2026-05-19 15:00 - Bundle Readiness Overlay refactor

- **Collapsed state**: Compact pill — gauge + chevron only (no text)
- **Expanded state**: Gauge + "Readiness Score" / "Complete all steps..." text + reversed chevron
- **Item layout**: Title (bold black) → Description (gray) → "+N Points" (green bold); right-side chevron for clickable items
- **Clickability**: `onItemClick(key)` prop; clicking closes overlay and navigates to relevant section
- **Preview item**: Moved from component to route `readinessItems`; tracked via localStorage `wpb_preview_{bundleId}`
- **FPB items** (6, matching EB): App Embed Enabled, Minimum 3 Products Added, Set Up Discount, Preview Bundle, Set Up Bundle Visibility, Set Parent Product to Active
- **PPB items** (6, adapted): same except item 5 = Place Bundle Widget (upsellWidgetEnabled)
- ESLint: 0 errors

## Files Changed
- `app/components/bundle-configure/BundleReadinessOverlay.tsx`
- `app/components/bundle-configure/BundleReadinessOverlay.module.css`
- `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/route.tsx`
- `app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/route.tsx`

## Phases Checklist
- [x] Bundle Readiness Overlay: collapsed/expanded states, item layout, clickable items, EB-matching copy
- [ ] Gap 1: "Take your bundle live" card visual parity (PPB + FPB)
- [ ] Gap 2: Bundle Product Card ⋮ menu + Edit Bundle App Bridge flow
- [ ] Gap 3: Tooltip pattern + missing PPB tooltip placements
- [ ] E2E test in Chrome
