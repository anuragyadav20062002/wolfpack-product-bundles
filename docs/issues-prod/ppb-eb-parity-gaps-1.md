# Issue: PPB EB Parity Gaps — Bundle Visibility Nav + Free Gift Fields

**Issue ID:** ppb-eb-parity-gaps-1
**Status:** In Progress (Gaps 1–2 done)
**Priority:** 🔴 High
**Created:** 2026-05-19
**Last Updated:** 2026-05-19 12:00

## Overview

Three parity gaps identified via Chrome DevTools EB audit:

1. **Bundle Visibility not in nav** — section is fully built (lines 2402–2532) but missing from `bundleSetupItems`. `handlePlaceWidget` is also defined but never called from the UI.
2. **Free Gift: "Add On" and "Replace" text fields missing** — EB shows 4 fields (Step Name, Add On, Step Title, Replace); WPB only has 2 (Step Name, Step Title).
3. **"Take your bundle live" left column card** — EB has Place on theme + Place Widget buttons in a left-column card. WPB modal exists but no left-column entry point.

## Progress Log

### 2026-05-19 00:00 - Starting Gap 1: Bundle Visibility nav
- Add `bundle_visibility` to `bundleSetupItems` between Discount & Pricing and Bundle Settings
- Add "Pending" badge when `!appEmbedEnabled || !upsellWidgetEnabled`
- Wire "Place Widget" button in the Bundle Visibility section

### 2026-05-19 12:00 - Gap 2: Free Gift "Add On" + "Replace" text fields
- Added `addonAddText String?` and `addonReplaceText String?` to Prisma schema
- Ran migration: `20260519112943_ppb_addon_add_replace_text`
- Updated PPB + FPB handlers (save), metafield-sync types + bundle-product.server.ts
- Added 2 new `s-text-field` elements in "Add-Ons and Gifting Step" card (between Step Name and Step Title, and after Step Title)
- Updated product-page widget to use `currentStep.addonAddText` / `currentStep.addonReplaceText` for product card button text
- Built widget bundles: `npm run build:widgets`
- ESLint: 0 errors

## Files Changed
- `app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/route.tsx`
- `app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/handlers/handlers.server.ts`
- `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/handlers/handlers.server.ts`
- `app/services/bundles/metafield-sync/types.ts`
- `app/services/bundles/metafield-sync/operations/bundle-product.server.ts`
- `app/assets/bundle-widget-product-page.js`
- `prisma/schema.prisma`
- `prisma/migrations/20260519112943_ppb_addon_add_replace_text/migration.sql`
- `extensions/bundle-builder/assets/bundle-widget-product-page-bundled.js`
- `extensions/bundle-builder/assets/bundle-widget-full-page-bundled.js`

## Phases Checklist
- [x] Gap 1: Bundle Visibility in nav + Pending badge + Place Widget button
- [x] Gap 2: Free Gift "Add On" + "Replace" text fields
- [ ] Gap 3: "Take your bundle live" left column card
- [ ] E2E test in Chrome after each gap
