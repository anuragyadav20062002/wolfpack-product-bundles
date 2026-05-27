# Issue: PPB/FPB EB Parity Gaps — Live Card, Bundle Product Card, Tooltips, Readiness Overlay

**Issue ID:** ppb-eb-parity-gaps-2
**Status:** In Progress
**Priority:** 🔴 High
**Created:** 2026-05-19
**Last Updated:** 2026-05-29 00:14 IST

## Overview

UI parity gaps identified:
1. **"Take your bundle live" card** — visual doesn't match EB (should be bold text + button with external link icon in gray row). Also missing from FPB.
2. **Bundle Product Card** — missing ⋮ ellipsis menu; "Edit Bundle" should open product page via App Bridge.
3. **Tooltips** — use s-button icon trigger pattern; rich tooltip should show placeholder image; PPB missing tooltips.
4. **Bundle Readiness Overlay** — collapsed/expanded state mismatch; item layout wrong; items not clickable; copy doesn't match EB.

## Progress Log

### 2026-05-19 16:30 - Gaps 1, 2, 3 implementation

- **Gap 1 — "Take your bundle live" card**: PPB updated from two-button layout to gray inner panel with bold "Place on theme" text + "Place Widget ↗" secondary button. Same card added to FPB left column (was missing entirely).
- **Gap 2 — Bundle Product Card ⋮ menu**: Both PPB and FPB: replaced "Sync Product" link button in card header with `⋮` icon button (`menu-horizontal`) toggling a state-based dropdown. Dropdown has "Replace Product" (calls `handleBundleProductSelect`) and "Sync Product" (calls `handleSyncProduct`). Backdrop div closes dropdown on outside click.
- **Gap 3 — Tooltips**: FPB `QuestionHelpTooltip` trigger updated from `?` span to `s-button variant="plain" icon="info"`. `HelpTooltipVisualBlock` simplified to render a gray placeholder rectangle (user to swap in real images). PPB: added `HELP_TOOLTIPS` import + `QuestionHelpTooltip` component; wired up Step Flow heading info button to the tooltip.
- ESLint: 0 errors on both route files

### 2026-05-28 16:30 IST - Bundle Readiness Overlay keyboard gate hardening
- Updated `BundleReadinessOverlay` to keep item and collapsed trigger interactions fully accessible:
  - Switched readiness items to `<button type="button">` with explicit click/keyboard activation (`Enter`/`Space`).
  - Added `role="button"`, `tabIndex`, and keyboard activation for the collapsed trigger.
  - Added label/aria support for readiness items.
  - Added button reset styles in `BundleReadinessOverlay.module.css` to keep the same visual treatment.
- This closes the interaction path gap for Gate item activation via keyboard while waiting on full Chrome E2E pass.

### 2026-05-28 16:45 IST - Add readiness overlay contract test
- Added `tests/unit/bundle-readiness-overlay-contract.test.ts` to lock keyboard/click contract coverage for:
  - item rows as buttons with `onClick` + `onKeyDown`
  - Enter/Space activation path
  - collapsed trigger role/tab/keyboard behavior

### 2026-05-28 16:55 IST - Collapsed trigger semantic cleanup
- Replaced collapsed readiness trigger wrapper with a semantic `<button type="button">`.
- Added button reset styling to keep existing visual treatment while improving native accessibility behavior.
- Updated overlay interaction contract test to reflect button-based trigger semantics.

### 2026-05-28 17:10 IST - Contract test assertion cleanup
- Removed brittle assertion patterns in readiness overlay contract test.
- Test now validates stable trigger semantics (`type`, `data-tour-target`, `aria-label`) without formatting-sensitive matching.

### 2026-05-28 18:05 IST - Bundle Product Card menu parity
- Restored FPB menu parity with PPB by adding **Replace Product** as the first action in the FPB menu dropdown.
- The menu now contains:
  - `Replace Product` → calls `handleBundleProductSelect()`
  - `Sync Product` → calls `handleSyncProduct()`
- Set **Replace Product** icon to `edit`, matching the PPB menu icon style.

### 2026-05-28 18:12 IST - PPB Edit Product fallback parity
- Aligned PPB bundle product **Edit Product** action with FPB/App Bridge behavior:
  - uses `shopify.navigate()` in normal/admin environments,
  - falls back to `window.open(adminProductUrl, "_blank")` on Cloudflare tunnel hosts where postMessage origin mismatches.

### 2026-05-28 04:57 IST - FPB preview handler crash fix
- Fixed `ReferenceError: Cannot access 'handlePreviewBundle' before initialization` in FPB configure route.
- Reordered `handleTemplatePreview` so it is declared after `handlePreviewBundle`.
- Validation: `npx eslint --max-warnings 9999 app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/route.tsx` returned warnings only, no errors.

### 2026-05-28 22:10 IST - FPB readiness admin open parity
- Aligned FPB readiness `product_active` path with PPB admin-tunnel behavior.
- Added shared `openProductInAdmin` helper with fallback:
  - `window.open(..., "_blank")` for `trycloudflare.com` hosts.
  - `shopify.navigate(...)` for normal Admin contexts.
- Wired `product_active` readiness action to use the helper.

### 2026-05-28 22:22 IST - FPB Edit Product direct-link parity
- Reused the new FPB `openProductInAdmin` helper inside the product card `Edit Product` action.
- Removed duplicated inline admin URL / tunnel check in that handler.

### 2026-05-28 23:20 IST - PPB/FPB selected-product modal admin-open parity
- Replaced direct admin URL `open(productUrl, '_blank')` usage in selected-products modals with `openProductInAdmin`.
- This keeps all product admin navigation in both routes behind the same tunnel-safe helper path.

### 2026-05-29 00:02 IST - PPB legacy card admin-link cleanup
- Updated PPB `BundleProductCard` fallback component to stop hardcoding admin URLs.
- `BundleProductCard` now uses a supplied product-open callback and disables the button when absent.
- Kept helper-driven admin navigation pattern for the live configure paths.

### 2026-05-29 00:14 IST - PPB type cleanup for admin-open callback path
- Removed stale `shop` prop from `BundleProductCardProps` since card admin navigation is now callback-driven.
- Keeps the card contract aligned with helper-based admin navigation only.

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
- `app/styles/routes/full-page-bundle-configure.module.css`
- `app/styles/routes/product-page-bundle-configure.module.css`

## Phases Checklist
- [x] Bundle Readiness Overlay: collapsed/expanded states, item layout, clickable items, EB-matching copy
- [x] Gap 1: "Take your bundle live" card visual parity (PPB + FPB)
- [x] Gap 2: Bundle Product Card ⋮ menu (Replace Product / Sync Product)
- [x] Gap 3: Tooltip trigger → s-button icon="info"; placeholder visual; PPB Step Flow wired up
- [x] Readiness Overlay: clickable + keyboard-activatable items and trigger
- [ ] E2E test in Chrome
