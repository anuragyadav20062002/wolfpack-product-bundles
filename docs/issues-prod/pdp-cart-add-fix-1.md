# Issue: PDP Bundle Cart Add Failures

**Issue ID:** pdp-cart-add-fix-1
**Status:** Completed
**Priority:** 🔴 High
**Created:** 2026-03-17
**Last Updated:** 2026-03-17 23:59

## Overview

Two bugs causing "Failed to add bundle to cart" toast error on product-page bundles:

1. **Wrong variant ID** — single-variant products used product ID instead of variant ID in
   `/cart/add.js` payload, causing Shopify to reject the request.
2. **Non-JSON error swallowing** — when Shopify returns an HTML response (password-protected
   store, redirect, or certain error conditions), `response.json()` threw a raw JSON parse
   error that was surfaced directly in the toast: "Unexpected token '<', '<!DOCTYPE'...".

## Phases Checklist

- [x] Phase 1: Fix variant ID resolution in `buildCartItems()` ✅
- [x] Phase 2: Fix error handling in `addToCart()` to handle HTML responses gracefully ✅
- [x] Phase 3: Rebuild widget + lint + commit ✅

## Progress Log

### 2026-03-17 23:59 - Both Fixes Applied

**Bug 1 — Wrong variant ID:**
- Root cause: `selectionKey = product.variantId || product.id` — for single-variant products
  `product.variantId` is unset so the selection key becomes the product GID/ID. Then
  `parseInt(this.extractId(productId))` produced a product numeric ID, not a variant ID.
- Fix: In `buildCartItems()`, resolve `actualVariantId = product.variantId || product.variants[0]?.id || variantId`
- File: `app/assets/bundle-widget-product-page.js` (~line 2131)

**Bug 2 — HTML response swallowed as JSON parse error:**
- Root cause: `const errorData = await response.json()` called when response body is HTML
  (password-protected store redirect, Shopify error page). The SyntaxError propagated to the
  outer catch and was shown verbatim in the toast.
- Fix: Read body with `response.text()` first, then `try { JSON.parse(...) } catch {}`
  for both the error branch and success branch.
- File: `app/assets/bundle-widget-product-page.js` (~line 2072)

**Build:**
- ✅ `npm run build:widgets:product-page` — 140.1 KB (was 138.9 KB)
- ✅ ESLint — 0 errors

**Status:** Ready for deploy
