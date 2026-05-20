# Issue: PPB/FPB Configure Page — Scroll Sticky, Discard Modal Fix, Parity Pass 2

**Issue ID:** ppb-eb-configure-clone-2
**Status:** In Progress
**Priority:** 🔴 High
**Created:** 2026-05-21
**Last Updated:** 2026-05-21 06:00

## Overview
Follow-up fixes from ppb-eb-configure-clone-1:
1. Sticky left column on scroll for both FPB and PPB configure pages (matches EB behaviour)
2. Discard modal defect — Discard Changes button non-functional after clicking; nothing in modal responds
3. Second parity pass — minute copy/structure gaps found after first implementation

## Progress Log

### 2026-05-21 04:45 - Identified all issues
- **Sticky left column**: Both CSS modules have `flex: 0 0 274px` with no `position: sticky`. Fix: add `position: sticky; top: 0; max-height: 100vh; overflow-y: auto;` to `.leftColumn`.
- **Discard modal**: PPB uses imperative `.show()`/`.hide()` calls on s-modal instead of the `showPolarisModal`/`hidePolarisModal` helpers that FPB uses. When `handleDiscard()` triggers many state resets, the modal lifecycle is interrupted and buttons stop responding. Fix: replace with `showPolarisModal`/`hidePolarisModal` (already imported at line 58-59).
- **Parity gaps**: Missing Discount & Pricing tip banner, missing "Discount Display Options" heading, Bundle Visibility badge counts widget enabled (EB only requires app embed), missing "Info Complete" badge on Bundle Product card.

### 2026-05-21 06:00 - Implemented Phase 1, 2, and 3

**Phase 1 — Sticky left column:**
- `app/styles/routes/product-page-bundle-configure.module.css`: Added `position: sticky; top: 0; max-height: 100vh; overflow-y: auto; align-self: flex-start;` to `.leftColumn`
- `app/styles/routes/full-page-bundle-configure.module.css`: Same sticky fix applied

**Phase 2 — Discard modal fix:**
- `app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/route.tsx`: Replaced imperative `.show()`/`.hide()` calls with `showPolarisModal(discardModalRef)` / `hidePolarisModal(discardModalRef)` inside the `useEffect` that watches `showDiscardModal` state

**Phase 3 — Parity minute details (PPB route.tsx):**
- Discount & Pricing: Changed copy "Set up to 4 discount rules..." → "Set up discount rules..." (matches EB)
- Added tip banner (s-banner tone="info") immediately after the copy with EB-matching discount tip text
- Added "Discount Display Options" heading (h3 + subtitle paragraph) before Bundle Quantity Options section
- Bundle Visibility badge: Fixed condition from `!appEmbedEnabled || !upsellWidgetEnabled` → `!appEmbedEnabled` (EB only requires app embed)
- Bundle Product card: Added "Info Complete" s-badge (tone="success") alongside existing status badge, shown when `productTitle` is truthy — matches EB's two-badge layout

- ESLint: 0 new errors (CSS parse errors are expected, TS file has pre-existing warnings only)
- Build: passed — no new errors

## Related Documentation
- `docs/ppb-eb-configure-clone/eb-ppb-configure-audit-2026-05-21.md`

## Phases Checklist
- [x] Phase 1: Sticky left column (both FPB + PPB CSS)
- [x] Phase 2: Discard modal fix (PPB route.tsx)
- [x] Phase 3: Parity minute details (PPB route.tsx)
- [ ] Phase 4: Verification
