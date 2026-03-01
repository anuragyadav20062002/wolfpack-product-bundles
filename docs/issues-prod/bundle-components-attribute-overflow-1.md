# Issue: Fix _bundle_components JSON Exceeding Shopify Attribute Value Limit

**Issue ID:** bundle-components-attribute-overflow-1
**Status:** Completed
**Priority:** 🔴 High
**Created:** 2026-02-16
**Last Updated:** 2026-02-16 13:30

## Overview

The `_bundle_components` cart line attribute stores a JSON array of component details for the checkout UI to display. Each component object serializes to ~170-200 characters due to long Shopify GID variant IDs, product titles, and numeric fields. Shopify enforces a ~255-character limit on cart line attribute values. A bundle with 2+ components routinely exceeds this limit, causing silent JSON truncation. The checkout UI catches the parse error and hides the expandable component list entirely.

## Root Cause

Both MERGE path (line 495) and EXPAND path (line 684) in `cart_transform_run.ts` write:
```ts
{ key: '_bundle_components', value: JSON.stringify(componentDetails) }
```

The `componentDetails` array contains full Shopify GID variant IDs (`gid://shopify/ProductVariant/...` = ~45 chars each), titles, and 4 numeric fields per component.

## Fix Strategy

Compress the JSON payload by:
1. Shortening field names (e.g., `retailPrice` → `rp`, `bundlePrice` → `bp`)
2. Stripping the `gid://shopify/ProductVariant/` prefix from variant IDs (not used by checkout UI)
3. Truncating long titles
4. Update checkout UI to read the compressed format

## Phases Checklist

- [x] Phase 1: Compress componentDetails in cart transform (both MERGE and EXPAND paths)
- [x] Phase 2: Update checkout UI to read compressed format
- [x] Phase 3: Review and commit

## Progress Log

### 2026-02-16 13:00 - Issue Created & Planning Complete
- Identified `_bundle_components` JSON exceeds 255-char Shopify attribute limit
- Affects both MERGE and EXPAND paths in cart transform
- Checkout UI silently fails — expandable component list disappears
- Next: Phase 1 - Compress the payload

### 2026-02-16 13:30 - All Phases Completed
- ✅ **Phase 1:** Cart transform now writes compact array format `[title, qty, retailCents, bundleCents, discountPct, savingsCents]`
  - MERGE path (`cart_transform_run.ts:452-459`): Drops `variantId`, uses short arrays, truncates titles to 25 chars
  - EXPAND path (`cart_transform_run.ts:617-637`): Same compact format, added optional `title` to `ComponentPricingItem`
- ✅ **Phase 2:** Checkout UI reads compact format with backwards compat
  - `Checkout.tsx:44-71`: New `parseComponents()` function detects array vs object format
  - Supports both new compact arrays AND legacy object format for in-flight carts
  - Removed unused `variantId` from `ComponentDetail` interface
- ✅ **Phase 3:** Type-checked — no new errors introduced
- Files Modified:
  - `extensions/bundle-cart-transform-ts/src/cart_transform_run.ts` (MERGE + EXPAND paths)
  - `extensions/bundle-checkout-ui/src/Checkout.tsx` (parser + interface)

**Size comparison (4 components):**
- Before: ~750 chars (exceeds 255 limit)
- After: ~170 chars (well under limit)

**Status:** Completed

## Related Documentation
- Cart transform: `extensions/bundle-cart-transform-ts/src/cart_transform_run.ts` (lines 451-463, 622-651)
- Checkout UI: `extensions/bundle-checkout-ui/src/Checkout.tsx` (lines 98-106)
- Previous fix: `checkout-ui-bugs-fix-1` (added fallback for JSON parse failure)
