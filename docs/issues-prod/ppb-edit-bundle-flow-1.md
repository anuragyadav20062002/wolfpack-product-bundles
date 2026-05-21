# Issue: PPB Edit Bundle Flow — EB Parity

**Issue ID:** ppb-edit-bundle-flow-1
**Status:** Completed
**Priority:** 🔴 High
**Created:** 2026-05-16
**Last Updated:** 2026-05-16 07:30

## Overview

Bring the Product Page Bundle (PPB) configure route to full Easy Bundles (EB) parity. Adds 2 new sidebar sections, expands 3 existing sections, reorders the sidebar nav, and extends the PPB widget with new storefront rendering.

**Requirements:** `docs/ppb-edit-bundle-flow/01-requirements.md`
**Architecture:** `docs/ppb-edit-bundle-flow/02-architecture.md`

## Phases Checklist

- [x] Phase 1: Schema + types + discount mapper (atomic)
- [x] Phase 2: Server handler extensions (3 parse helpers + Prisma extensions)
- [x] Phase 3: Nav reorder + Bundle Visibility section (FR-04, FR-06)
- [x] Phase 4: Free Gift & Add Ons section + step-mode control (FR-01)
- [x] Phase 5: Gift Messages in Messages section (FR-02)
- [x] Phase 6: Discount & Pricing expansions — Buy X Get Y + Qty Options + Progress Bar (FR-03)
- [x] Phase 7: Bundle Settings expansion — 8 new sub-sections (FR-05)
- [x] Phase 8: Readiness indicator in sidebar (FR-07)
- [x] Phase 9: Widget extensions — addon steps, gift message UI, qty pills, progress bar
- [x] Phase 10: Nav map update + issue close-out

## Related Documentation

- `docs/ppb-edit-bundle-flow/01-requirements.md`
- `docs/ppb-edit-bundle-flow/02-architecture.md`
- `docs/addon-upsell-step/01-requirements.md`
- `docs/competitor-analysis/14-eb-addon-upsell-analysis.md`

## Files in Scope

- `prisma/schema.prisma`
- `app/types/pricing.ts`
- `app/utils/discount-mappers.ts`
- `app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/route.tsx`
- `app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/handlers/handlers.server.ts`
- `app/assets/bundle-widget-product-page.js`
- `scripts/build-widget-bundles.js`
- `docs/app-nav-map/APP_NAVIGATION_MAP.md`

## Progress Log

### 2026-05-16 00:00 - Issue Created, Planning Complete
- ✅ Requirements written: `docs/ppb-edit-bundle-flow/01-requirements.md`
- ✅ Architecture written: `docs/ppb-edit-bundle-flow/02-architecture.md`
- ✅ Impact analysis complete — BundleStep addon fields already in schema (no migration needed for FR-01)
- ✅ Key discovery: `BundlePricing.displayOptions` column is net-new (Json?) — must be in Phase 1 migration
- ✅ Key discovery: `BUY_X_GET_Y` must land atomically in both TypeScript enum and Prisma enum
- ✅ Key discovery: `app/lib/pricing-display-options.ts` already implements `serializePricingDisplayOptions` — reuse in handler
- Next: Phase 1 — Schema + types

### 2026-05-16 00:01 - Phase 1: Schema + Types — Started
- ⏳ Adding 19 Bundle fields, BundlePricing.displayOptions, buy_x_get_y enum
- Will modify: `prisma/schema.prisma`, `app/types/pricing.ts`, `app/utils/discount-mappers.ts`

### 2026-05-16 00:02 - Phase 1: Schema + Types — Completed
- ✅ `prisma/schema.prisma`: Added `buy_x_get_y` to `DiscountMethodType` enum
- ✅ `prisma/schema.prisma`: Added 19 new Bundle fields (gift messages, bundle visibility, bundle settings)
- ✅ `prisma/schema.prisma`: Added `displayOptions Json?` to `BundlePricing`
- ✅ `app/types/pricing.ts`: Added `BUY_X_GET_Y` to `DiscountMethod` enum
- ✅ `app/types/pricing.ts`: Added `buyStepId?`, `getStepId?`, `getQty?` to `PricingRule`
- ✅ `app/types/pricing.ts`: Added `BUY_X_GET_Y` to `getDiscountMethodText` map
- ✅ `app/utils/discount-mappers.ts`: Added `buy_x_get_y` case to `mapDiscountMethod`
- ✅ Migration applied: `20260515211833_ppb_edit_bundle_flow` — zero data loss
- ✅ Lint: 0 errors on modified files
- Next: Phase 2 — Server handler extensions

