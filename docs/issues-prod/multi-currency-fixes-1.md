# Issue: Multi-Currency Fixes

**Issue ID:** multi-currency-fixes-1
**Status:** In Progress
**Priority:** 🔴 High
**Created:** 2026-03-20
**Last Updated:** 2026-03-20 20:00

## Overview
Fix all multi-currency gaps identified in the currency audit. User confirmed: no fallback values for pricing — fail clearly rather than silently apply a wrong price.

## Fixes

1. **Cart Transform GraphQL** — Add `presentmentCurrencyRate` to input query
2. **`calculateDiscountPercentage`** — Use `presentmentCurrencyRate` for fixed-amount cases; zero-return (not fallback) when rate is unavailable
3. **Amount conditions** — Convert base-currency threshold to presentment currency before comparing
4. **Delete `cart-transform-currency-utils.ts`** — Hardcoded stale rates, never used, dangerous
5. **`api.storefront-products`** — Accept `country` param, pass `@inContext(country: $country)` to Storefront API
6. **Widget** — Pass `window.Shopify.country` / locale country to all storefront-products calls
7. **Liquid blocks** — Populate `customerCurrency` from `cart.currency.iso_code`; remove hardcoded null/1 stubs

## Progress Log

### 2026-03-20 20:00 - Starting implementation

### 2026-03-20 21:00 - All phases complete

**Phase 1: Cart Transform**
- `cart-transform-input.graphql`: Added `presentmentCurrencyRate` at root `query Input` level (field is on `Input` type, not `Cart`)
- `cart_transform_run.ts`:
  - Added `presentmentCurrencyRate?: number` to `CartTransformInput` interface (root level)
  - Updated `calculateDiscountPercentage` signature: added `presentmentCurrencyRate` param
  - `fixed_amount_off`: now uses `(value / 100) * presentmentCurrencyRate` — returns 0 if rate invalid
  - `fixed_bundle_price`: same pattern
  - Amount-type conditions: threshold converted to presentment currency — returns 0 if rate invalid
  - MERGE + EXPAND callers: extract `input.presentmentCurrencyRate` and pass through
- Deleted `cart-transform-currency-utils.ts` (hardcoded stale rates, never imported)
- WASM build: success

**Phase 2: Storefront API + widget country**
- `api.storefront-products.tsx`: accepts `?country=` param; both GraphQL queries use `@inContext(country: $country)` when country provided
- `bundle-widget-full-page.js`: both storefront-products fetch calls derive country from `window.Shopify.country` or parse from locale, append `&country=XX` when available
- Widget bundle rebuilt: 247.2 KB

**Phase 3: Liquid blocks**
- `bundle-full-page.liquid`: `customerCurrency` from `cart.currency.iso_code`; removed hardcoded `null`/`1`; `isMultiCurrencyEnabled` from `shop.enabled_currencies.size`
- `bundle-product-page.liquid`: same changes

## Phases Checklist
- [x] Phase 1: Cart Transform (graphql + ts + delete utils)
- [x] Phase 2: Storefront API + widget country passing
- [x] Phase 3: Liquid blocks
- [x] Phase 4: Build Cart Transform WASM + widget bundle
