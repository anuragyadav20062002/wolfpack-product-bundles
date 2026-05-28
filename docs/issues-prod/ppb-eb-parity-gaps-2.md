# Issue: PPB/FPB EB Parity Gaps — Live Card, Bundle Product Card, Tooltips, Readiness Overlay

**Issue ID:** ppb-eb-parity-gaps-2
**Status:** In Progress
**Priority:** 🔴 High
**Created:** 2026-05-19
**Last Updated:** 2026-05-29 23:55 IST

## Overview

UI parity gaps identified:
1. **"Take your bundle live" card** — visual doesn't match EB (should be bold text + button with external link icon in gray row). Also missing from FPB.
2. **Bundle Product Card** — missing ⋮ ellipsis menu; "Edit Bundle" should open product page via App Bridge.
3. **Tooltips** — use s-button icon trigger pattern; rich tooltip should show placeholder image; PPB missing tooltips.
4. **Bundle Readiness Overlay** — collapsed/expanded state mismatch; item layout wrong; items not clickable; copy doesn't match EB.

## Progress Log

### 2026-05-29 23:55 IST - FPB preset workflow and storefront template parity pass
- Started a concrete implementation-feedback pass focused on FPB/PPB template parity and design-panel workflow consistency.
- Confirmed select-template modal wiring already points to `?modal=<bundle>&section=globalColors` in both PPB and FPB, keeping the “Customize Colors & Language” entry path consistent with prior EB capture.
- Next: wire explicit preset selectors for FPB variants in full-page storefront CSS so `CLASSIC` and `COMPACT` have deterministic runtime styling paths and are no longer fallback-only.

### 2026-05-28 18:40 IST - PPB discount rule labels/validation parity in configure/create
- Applied EB-aligned discount rule field polish for both Create and PPB Configure pages:
  - Standardized non-BXY/BXY rule labels and `Rule #N` header rendering in Create flow.
  - Added percentage validation ceiling (`max=100`) and currency/percentage adornments for discount value fields where applicable.
  - Added amount-context help text and prefix/suffix consistency for condition/value inputs.
- Updated file(s):
  - `app/routes/app/app.bundles.create_.configure.$bundleId/route.tsx`
  - `app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/route.tsx` (alignment pass remains unchanged for validation behavior already present)

### 2026-05-29 19:10 IST - PPB/FPB discount BXY value validation parity
- Added remaining BXY discount-value validation parity in both PPB and FPB configure routes.
- `Discount value` now adapts to selected discount mode:
  - `%` suffix + `max="100"` when `% off`
  - `₹` prefix when `₹ off`
- Updated file(s):
  - `app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/route.tsx`
  - `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/route.tsx`

### 2026-05-29 19:20 IST - Create flow BXY discount-value validation parity
- Added the same BXY `Discount value` validation behavior in create flow.
- `Discount value` now caps at `100` for `% off`, and keeps `₹` prefix for fixed-amount mode.
- Updated file:
  - `app/routes/app/app.bundles.create_.configure.$bundleId/route.tsx`

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

### 2026-05-28 05:14 IST - Readiness gate product source fix
- Fixed readiness gate product detection in PPB/FPB configure routes.
- `hasProducts` now counts both legacy `StepProduct` and `StepCategory[].products` so "Minimum 3 Products Added" can complete for category-based setup.
- This aligns gate behavior with current EB-style category flow and removes false incomplete states after category migration.

### 2026-05-28 23:42 IST - FPB Discount Rules row parity (gray rule card)
- Repaired Full Page configure Discount & Pricing BXY layout to match PPB EB parity shape:
  - Added FPB `bxyRuleBody` wrapper inside rule cards.
  - Added FPB `bxyRewardGrid` wrapper for the 3 reward controls (Discount value / Discount type / Apply Discount to).
  - Added matching FPB CSS declarations (`bxyRuleBody`, `bxyRewardGrid`), so the Discount Rules gray box aligns with EB-style row spacing.
  - Updated files:
    - `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/route.tsx`
    - `app/styles/routes/full-page-bundle-configure.module.css`

### 2026-05-28 01:12 IST - PPB discount type header consistency pass
- Confirmed all non-BXY and BXY Discount Rule branches in PPB are present and match the confirmed EB control matrix.
- Normalized PPB discount rule row title to `<h4>` so `Rule #N` header structure now matches FPB and reduces layout drift across all discount types.
- Updated file:
  - `app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/route.tsx`

