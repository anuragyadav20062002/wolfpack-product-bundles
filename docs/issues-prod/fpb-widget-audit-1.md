# Issue: FPB Widget Audit & Bug Fixes

**Issue ID:** fpb-widget-audit-1
**Status:** In Progress
**Priority:** 🔴 High
**Created:** 2026-03-20
**Last Updated:** 2026-03-20 17:00

## Overview
Full audit of the Full-Page Bundle (FPB) widget via live Chrome DevTools interaction + source code review. Identified and fixed 5 bugs across the widget JS, Cart Transform metafield sync, and dead code.

## Progress Log

### 2026-03-20 17:00 - Audit + Bug Fixes

**Audit findings (6 total):**
1. 🔴 Cart Transform not applying bundle discount — `component_parents` only written to first variant
2. 🟠 Duplicate `storefront-products` API calls (4 calls instead of 2 per page load)
3. 🟠 Design settings CSS proxy returning HTML on SIT (MIME type console error)
4. 🟡 Product cards show product sale price not bundle discount — user confirmed correct behavior (no change)
5. 🟢 Dead `buildCartItems()` + commented-out `addToCart()` — removed
6. 🟢 `loadDesignSettingsCSS()` was a no-op — now implements proxy error fallback

**Fixes applied:**
- `component-product.server.ts`: Write `component_parents` to ALL variants of each product by reading from `StepProduct.variants` DB cache instead of fetching only first variant via Shopify API. Falls back to API when variants not in DB.
- `bundle-widget-full-page.js`: Skip `step.products` API fetch when `step.StepProduct` has enriched data (same source, avoids 1 duplicate call per step)
- `bundle-widget-full-page.js`: `loadDesignSettingsCSS()` now registers an `error` listener on the proxy `<link>` tag. If the app proxy fails (SIT env), falls back to direct `window.__BUNDLE_APP_URL__` URL
- `bundle-widget-full-page.js`: Removed commented-out `addToCart()` (~50 lines) and dead `buildCartItems()` (~50 lines)
- `bundle-widget-full-page-bundled.js`: Rebuilt widget bundle

## Phases Checklist
- [x] Phase 1: Live audit (Chrome DevTools)
- [x] Phase 2: Code review (Liquid, widget JS, Cart Transform)
- [x] Phase 3: Bug fixes + lint + widget build
- [ ] Phase 4: Deploy + verify discount applied in cart
