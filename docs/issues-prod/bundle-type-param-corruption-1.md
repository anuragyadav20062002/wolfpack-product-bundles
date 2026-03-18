# Issue: bundleType Query Param Corruption via Shopify App Proxy

**Issue ID:** bundle-type-param-corruption-1
**Status:** Completed
**Priority:** 🔴 High
**Created:** 2026-03-19
**Last Updated:** 2026-03-19 21:30

## Overview
The `bundleType` query param in `api.design-settings.$shopDomain.tsx` was being used raw without sanitization. Shopify's App Proxy appends its own auth params (e.g. `?oseid=VALUE`) directly to the URL in some cases, corrupting the `bundleType` value to `product_page?oseid=FDgXgLNv9JtvTXgVvKoiBEr9`. This caused a `PrismaClientValidationError` because `product_page?oseid=...` is not a valid `BundleType` enum value, resulting in 500 errors on all CSS fetches for those stores.

## Root Cause
Shopify App Proxy appends `?oseid=VALUE` (with a `?` not `&`) to URLs in some request flows. When the URL already has `?bundleType=product_page`, the proxy appends `?oseid=VALUE` making it `?bundleType=product_page?oseid=VALUE`. An intermediate proxy/reverse-proxy layer then percent-encodes the inner `?` and `=` giving `bundleType=product_page%3Foseid%3DVALUE`.

## Fix
Added a `sanitizeBundleType` helper before the DB query that:
1. Strips everything after the first `?` in the value
2. Validates the stripped value is a known `BundleType` enum value
3. Returns `null` if invalid (falls back to trying all bundle types)

## Progress Log

### 2026-03-19 21:30 - Fixed
- Added `sanitizeBundleType()` helper in `api.design-settings.$shopDomain.tsx`
- Applied sanitization to `requestedBundleType` on line 24
- Files changed: `app/routes/api/api.design-settings.$shopDomain.tsx`