### 2026-05-28 01:18 IST - Create flow discount-type reset parity
- Fixed create-flow discount type switch to preserve a single default rule for the new type (instead of clearing rules).
- Aligned BXY label language and non-BXY action/button text to the EB-confirmed structure in create flow:
  - Keep rule label text consistent (`The lowest priced items` / `The latest added items`).
  - Use `% off` + `₹ off` options.
  - Use `Discount on` + `is greater than or equal to` wording and `Percentage Off` / `Fixed Amount Off` value labels.
- Updated file:
  - `app/routes/app/app.bundles.create_.configure.$bundleId/route.tsx`

### 2026-05-29 10:08 IST - PPB configure content centering
- Fixed left-heavy PPB configure page layout to match FPB centered flow.
- Updated `app/styles/routes/product-page-bundle-configure.module.css`:
  - `.editCanvas` now uses `max-width: 950px`, `margin: 0 auto`, and `padding: 0 0 88px`.
  - This removes the previous left offset and aligns the PPB configure content to a centered canvas.

### 2026-05-29 23:10 IST - Template customization parity workflow (PPB + FPB)
- Updated both configure template selectors to use the EB-confirmed storefront preset sets and modal workflow:
  - PPB uses Product Page preset labels/ids already confirmed in `productPageTemplateOptions`.
  - FPB now uses a shared `fullPageTemplateOptions` list to avoid inline duplication.
  - Both "Customize Colors & Language" buttons now open design-control-panel in modal mode:
    - PPB: `/app/design-control-panel?modal=product_page`
    - FPB: `/app/design-control-panel?modal=full_page`
- Updated files:
  - `app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/route.tsx`
  - `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/route.tsx`

### 2026-05-29 23:25 IST - PPB storefront template mode parity groundwork
- Added robust PPB preset resolution so storefront always derives a concrete `bundleDesignTemplateData.templateId` fallback (`PDP_MODAL` → `MODAL`, PDP_INPAGE → `CASCADE`) when older/bare bundles are loaded.
- Added preset-specific `bundle-widget.css` rules for PPB storefront rendering:
  - `PDP_INPAGE + COGNIVE`: grid density + text/image alignment tweaks for EB-style Product Grid behavior.
  - `PDP_MODAL + SIMPLIFIED`: single-column compact slot layout and smaller slot card treatment for Vertical Slots parity.
- This closes the gap where only PDP_MODAL-specific CSS was wired while all four PPB presets were expected to be surfaced in storefront.
- Updated files:
  - `app/assets/bundle-widget-product-page.js`
  - `app/assets/widgets/product-page-css/bundle-widget.css`

### 2026-05-28 23:58 IST - PPB/WPB storefront template completion pass
- Started a concrete implementation-feedback loop for all storefront templates and the shared design-control customization workflow.
- Reworked PPB preset handling in widget runtime so the selected preset is normalized and consistently surfaced on both the root and steps containers.
- Added explicit PPB render hooks for `COGNIVE`/`SIMPLIFIED` DOM hooks and expanded CSS overrides to implement those preset deltas (product-list grid/list adjustments, simplified modal slot stacking, compact row cards).
- Normalized WPB full-page preset reads to uppercase-safe values so CLASSIC/COMPACT/DEFAULT/HORIZONTAL selectors can all be consumed consistently by template-specific CSS.
- Updated files:
  - `app/assets/bundle-widget-product-page.js`
  - `app/assets/widgets/product-page-css/bundle-widget.css`
  - `app/assets/bundle-widget-full-page.js`

### 2026-05-29 20:45 IST - PPB/WPB storefront template and customization parity follow-up
- Completed a second-pass hardening of template hooks and runtime selectors for parity parity pass:
  - PPB: added dedicated in-page COGNIVE section+grid render path and selectors.
  - PPB: added dedicated modal `SIMPLIFIED` section/grid hooks for single-column, compact row card layout.
  - FPB/Full-page: normalized preset IDs before marker application and moved template/preset marker write ahead of first render.
- Confirmed both template customization buttons still target global-colors section via admin config modal URLs.
- Updated files:
  - `app/assets/bundle-widget-product-page.js`
  - `app/assets/widgets/product-page-css/bundle-widget.css`
  - `app/assets/bundle-widget-full-page.js`

### 2026-05-28 05:29 IST - Template button deep-links into DCP customization section
- Added section targeting to both template modal customization links so they land directly in the global customization surface:
  - PPB: `/app/design-control-panel?modal=product_page&section=globalColors`
  - FPB: `/app/design-control-panel?modal=full_page&section=globalColors`
- This aligns the "Customize Colors & Language" workflow closer to EB's section-level entry pattern and removes one extra click for merchants.
- Updated files:
  - `app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/route.tsx`
  - `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/route.tsx`

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
- [x] Select Template modal: EB preset display and design customization workflow opens DCP in modal mode
- [ ] E2E test in Chrome
