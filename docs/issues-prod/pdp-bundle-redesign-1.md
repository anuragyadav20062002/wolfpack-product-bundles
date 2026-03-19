# Issue: PDP Bundle Redesign

**Issue ID:** pdp-bundle-redesign-1
**Status:** Completed
**Priority:** 🔴 High
**Created:** 2026-03-18
**Last Updated:** 2026-03-19 01:00

## Overview

Full visual and behavioral redesign of the product-page bundle widget to match the reference design exactly. Includes: automated theme template installation, complete DCP wiring, free gift step support, default/compulsory product support, bottom-sheet modal redesign, and slot card redesign.

## Phases Checklist

- [x] Phase 1: Automated template install — new API route + "Add to Storefront" UI in configure page ✅
- [x] Phase 2: CSS — tab pills, gold product card border, button disabled, free gift & default badges ✅
- [x] Phase 3: JS — slot card redesign (empty + filled + default + free gift), renderProductPageLayout rewrite ✅
- [x] Phase 4: JS — free gift getters, modal tab styling, modal product card rendering, promo heading ✅
- [x] Phase 5: JS — Add Bundle to Cart button disabled state, product add button text update ✅
- [x] Phase 6: Version bump (1.8.2 → 1.9.0) + widget rebuild ✅
- [x] Phase 7: Lint + tests + commit ✅
- [x] Phase 8: Free gift ribbon → DCP-configurable badge (merchant can set custom PNG/SVG) ✅
- [x] Phase 9: Unify "Add to Storefront / Preview" into single smart button on configure page ✅
- [x] Cleanup: Remove dead `renderSelectedProductCards()` ✅

## Progress Log

### 2026-03-18 04:30 — Phases 1–7 Complete

**Phase 1 — Template auto-install:**
- ✅ `app/routes/api/api.install-pdp-widget.tsx` — new POST route calling `ensureProductBundleTemplate()`
- ✅ `route.tsx` — added `isInstallingWidget` state, `handleAddToStorefront` callback, `installFetcher` (separate fetcher)
- ✅ "Add to Storefront" Card section in left sidebar of configure page
- ✅ `tests/unit/routes/api.install-pdp-widget.test.ts` — 7 tests, all passing

**Phase 2 — CSS:**
- ✅ Tab pills: `border-radius: 40px` for regular tabs
- ✅ Free gift tab: `.bw-free-gift-tab` — dark navy, `border-radius: 8px`
- ✅ Product cards: gold border `2px solid rgb(255,202,67)`, border-radius uses DCP var
- ✅ Free gift product cards: gray border via `.bw-product-card--free-gift`
- ✅ Product card "Add to Cart" button: `border-radius: 40px` (pill)
- ✅ Add Bundle to Cart: `border-radius: 40px`, `padding: 14px 10px`, disabled → `opacity: 0.5`
- ✅ Product title color: uses `--bundle-product-title-color` (primary color)
- ✅ New: `.bw-slot-card__ribbon`, `.bw-slot-card--locked`, `.bw-slot-card__included-badge`
- ✅ New: `.bw-bs-free-gift-promo`, `.bw-bs-free-gift-heading`, `.bw-bs-free-gift-subheading`
- ✅ New: `.bw-slot-card__image-wrapper`, `.bw-slot-card--filled` flex layout
- ✅ `bundle-steps` grid uses `--step-cards-per-row` CSS var, 2-col mobile

**Phase 3-5 — JS (`bundle-widget-product-page.js`):**
- ✅ Added getters: `paidSteps`, `freeGiftStep`, `freeGiftStepIndex`, `defaultStepsList`, `isFreeGiftUnlocked`
- ✅ `_preloadDefaultStepProducts()` — pre-fetches product data for default steps before first render
- ✅ `_getDefaultStepProduct(stepIndex)` — looks up product by defaultVariantId
- ✅ Rewrote `renderProductPageLayout()` — handles all 4 card types in one pass (always shows all slots)
- ✅ Updated `createEmptyStateCard()` — 80×80px circular icon background
- ✅ Added `createDefaultProductCard(step, stepIndex, product)` — no remove, "Included" badge
- ✅ Added `_createDefaultLoadingCard(step, stepIndex)` — placeholder while loading
- ✅ Added `createFreeGiftSlotCard(step, stepIndex)` — ribbon, locked/unlocked states
- ✅ Added `_createRibbonSvg()` — red gift SVG overlay
- ✅ Updated `createSelectedProductCard()` — uses `bw-slot-card__image-wrapper` in bottom-sheet
- ✅ Updated `renderModalTabs()` — `bw-free-gift-tab` class, free gift accessibility check
- ✅ Updated `renderModalProducts()` — free gift promo heading injected above grid, `bw-product-card--free-gift` class
- ✅ Updated button text: "Add to Bundle" → "Add to Cart", "Added to Bundle" → "Selected ✓"
- ✅ Updated `updateAddToCartButton()` — free gift/default steps excluded from required validation
- ✅ Updated `addToCart()` — free gift/default steps optional
- ✅ Updated `buildCartItems()` — adds `_bundle_step_type` property for free gift and default steps