### 2026-05-16 00:03 - Phase 2: Server Handler Extensions — Completed
- ✅ Tests written first (TDD Red): `ppb-gift-messages.test.ts`, `ppb-bundle-visibility.test.ts`, `ppb-bundle-settings.test.ts`, `discount-mappers.test.ts` — 36 tests
- ✅ Created `handlers/parsers.ts` with `parsePPBGiftMessages`, `parsePPBBundleVisibility`, `parsePPBBundleSettings`
- ✅ `handlers.server.ts`: added parsers import, spread all 3 helpers into `db.bundle.update` data block
- ✅ `handlers.server.ts`: extended `BundlePricing` upsert (create + update) with `displayOptions`
- ✅ All 36 tests green, 0 lint errors
- Next: Phase 3 — Nav reorder + Bundle Visibility section

### 2026-05-16 01:00 - Phase 3: Nav Reorder + Bundle Visibility — Completed
- ✅ `route.tsx` (line 239): Replaced `bundleSetupItems` array with new 7-item ordered nav (step_setup → free_gift_add_ons → messages → discount_pricing → bundle_visibility → images_gifs → bundle_settings)
- ✅ `route.tsx` (line 472): Added 4 Bundle Visibility state vars: `upsellWidgetEnabled`, `upsellWidgetDisplayMode`, `upsellWidgetDisplayOn`, `autoSelectBrowsedProduct`
- ✅ `route.tsx` (line 523): Extended `handleSave` to append all 4 Bundle Visibility fields to FormData
- ✅ `route.tsx` (line ~2178): Inserted `bundle_visibility` JSX section with 4 sub-sections: App Embed Status (inline AppEmbedBanner), Publishing Best Practices 2×2 card grid, Your Bundle Link (copy + preview), Bundle Widget (toggle + Display Mode + Display On + Auto-Select)
- ✅ Lint: 0 errors on modified files
- Next: Phase 4 — Free Gift & Add Ons section + step-mode control

### 2026-05-16 01:30 - Phase 4: Free Gift & Add Ons Section — Completed
- ✅ `route.tsx` (line ~2518): Inserted `free_gift_add_ons` JSX section block using IIFE pattern (matches `messages` section convention)
- ✅ Filters `stepsState.steps` for `isFreeGift === true` to show only addon steps
- ✅ Empty state with CTA: "Go to Step Setup" button navigates to `step_setup` section via `setActiveSection`
- ✅ Per-step cards render: addonLabel, addonTitle, addonDisplayFree checkbox, addonUnlockAfterCompletion checkbox — all wired to `stepsState.updateStepField` (same state as Step Setup)
- ✅ Lint: 0 errors
- Next: Phase 5 — Gift Messages in Messages section

### 2026-05-16 02:00 - Phase 5: Gift Messages in Messages Section — Completed
- ✅ `route.tsx` (line ~476): Added 8 gift message state vars (giftMessagesEnabled, giftMessageProductId, giftMessageProductTitle, giftMessageEnableSenderRecipient, giftMessageMandatory, giftMessageEnableLimit, giftMessageCharLimit, giftMessageSendEmail)
- ✅ `route.tsx` (handleSave): Appended all 8 gift message fields to FormData
- ✅ `route.tsx` (Messages section): Added Gift Messages `s-section` with toggle, gift product picker (shopify.resourcePicker), sender/recipient checkbox, mandatory checkbox, send-email checkbox, character limit switch + number field
- ✅ Lint: 0 errors
- Next: Phase 6 — Discount & Pricing expansions

