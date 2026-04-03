# Issue: Sync Bundle fails — `variants` not valid on `ProductInput` in API 2025-10

**Issue ID:** sync-bundle-product-create-1
**Status:** Completed
**Priority:** 🔴 High
**Created:** 2026-04-03
**Last Updated:** 2026-04-03 17:00

## Overview

Sync Bundle fails with:
> `Sync failed: Variable $input of type ProductInput! was provided invalid value for variants (Field is not defined on ProductInput)`

In Shopify Admin API 2024-04+, the `variants` field was removed from `ProductInput`. The app targets `ApiVersion.October25` (2025-10) where passing `variants` inside `productCreate` input is invalid.

Both the PPB and FPB configure handlers call `productCreate` with a `variants` array — this needs to be split into two steps:
1. `productCreate` without `variants` (returns auto-created default variant ID)
2. `productVariantUpdate` to set `price` and `inventoryPolicy` on the default variant

Additionally, `inventoryManagement` was deprecated from `ProductVariantInput` in 2024-04+ and should be dropped.

## Affected Files

| File | Lines | Context |
|------|-------|---------|
| `app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/handlers/handlers.server.ts` | ~755 | `handleSyncBundleProduct` — new product creation |
| `app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/handlers/handlers.server.ts` | ~964 | `handleSyncBundle` — hard-reset re-creation |
| `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/handlers/handlers.server.ts` | ~931 | `handleSyncBundleProduct` — new product creation |
| `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/handlers/handlers.server.ts` | ~1092 | `handleSyncBundle` — hard-reset re-creation |

## Fix Pattern

```typescript
// OLD — breaks in API 2025-10
variables: {
  input: {
    title: ...,
    variants: [{ price: bundlePrice, inventoryPolicy: "CONTINUE", inventoryManagement: "SHOPIFY" }]
  }
}

// NEW — productCreate returns default variant ID, then update it separately
// Step 1: productCreate without variants — return variants(first:1) in response
// Step 2: productVariantUpdate({ id: variantId, price: bundlePrice, inventoryPolicy: "CONTINUE" })
```

## Progress Log

### 2026-04-03 16:00 — Bug discovered during full bundle walkthrough
- Ran Sync Bundle on newly created "Cookie Bundle Test" (PPB, id: cmnij1ud90002v0qz7cexn94c)
- Error: `Variable $input of type ProductInput! was provided invalid value for variants`
- Identified 4 call sites across PPB and FPB handlers
- Root cause: API 2025-10 removed `variants` from `ProductInput`

### 2026-04-03 16:30 — Fixed all 4 occurrences
- ✅ PPB `handleSyncBundleProduct`: removed `variants` from `productCreate` input, added `variants(first:1)` to response, added `productVariantUpdate` call after creation
- ✅ PPB `handleSyncBundle`: same fix applied to hard-reset re-creation path
- ✅ FPB `handleSyncBundleProduct`: same fix applied
- ✅ FPB `handleSyncBundle`: same fix applied (non-fatal creation path)
- ✅ Dropped `inventoryManagement: "SHOPIFY"` from all variant updates (deprecated in API 2024-04+)
- ✅ Lint: 0 errors

## Phases Checklist
- [x] Identify root cause and all affected files
- [x] Fix PPB `handleSyncBundleProduct` (~line 755)
- [x] Fix PPB `handleSyncBundle` (~line 964)
- [x] Fix FPB `handleSyncBundleProduct` (~line 931)
- [x] Fix FPB `handleSyncBundle` (~line 1092)
- [x] Lint
- [x] Test sync on Cookie Bundle Test — ✅ Sync succeeded; "Cookie Bundle Test" bundle product linked correctly, no error toast
- [x] Commit
