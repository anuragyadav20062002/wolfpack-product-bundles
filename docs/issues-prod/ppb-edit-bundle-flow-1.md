# Issue: PPB Edit Bundle Flow — EB Parity

**Issue ID:** ppb-edit-bundle-flow-1
**Status:** In Progress
**Priority:** 🔴 High
**Created:** 2026-05-16
**Last Updated:** 2026-05-16 01:30

## Overview

Bring the Product Page Bundle (PPB) configure route to full Easy Bundles (EB) parity. Adds 2 new sidebar sections, expands 3 existing sections, reorders the sidebar nav, and extends the PPB widget with new storefront rendering.

**Requirements:** `docs/ppb-edit-bundle-flow/01-requirements.md`
**Architecture:** `docs/ppb-edit-bundle-flow/02-architecture.md`

## Phases Checklist

- [x] Phase 1: Schema + types + discount mapper (atomic)
- [x] Phase 2: Server handler extensions (3 parse helpers + Prisma extensions)
- [x] Phase 3: Nav reorder + Bundle Visibility section (FR-04, FR-06)
- [x] Phase 4: Free Gift & Add Ons section + step-mode control (FR-01)
- [ ] Phase 5: Gift Messages in Messages section (FR-02)
- [ ] Phase 6: Discount & Pricing expansions — Buy X Get Y + Qty Options + Progress Bar (FR-03)
- [ ] Phase 7: Bundle Settings expansion — 8 new sub-sections (FR-05)
- [ ] Phase 8: Readiness indicator in sidebar (FR-07)
- [ ] Phase 9: Widget extensions — addon steps, gift message UI, qty pills, progress bar
- [ ] Phase 10: Nav map update + issue close-out

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