### 2026-05-16 02:45 - Phase 6: Discount & Pricing Expansions — Completed
- ✅ `app/constants/bundle.ts`: Added `BUY_X_GET_Y` to `DISCOUNT_METHOD_OPTIONS`
- ✅ `route.tsx` (state block): Added 8 displayOptions state vars (qtyOptionsEnabled, qtyOptionsDefaultRuleId, qtyRuleLabels, qtyRuleSubtexts, progressBarEnabled, progressBarType, progressBarProgressText, progressBarSuccessText) — initialized from `bundle.bundlePricing.displayOptions`
- ✅ `route.tsx` (handleSave): Extended `discountData` payload with `displayOptions` object (bundleQuantityOptions + progressBar)
- ✅ `route.tsx` (discount section): Added Buy X Get Y rule builder (buyStepId, getStepId, getQty) — shown only when discountType === BUY_X_GET_Y; generic rules block conditionally hidden
- ✅ `route.tsx` (discount section): Added "Bundle Quantity Options" s-section with toggle + per-rule label/subtext + defaultRuleId selector
- ✅ `route.tsx` (discount section): Added "Discount Progress Bar" s-section with toggle + style select + progressText + successText
- ✅ Lint: 0 errors
- Next: Phase 7 — Bundle Settings expansion

### 2026-05-16 03:30 - Phase 7: Bundle Settings Expansion — Completed
- ✅ `route.tsx` (state block): Added 11 Bundle Settings state vars (preSelectedProductVariantId, maxQtyPerProduct, productSlotsEnabled, productSlotIconUrl, variantSelectorEnabled, showTextOnAddButton, bundleCartTitle, bundleCartSubtitle, bundleBannerDesktopUrl, bundleBannerMobileUrl, bundleLevelCss)
- ✅ `route.tsx` (handleSave): Appended all 11 Bundle Settings fields to FormData
- ✅ `route.tsx` (bundle_settings section): Added 8 new s-section blocks: Pre-selected Variant, Product Quantity Limits, Product Slots (+ icon URL), Variant Selector toggle, Add-to-Bundle Button, Cart Line Labels (title + subtitle), Bundle Banners (desktop + mobile), Custom CSS (textarea)
- ✅ Lint: 0 errors
- Next: Phase 8 — Readiness indicator in sidebar

### 2026-05-16 04:00 - Phase 8: Readiness Indicator — Completed
- ✅ `route.tsx` (sidebar, line ~1485): Inserted readiness indicator IIFE block between nav buttons and BundleProductCard
- ✅ 5 checks: steps configured, bundle product linked, discount set up, widget enabled, app embed active
- ✅ Badge shows done/total count with success (green) or attention tone
- ✅ Each row shows check/x icon with label — reacts live to state changes
- ✅ Lint: 0 errors
- Next: Chrome UI review vs EB parity

### 2026-05-16 05:00 - Chrome UI Review vs EB — Completed, Gaps Fixed
- ✅ Compared PPB configure page section-by-section against EB (side-by-side Chrome screenshots)
- ✅ Gap 1: Removed "Bundle Assets" nav item — EB has no such section (6 items now matches EB)
- ✅ Gap 2: Fixed nav icons — replaced invalid `name="*-minor"` with valid `type` attr (`note`, `view`, `edit`); Free Gift & Add Ons, Messages, Discount & Pricing have no icon (matches EB)
- ✅ Gap 3: Added "Pending" orange badge to Bundle Visibility nav item when `upsellWidgetEnabled === false`
- ✅ Gap 4: Replaced sidebar readiness checklist with floating circular SVG gauge (position: fixed, bottom-left) — matches EB's circular readiness score widget
- ✅ `route.tsx`: `bundleSetupItems` updated, `readinessExpanded` state added, nav rendering updated, old sidebar IIFE removed, floating gauge added at end of JSX
- ✅ Lint: 0 errors on modified file
- ✅ Chrome verified: all 6 sections render correctly, gauge visible at 60, Pending badge visible
- Next: Phase 9 — Widget extensions

### 2026-05-16 07:00 - Phase 9: Widget Extensions — Completed
- ✅ Part A: Metafield sync
  - `types.ts`: Added 8 gift message fields to `BundleUiConfig` (giftMessagesEnabled + 7 config fields)
  - `types.ts`: Added `displayOptions?: any | null` to `BundleUiMessaging`
  - `bundle-product.server.ts`: Added all 8 gift message fields to `bundleUiConfig` (from Bundle Prisma model)
  - `bundle-product.server.ts`: Fixed `displayOptions` path — was reading `pricing?.messages?.displayOptions` (wrong for PPB); now reads `pricing?.displayOptions` first (correct PPB column), falling back to FPB legacy path
