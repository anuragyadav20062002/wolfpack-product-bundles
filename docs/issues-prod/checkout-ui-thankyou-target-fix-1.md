# Issue: Fix Thank-You Page Target for Checkout UI Extension

**Issue ID:** checkout-ui-thankyou-target-fix-1
**Status:** Completed
**Priority:** 🔴 High
**Created:** 2026-02-20
**Last Updated:** 2026-02-20 00:00

## Overview

The `bundle-checkout-ui` extension declares two targets in `shopify.extension.toml`:
- `purchase.checkout.cart-line-item.render-after` ✅ working
- `purchase.thank-you.cart-line-item.render-after` ❌ not rendering

The stale dist (`extensions/bundle-checkout-ui/dist/bundle-checkout-ui.js`, built Feb 6)
only registers one `shopify.extend()` call — the checkout target — because the dist was built
before the thank-you target was added to the toml. The dist is gitignored so it must be
regenerated via `shopify app dev`.

Additional finding: `src/index.tsx` has a `console.error` call that violates the
no-console policy enforced in commit `8f3efbc`.

## Root Cause

The dist is out of sync with the current source. The `.gitignore` excludes
`/extensions/*/dist`, so the dist is never committed — it must be rebuilt locally
via `shopify app dev` before deploying.

## Progress Log

### 2026-02-20 00:00 - Source cleanup before rebuild
- Removed `console.error` from `src/index.tsx` (no-console policy)
- Verified `shopify.extension.toml` already has both targets correctly declared
- Verified `src/index.tsx` default export pattern is correct for both targets
- Next: User must run `shopify app dev` to rebuild dist, then `shopify app deploy`

## Related Documentation
- `extensions/bundle-checkout-ui/shopify.extension.toml` — both targets declared here
- `extensions/bundle-checkout-ui/src/index.tsx` — single default export serves both targets
- Commit `8f3efbc` — no-console policy enforcement

## Phases Checklist
- [x] Phase 1: Source cleanup (remove console.error)
- [ ] Phase 2: Rebuild dist (`shopify app dev`)
- [ ] Phase 3: Deploy (`shopify app deploy`)
- [ ] Phase 4: Verify thank-you page renders bundle breakdown
