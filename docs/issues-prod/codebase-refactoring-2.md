# Issue: Codebase Anti-Pattern Refactoring (Batch 2)

**Issue ID:** codebase-refactoring-2
**Status:** In Progress
**Priority:** 🟡 Medium
**Created:** 2026-04-01
**Last Updated:** 2026-04-01

## Overview
Full codebase audit (37 files) identified 6 CRITICAL, 22 WARN, 7 INFO findings.
Fixing in ascending order of difficulty: type fixes → console→AppLogger batch →
silent swallow CRITICAL → cascading fallback CRITICAL → any-typing → giant functions.

## Findings Summary
- CRITICAL 1: `api.storefront-products` cascading fallback + `as any` admin object
- CRITICAL 2–5: `console.log` emoji banners in 3 metafield operation files + storefront path
- CRITICAL 6: `component-product.server.ts` silent `return` instead of `throw` (cart transform breaks silently)
- WARN 7: 5 repeat extract functions in DCP handlers
- WARN 9: `admin: any` at module boundaries across 6 service files
- WARN 13: `loader({ request }: any)` in api.check-bundles.ts
- WARN 19–20: `(error as Error).message` without instanceof guard
- WARN 17: `console.warn` in auth-guards

## Progress Log

### 2026-04-01 - Starting fix batch

## Files to Change
- `app/routes/api/api.check-bundles.ts` (Finding 13)
- `app/routes/api/api.ensure-product-template.tsx` (Finding 19)
- `app/routes/api/api.bundle.$bundleId[.]json.tsx` (Finding 20)
- `app/lib/auth-guards.server.ts` (Finding 17)
- `app/services/bundles/metafield-sync/operations/bundle-product.server.ts` (Finding 3)
- `app/services/bundles/metafield-sync/operations/component-product.server.ts` (Findings 4, 6)
- `app/services/bundles/metafield-sync/operations/cart-transform.server.ts` (Finding 5)
- `app/routes/api/api.storefront-products.tsx` (Findings 1, 2)
- `app/routes/api/api.storefront-collections.tsx` (Finding 14)
- `app/services/storefront-token.server.ts` (Finding 16)

## Phases Checklist
- [ ] Fix 13: loader any → LoaderFunctionArgs
- [ ] Fix 19–20: generic catch instanceof guards
- [ ] Fix 17: console.warn → AppLogger in auth-guards
- [ ] Fix 3–5: console → AppLogger in metafield operation files
- [ ] Fix 14, 16: console → AppLogger in storefront files
- [ ] Fix 6: silent return → throw in component-product
- [ ] Fix 1: cascading fallback in storefront-products
- [ ] Fix 2: remaining console.* in storefront-products
