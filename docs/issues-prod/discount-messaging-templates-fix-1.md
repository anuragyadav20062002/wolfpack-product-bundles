# Issue: Discount Messaging Templates Not Applied at Storefront

**Issue ID:** discount-messaging-templates-fix-1
**Status:** Completed
**Priority:** 🔴 High
**Created:** 2026-02-22
**Last Updated:** 2026-02-22 00:30

## Overview

Merchant-configured discount message templates are never applied at the storefront for
full-page bundles, and are silently wiped for product-page bundles whenever a sync runs.

## Root Causes

### Bug 1 — Full-page widget reads non-existent fields (critical)

`updateMessagesFromBundle()` in `bundle-widget-full-page.js` reads
`pricingMessages.progress` and `pricingMessages.qualified`. These fields do NOT exist in
the DB. The DB `pricing.messages` JSON column stores:
```json
{ "showDiscountDisplay": true, "showDiscountMessaging": true/false,
  "ruleMessages": { "[ruleId]": { "discountText": "...", "successMessage": "..." } } }
```
The correct path is `pricingMessages.ruleMessages` → first value → `.discountText` / `.successMessage`.
As a result `pricingMessages.progress` is always `undefined` → templates never updated → widget
always shows the hardcoded default.

### Bug 2 — API endpoint missing `showProgressBar`

`api.bundle.$bundleId[.]json.tsx` returns `pricing: { enabled, method, rules, showFooter, messages }`
but omits `showProgressBar` (a scalar field on `BundlePricing`). The full-page widget reads
`pricingMessages.showProgressBar` which is `undefined`, so the progress bar is never shown even
when the merchant enabled it.

### Bug 3 — Sync paths omit `pricing.messages` (both bundle types)

Both handlers have secondary sync paths (triggered by "Sync product") that rebuild
`bundleConfiguration` from DB data but omit `pricing.messages`. When `updateBundleProductMetafields`
is called, `bundle-product.server.ts` falls back to hardcoded default templates and sets
`showDiscountMessaging = false`. This silently wipes any previously saved templates in the metafield.

Affected sync paths:
- `app.bundles.full-page-bundle.configure.$bundleId/handlers/handlers.server.ts` lines ~660, ~810
- `app.bundles.product-page-bundle.configure.$bundleId/handlers/handlers.server.ts` lines ~646, ~796

## Progress Log

### 2026-02-22 00:00 - Starting Fix

Files to modify:
- `app/assets/bundle-widget-full-page.js` — fix `updateMessagesFromBundle()` to read `ruleMessages`
- `app/routes/api/api.bundle.$bundleId[.]json.tsx` — add `showProgressBar` to pricing response
- `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/handlers/handlers.server.ts` — fix 2 sync paths
- `app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/handlers/handlers.server.ts` — fix 2 sync paths

## Progress Log

### 2026-02-22 00:30 - All Fixes Applied and Committed

- ✅ Fix 1: `updateMessagesFromBundle()` now reads `pricingMessages.ruleMessages` → first value → `.discountText`/`.successMessage`
- ✅ Fix 1: `showProgressBar` now reads from `this.selectedBundle?.pricing?.showProgressBar` (scalar field)
- ✅ Fix 1: `showDiscountMessaging` now reads `pricingMessages.showDiscountMessaging || pricing.enabled`
- ✅ Fix 2: API endpoint now includes `showProgressBar: bundle.pricing.showProgressBar || false`
- ✅ Fix 3: Full-page handler sync path 1 (handleSyncProduct) includes `pricing.messages` built from DB `ruleMessages`
- ✅ Fix 3: Full-page handler sync path 2 (handleSyncBundleProduct) includes `pricing.messages` built from DB `ruleMessages`
- ✅ Fix 4: Product-page handler sync path 1 includes `pricing.messages` built from DB `ruleMessages`
- ✅ Fix 4: Product-page handler sync path 2 includes `pricing.messages` built from DB `ruleMessages`
- ✅ Widget rebuilt (192.3 KB), 0 ESLint errors

Files modified:
- `app/assets/bundle-widget-full-page.js`
- `extensions/bundle-builder/assets/bundle-widget-full-page-bundled.js`
- `app/routes/api/api.bundle.$bundleId[.]json.tsx`
- `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/handlers/handlers.server.ts`
- `app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/handlers/handlers.server.ts`

## Phases Checklist

- [x] Fix 1: full-page widget reads `ruleMessages` correctly
- [x] Fix 2: API adds `showProgressBar` to pricing response
- [x] Fix 3: full-page handler sync paths include `pricing.messages`
- [x] Fix 4: product-page handler sync paths include `pricing.messages`
- [x] Widget rebuild
- [x] Lint + commit
