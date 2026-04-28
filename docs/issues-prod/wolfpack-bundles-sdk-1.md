# Issue: Wolfpack Bundles Custom SDK

**Issue ID:** wolfpack-bundles-sdk-1
**Status:** Completed
**Priority:** 🟡 Medium
**Created:** 2026-04-28
**Last Updated:** 2026-04-28 04:00

## Overview

Implement a headless-on-Liquid JavaScript SDK (`window.WolfpackBundles`) that allows developers to build fully custom bundle UIs on Shopify storefronts without using the pre-built widget. Fills all gaps vs Easy Bundles SDK: reactive DOM events, validateBundle(), removeItem(), getDisplayPrice(), TypeScript definitions, debug mode. Reuses existing shared modules from app/assets/widgets/shared/.

## Related Documentation

- `docs/wolfpack-bundles-sdk/01-requirements.md`
- `docs/wolfpack-bundles-sdk/02-architecture.md`
- `docs/competitor-analysis/eb-sdk-analysis.md`
- `docs/competitor-analysis/wolfpack-sdk-effort-analysis.md`

## Phases Checklist

- [x] Phase 1: SDK source modules (state, config-loader, events, cart, validate-bundle, get-display-price, debug, entry point)
- [x] Phase 2: TypeScript definitions (wolfpack-bundles.d.ts)
- [x] Phase 3: Build pipeline (build:sdk npm script + buildSdkBundle() in build script)
- [x] Phase 4: Extension Liquid block update (sdk_mode setting)
- [x] Phase 5: Unit tests (sdk-state, sdk-cart, sdk-validate-bundle, sdk-get-display-price)
- [x] Phase 6: Usage documentation (SDK_USAGE_GUIDE.md)
- [x] Phase 7: Fix 8 pre-existing failing test suites + CLAUDE.md SDK build rule

## Progress Log

### 2026-04-28 04:00 - Fixed Pre-existing Failing Test Suites + CLAUDE.md
- ✅ Deleted cart-transform-run.test.ts and cart-transform-bundle-utils.test.ts (TS source replaced by Rust)
- ✅ Fixed bundle-formatter.test.ts and fpb-config-metafield.test.ts: replaced vitest imports with Jest globals
- ✅ Fixed cart-transform-service.test.ts: added shopifyFunctions mock for new getRustFunctionId() call
- ✅ Fixed bundle-product-metafield.test.ts: updated graphql.mock.calls index 0→1 (ensureBundleParentVariantRequiresComponents is now call 0)
- ✅ Fixed api.bundle.free-gift.test.ts: HMAC signature added to makeRequest() for verifyAppProxyRequest()
- ✅ Fixed webhook-worker-inngest.test.ts: added INNGEST_EVENT_KEY to test setup so INNGEST_AVAILABLE=true
- ✅ Fixed bundle-formatter.server.ts: always emit all FormattedStep fields (removed conditional spreading)
- ✅ Added SDK build rule to CLAUDE.md (run npm run build:sdk after app/assets/sdk/*.js changes)
- 739/739 tests pass

### 2026-04-28 02:00 - Completed All Phases
- ✅ Phase 1: Created app/assets/sdk/{state,events,config-loader,cart,validate-bundle,get-display-price,debug,wolfpack-bundles}.js
- ✅ Phase 2: Created types/wolfpack-bundles.d.ts (full public TS interface)
- ✅ Phase 3: Extended scripts/build-widget-bundles.js with buildSdkBundle(); added build:sdk npm script; output: extensions/bundle-builder/assets/wolfpack-bundles-sdk.js (80.3 KB, under 100 KB limit)
- ✅ Phase 4: Updated bundle-product-page-embed.liquid with sdk_mode checkbox setting; loads SDK JS vs widget JS conditionally
- ✅ Phase 5: 33/33 tests passing across sdk-state, sdk-cart, sdk-validate-bundle, sdk-get-display-price
- ✅ Phase 6: Created docs/wolfpack-bundles-sdk/SDK_USAGE_GUIDE.md
- Fixed pre-existing jest/no-export ESLint error in .eslintrc.cjs test overrides
- Zero ESLint errors on all new files

### 2026-04-28 00:00 - Starting Implementation
- Feature pipeline complete (BR + PO + Architecture docs written)
- Issue file created
- Beginning Phase 1: SDK source modules
- Files to create: app/assets/sdk/*.js, types/wolfpack-bundles.d.ts
- Files to modify: scripts/build-widget-bundles.js, extensions/bundle-builder/blocks/bundle-product-page-embed.liquid
