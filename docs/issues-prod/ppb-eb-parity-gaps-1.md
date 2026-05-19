# Issue: PPB EB Parity Gaps — Bundle Visibility Nav + Free Gift Fields

**Issue ID:** ppb-eb-parity-gaps-1
**Status:** Completed
**Priority:** 🔴 High
**Created:** 2026-05-19
**Last Updated:** 2026-05-19 14:00

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

### 2026-05-19 14:00 - Gap 3: "Take your bundle live" left column card
- Added `<s-section>` card at bottom of left column in route.tsx (after Bundle Setup Navigation Card)
- Card contains: heading "Take your bundle live", "Place on theme" secondary button (conditional on `themeEditorUrl`), "Place Widget" primary button
- "Place on theme" calls `window.open(themeEditorUrl, "_blank")` — matches EB behaviour
- "Place Widget" calls existing `handlePlaceWidget` — same handler already wired to Bundle Visibility section
- E2E verified in Chrome DevTools: a11y snapshot confirmed uid=33_79 heading + uid=33_80 "Place on theme" + uid=33_81 "Place Widget" present in DOM
- Screenshot confirmed card rendered correctly in left column below "Bundle Settings"
- ESLint: 0 errors

## Files Changed
- `app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/route.tsx` (Gaps 1, 2, 3)
- `app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/handlers/handlers.server.ts` (Gap 2)
- `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/handlers/handlers.server.ts` (Gap 2)
- `app/services/bundles/metafield-sync/types.ts` (Gap 2)
- `app/services/bundles/metafield-sync/operations/bundle-product.server.ts` (Gap 2)
- `app/assets/bundle-widget-product-page.js` (Gap 2)
- `prisma/schema.prisma` (Gap 2)
- `prisma/migrations/20260519112943_ppb_addon_add_replace_text/migration.sql` (Gap 2)
- `extensions/bundle-builder/assets/bundle-widget-product-page-bundled.js` (Gap 2)
- `extensions/bundle-builder/assets/bundle-widget-full-page-bundled.js` (Gap 2)

## Phases Checklist
- [x] Gap 1: Bundle Visibility in nav + Pending badge + Place Widget button
- [x] Gap 2: Free Gift "Add On" + "Replace" text fields
- [x] Gap 3: "Take your bundle live" left column card
- [x] E2E test in Chrome after each gap