**Phase 6 — Version + Build:**
- ✅ WIDGET_VERSION 1.8.2 → 1.9.0
- ✅ `bundle-widget-product-page-bundled.js` rebuilt (153.9 KB)
- ✅ All CSS files under 100KB limit

**Phase 7 — Lint + Tests:**
- ✅ Zero ESLint errors on modified files
- ✅ 7 tests passing for `/api/install-pdp-widget`

**Files Modified:**
- `app/routes/api/api.install-pdp-widget.tsx` (created)
- `app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/route.tsx`
- `app/assets/bundle-widget-product-page.js`
- `extensions/bundle-builder/assets/bundle-widget.css`
- `extensions/bundle-builder/assets/bundle-widget-product-page-bundled.js` (rebuilt)
- `scripts/build-widget-bundles.js`
- `tests/unit/routes/api.install-pdp-widget.test.ts` (created)
- `docs/pdp-bundle-redesign/03-architecture.md` (created)
- `docs/issues-prod/pdp-bundle-redesign-1.md` (created)

Next: Commit + deploy

### 2026-03-19 01:00 — Phases 8, 9 + Cleanup Complete

**Phase 8 — DCP-configurable free gift badge:**
- ✅ `app/components/design-control-panel/types.ts` — added `freeGiftBadgeUrl?: string` to `DesignSettings`
- ✅ `app/routes/app/app.design-control-panel/handlers.server.ts` — added `freeGiftBadgeUrl` to `extractGeneralSettings()` (stored in existing `generalSettings` JSON column, no migration needed)
- ✅ `app/lib/css-generators/css-variables-generator.ts` — emits `--bundle-free-gift-badge-url` CSS variable (renders `url("…")` or `none`)
- ✅ `app/assets/bundle-widget-product-page.js` — `_createRibbonSvg()` reads `--bundle-free-gift-badge-url`; if set renders `<img>`, else renders default red SVG
- ✅ `app/components/design-control-panel/settings/WidgetStyleSettings.tsx` — URL text field added inside Bottom Sheet section

**Phase 9 — Smart "Add to Storefront / Preview" button:**
- ✅ Removed separate "Add to Storefront" Card from configure page sidebar
- ✅ Primary action button is now smart: initial state = `!!bundle.shopifyProductId` (existing bundles default to "Preview"), updates to "Preview" after install in-session
- ✅ After successful install, opens product page URL directly (no extra click needed)
- ✅ Button disabled when dirty + not yet installed (bundle must be saved first)

**Cleanup:**
- ✅ Removed dead `renderSelectedProductCards()` method (replaced by `renderProductPageLayout()`)

**Build:**
- ✅ Widget rebuilt: 152.6 KB (v1.9.0)
- ✅ Zero ESLint errors on modified files

### 2026-03-18 03:00 — Planning Complete

- ✅ BR written: `docs/pdp-bundle-redesign/00-BR.md`
- ✅ PO requirements: `docs/pdp-bundle-redesign/02-PO-requirements.md`
- ✅ Architecture: `docs/pdp-bundle-redesign/03-architecture.md`
- Key finding: `ensureProductBundleTemplate()` already called on bundle save — template auto-install is partially wired. Need dedicated API route + UI button.


## Related Documentation

- `docs/pdp-bundle-redesign/00-BR.md`
- `docs/pdp-bundle-redesign/02-PO-requirements.md`
- `docs/pdp-bundle-redesign/03-architecture.md`
- `docs/pdp-bundle-redesign/04-SDE-implementation.md`