- ✅ Part B: Widget JS (`bundle-widget-product-page.js`)
  - `renderModalTabs()`: Free gift step tabs now use `step.addonLabel` when set (FR-01d)
  - `createFreeGiftSlotCard()`: Slot label now uses `step.addonLabel` when set (FR-01d)
  - `initializeDataStructures()`: Added `this.giftMessageState = { message, from, to }` reset on each init
  - `setupDOMElements()`: Added `qtyPillsEl` (.bw-qty-pills) + `giftMessageEl` (.bw-gift-message) to elements; appended footer + new elements between steps and ATC button
  - `renderUI()`: Added calls to `renderQuantityOptionPills()` + `renderGiftMessageUI()`
  - `renderQuantityOptionPills()`: New — reads `messaging.displayOptions.bundleQuantityOptions`; renders one pill per pricing rule; pill click applies active styling + re-renders footer/ATC (FR-03b)
  - `renderGiftMessageUI()`: New — renders gift message textarea + optional From/To fields + char counter; syncs to `giftMessageState` (FR-02d)
  - `renderFooter()` / `updateFooterMessaging()`: Revived — reads `messaging.displayOptions.progressBar`; renders live progress bar with template message + fill bar (FR-03c)
  - `createFooter()`: Removed old "removed by design" comment
  - `updateAddToCartButton()`: Added `giftMandatoryBlocking` check — disables ATC when gift message is mandatory but empty; distinct button text "Add a gift message to continue" (FR-02d)
  - `buildCartItems()`: Adds gift message product as separate cart line item with `_bundle_id`, `_gift_message`, `_gift_from`, `_gift_to` properties (FR-02c)
- ✅ `scripts/build-widget-bundles.js`: Bumped `WIDGET_VERSION` 2.8.0 → 2.9.0 (MINOR — new storefront features)
- ✅ Lint: 0 errors on modified TS files
- ✅ Build: `npm run build:widgets` + `npm run minify:assets css` — both pass, no size limit violations
- Next: Phase 10 — Nav map update + issue close-out

### 2026-05-16 07:30 - Phase 10: Nav Map Update + Issue Close-Out — Completed

- ✅ `docs/app-nav-map/APP_NAVIGATION_MAP.md`: Replaced sparse 5-line PPB stub (§2.7) with full 70-line section map — sidebar nav (6 sections), all sub-sections, all fields, floating readiness gauge, and widget v2.9.0 storefront feature summary
- ✅ Issue status → Completed

**Total Commits:** 9 (Phases 1–10)
**Lines Added:** ~1500+ (route.tsx), ~600 (widget JS), ~90 (metafield sync), ~200 (tests), ~300 (issue docs/nav map)
**Files Created:** handlers/parsers.ts, 4 test files
**Files Modified:** prisma/schema.prisma, app/types/pricing.ts, app/utils/discount-mappers.ts, route.tsx, handlers.server.ts, bundle-product.server.ts, types.ts, bundle-widget-product-page.js, scripts/build-widget-bundles.js, APP_NAVIGATION_MAP.md, constants/bundle.ts

**Key Achievements:**
- ✅ PPB configure route brought to full EB parity: 6-section sidebar matching EB's proven hierarchy
- ✅ 4 major new feature areas: Free Gift & Add Ons, Gift Messages, Bundle Visibility, Bundle Settings expansion
- ✅ 3 Discount & Pricing expansions: Buy X Get Y, Qty Options, Progress Bar
- ✅ Readiness indicator (floating circular gauge with expandable checklist)
- ✅ Widget v2.9.0: addon step labels, gift message UI, qty option pills, progress bar, gift message cart line items
- ✅ Metafield sync: gift messages fully synced; displayOptions path bug fixed for PPB

**Impact:**
- Merchants can now configure PPB bundles with full EB feature parity from the admin UI
- Gift messages enable personalization for gift-oriented bundles
- Qty option pills give merchants a storefront tier-selection UI matching EB's pattern
- Progress bar incentivizes higher cart value via visual discount progress
- Readiness gauge gives merchants a clear actionable checklist before going live

**Status:** Ready for testing and review
