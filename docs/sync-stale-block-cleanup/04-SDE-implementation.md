# SDE Implementation Plan: Sync Bundle — Stale Block Cleanup

## Overview

Remove `templateSuffix` from all Shopify page/product mutations to prevent stale theme blocks from hiding the bundle widget. Delete dead template management code.

## Test Plan

No new tests required — all changes are string literal removals, URL updates, and dead code deletion. See Architecture doc for manual verification checklist.

## Phase 1: FPB — Remove templateSuffix from page creation

**Files:**
- `app/services/widget-installation/widget-full-page-bundle.server.ts`
  - Remove `templateSuffix` variable and its usage in pageCreate mutation
  - Remove template suffix check/update block for existing pages

## Phase 2: PDP — Remove templateSuffix from product mutations

**Files:**
- `app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/handlers/handlers.server.ts`
  - Remove `templateSuffix` from `syncBundleProductToShopify()` mutation
  - Remove `ensureProductBundleTemplate` call + `ApplyTemplateSuffix` mutation in `handleSyncBundle()`

## Phase 3: Update theme editor deep links

**Files:**
- `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/route.tsx` — `page.full-page-bundle` → `page`
- `app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/route.tsx` — `product.product-page-bundle` → `product`

## Phase 4: Remove dead widget installation code

**Files:**
- `app/routes/api/api.install-fpb-widget.tsx` — Remove `ensureBundlePageTemplate` import and call
- `app/routes/api/api.install-pdp-widget.tsx` — Remove `ensureProductBundleTemplate` import/call and templateSuffix mutation
- `app/services/widget-installation/widget-theme-template.server.ts` — Delete file
- `app/services/widget-installation/index.ts` — Remove export

## Build & Verification Checklist

- [ ] TypeScript compiles without new errors
- [ ] ESLint passes on modified files
- [ ] Manual test on wolfpackdemostore: Sync toy-bundle → renders on storefront
