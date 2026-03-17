# SDE Implementation Plan: PDP Bundle Auto-Template

## Overview

Adds `ensureProductBundleTemplate()` to `widget-theme-template.server.ts` and wires it
into the product-page-bundle save and sync handlers. Template key:
`templates/product.product-page-bundle.json`. Block: `bundle-product-page`.

## Phases Completed

### Phase 1 — `ensureProductBundleTemplate()` (TDD)

**Tests (Red → Green):** `tests/unit/services/ensure-product-bundle-template.test.ts` — 13 tests

Covers: theme resolution failure, idempotency (template exists), UUID from env var,
UUID from TOML, TOML unreadable, no uid field, template creation success, block handle
in output, template key in output, existing sections preserved, minimal fallback,
write failure, network error.

**Implementation:**
- Added `PRODUCT_TEMPLATE_KEY` + `PRODUCT_BLOCK_HANDLE` constants
- Added `ensureProductBundleTemplate()` — mirrors `ensureBundlePageTemplate()` but
  uses product constants and reads `templates/product.json` as base
- Extracted `appendBundleWidgetSection()` to eliminate duplication between the two
  build functions; `buildBundleTemplate()` and `buildProductBundleTemplate()` both
  delegate to it
- Added `readBaseProductTemplate()` (reads `product.json`, minimal fallback on failure)
- Moved UUID resolution before base template read in both functions (fail fast)

### Phase 2 — Export + handler wiring

- Exported `ensureProductBundleTemplate` from `index.ts`
- `handleSaveBundle`: calls `ensureProductBundleTemplate()` (non-fatal), then merges
  `templateSuffix: 'product-page-bundle'` into the existing `productUpdate(status)` mutation
  (single API call for both fields)
- `handleSyncBundle`: calls `ensureProductBundleTemplate()` + separate
  `productUpdate(templateSuffix)` after the new product is created (non-fatal, wrapped)

## Build & Verification Checklist

- [x] 13 new tests pass
- [x] 510 total tests pass — zero regressions
- [x] Zero ESLint errors
- [x] TypeScript compiles (diagnostics clean)
- [x] No widget rebuild required (JS unchanged)
- [x] Backward-compatible — existing bundles get suffix on next save

## Manual Test Steps

1. Create a new product-page bundle, select a product, save
2. Verify in Theme Editor: `product.product-page-bundle.json` exists in theme templates
3. Verify in Shopify admin product: `templateSuffix` = `product-page-bundle`
4. Visit `/products/{handle}` — bundle widget should render automatically
5. Save the same bundle again — confirm no second template write in logs (`templateAlreadyExists: true`)
6. Click Sync Bundle — verify new product gets `templateSuffix` and template still exists
