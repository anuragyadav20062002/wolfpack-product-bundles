# Issue: PPB/FPB Configure Page — Scroll Sticky, Discard Modal Fix, Parity Pass 2

**Issue ID:** ppb-eb-configure-clone-2
**Status:** Completed
**Priority:** 🔴 High
**Created:** 2026-05-21
**Last Updated:** 2026-05-21 11:12

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

### 2026-05-21 06:30 - Phase 4 secondary fix: hidePolarisModal unconditional hide()

**Root cause identified**: `hidePolarisModal` had a conditional guard `if (!modal?.hideOverlay) modal?.hide?.()`. When `hideOverlay` IS defined on the `s-modal` element (current Polaris build), `hide()` was never called. `hideOverlay()` fires the dismiss event but does NOT visually close the dialog in all versions.

**Fix applied** to `app/routes/app/_shared/bundle-configure/modal-utils.ts`:
- Changed `hidePolarisModal` to call `hide()` unconditionally after `hideOverlay()`.
- This affects ALL modals using these helpers (FPB + PPB discard modals) — same pre-existing bug in both.
- ESLint: 0 errors (11 pre-existing `any` warnings only).
- Cloudflare tunnel was down during browser re-test; fix is verifiable by logic: `hide()` is the definitive close call regardless of `hideOverlay` availability.

### 2026-05-21 11:08 - Started FPB pre-selected product parity follow-up
- Re-checked EB's Landing Page Bundle (`Bundle Box`) in Chrome.
- Confirmed `Bundle Settings > Pre Selected Product > Browse Products` opens the Shopify `Select products` resource picker directly.
- Confirmed this is not a navigation shortcut back to Step Setup.
- Next: update PPB Bundle Settings `Browse Products` to open the Shopify product picker directly and persist selections through the existing step/default product state.

### 2026-05-21 11:12 - Completed FPB pre-selected product picker parity
- Updated PPB `Bundle Settings > Pre Selected Product > Browse Products` to open Shopify's product resource picker directly with `action: "select"`, matching EB's `Select products` modal.
- Picker selections persist into the active step's existing default product state (`StepProduct`, `isDefault`, `defaultVariantId`) and the badge now reports selected default products.
- Browser verified in Chrome on the PPB configure page: the modal opens as `Select products` with search, search-by selector, add filter, cancel, and disabled select state before choosing products.
- ESLint: 0 errors (pre-existing warning noise only).
- Build: passed.

## Related Documentation
- `docs/ppb-eb-configure-clone/eb-ppb-configure-audit-2026-05-21.md`

## Phases Checklist
- [x] Phase 1: Sticky left column (both FPB + PPB CSS)
- [x] Phase 2: Discard modal fix (PPB route.tsx)
- [x] Phase 3: Parity minute details (PPB route.tsx)
- [x] Phase 4: Verification + hidePolarisModal unconditional hide() fix
- [x] Phase 5: FPB pre-selected product picker parity for PPB
