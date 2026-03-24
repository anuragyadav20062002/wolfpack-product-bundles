# Issue: PDP Add to Storefront — Wrong Product Handle + GraphQL Mutation Fix

**Issue ID:** pdp-add-to-storefront-bugs-1
**Status:** Completed
**Priority:** 🔴 High
**Created:** 2026-03-24
**Last Updated:** 2026-03-24 17:15

## Overview

Two bugs in the PDP "Add to Storefront" flow:

1. **Wrong product handle in Theme Editor URL**: The previewPath in the theme editor URL uses the
   synthetic bundle product handle (`mystic-amber`) instead of the actual PDP product handle (`faa`).
   Root cause: `bundleProduct?.handle` (the synthetic Shopify product created for ad feeds / checkout)
   was taking priority over `bundle.shopifyProductHandle` (the real product page where the widget lives).

2. **GraphQL mutation error in `writeThemeAsset`**: Shopify Admin API 2025-10 changed
   `OnlineStoreThemeFileBodyInput` — `body.asString` is no longer valid. The correct fields are
   `body.type` and `body.value`. This caused the theme template write to fail entirely, so
   `product.product-page-bundle` was never created in the merchant's theme.

## Progress Log

### 2026-03-24 17:11 - Starting fixes

Files to modify:
- `app/services/widget-installation/widget-theme-template.server.ts` — fix `body.asString` → `body: { type: "TEXT", value: content }`
- `app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/route.tsx` — swap handle priority (4 occurrences)

### 2026-03-24 17:15 - Completed

- ✅ Fixed `writeThemeAsset`: `body: { asString: content }` → `body: { type: "TEXT", value: content }` (Shopify API 2025-10 requirement)
- ✅ Fixed handle priority in 4 locations — `bundle.shopifyProductHandle || bundleProduct?.handle`:
  - Theme editor URL on success (install effect)
  - Theme editor URL on failure fallback (install effect)
  - `handleAddToStorefront` submit payload
  - "Open in Theme Editor" secondary action
  - Preview URL construction (product page preview)
- ✅ Linted — 0 errors

## Phases Checklist
- [x] Phase 1: Fix `writeThemeAsset` GraphQL mutation input
- [x] Phase 2: Fix product handle priority in configure route
- [x] Phase 3: Lint + commit
