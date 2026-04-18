# Issue: Per-Component Stock Clamping in Bundle Widget

**Issue ID:** storefront-inventory-clamp-1
**Status:** In Progress
**Priority:** 🟡 Medium
**Created:** 2026-04-16
**Last Updated:** 2026-04-18 (commit 4)

## Overview

The bundle widget does not enforce per-component stock limits in the UI. A shopper can add more units of a low-stock component than Shopify actually has. The app relies on the bundle variant's computed `MIN(component_inv / component_qty)` and Shopify's checkout-level inventory lock as the only gates.

This issue adds live per-variant `quantityAvailable` from the Storefront API, clamps the widget's quantity selectors in real time, and disables out-of-stock components.

See `docs/storefront-inventory-clamp/ARCHITECTURE.md` for the full design.

## Progress Log

### 2026-04-16 - Architecture approved
- Verified Shopify rate-limit and scope docs.
- Confirmed existing SAT infrastructure (`app/services/storefront-token.server.ts`, `Session.storefrontAccessToken`).
- Confirmed existing public proxy `app/routes/api/api.storefront-products.tsx` is the right extension point.
- Architecture doc + this issue file created.

### 2026-04-16 - Commit 2: Scope + SAT invalidation
- Added `unauthenticated_read_product_inventory` to both `shopify.app.toml` and `shopify.app.wolfpack-product-bundles-sit.toml`.
- Extended `handleScopesUpdate` (`app/services/webhooks/handlers/lifecycle.server.ts`) to null `session.storefrontAccessToken` so the next `getStorefrontAccessToken()` call recreates the SAT with the new scope.
- Lint: 0 errors on changed file.
- Next: **manual deploy required** — `npm run deploy:prod` or `npm run deploy:sit`. Merchants re-consent; scope-update webhook fires; SATs get recreated on next storefront product fetch.

### 2026-04-17 - Commit 3: Storefront query extension
- Added `quantityAvailable` + `currentlyNotInStock` to the variant query in `app/routes/api/api.storefront-products.tsx`.
- Gated the new fields behind `hasInventoryScope` (`session.scope.includes('unauthenticated_read_product_inventory')`). Merchants who have not yet re-consented receive the old response shape without error.
- Response maps `quantityAvailable` to `number | null` (null = untracked or scope ungranted) and `currentlyNotInStock` to boolean.
- Lint: 0 errors on changed file.

### 2026-04-18 - Commit 4: Widget clamp + badges + variant OOS greying
- **Full-page widget** (`app/assets/bundle-widget-full-page.js`):
  - `processProductsForStep`: `normalizeVariant` helper propagates `quantityAvailable` and `currentlyNotInStock` to every product/variant.
  - `getVariantAvailable(stepIndex, variantId)` helper: returns `{ available, outOfStock, acceptsBackorder }`.
  - `updateProductSelection`: clamp quantity to `available`; block hard OOS items with toast.
  - `renderModalProducts`: per-card stock badges ("Only N left" / "Out of stock"), disabled `+` button at max stock, disabled Add button for OOS, `is-out-of-stock` class.
  - `renderVariantSelector`: disabled + "— out of stock" label for hard-OOS variant options.
  - Variant swap handler: syncs `quantityAvailable`/`currentlyNotInStock` from new variant, re-clamps migrated quantity with toast.
- **Product-page widget** (`app/assets/bundle-widget-product-page.js`):
  - Mirrored all six changes from the full-page widget.
- **WIDGET_VERSION** bumped from `2.4.10` → `2.5.0` (minor — new storefront feature).
- Built bundles: `npm run build:widgets` — full-page 261.9 KB, product-page 152.6 KB.
- CSS sizes checked: full-page 96,310 B, product-page 70,906 B — both under 100,000 B limit.
- Lint: 0 errors on changed files.
- Next: **manual deploy required** — `npm run deploy:prod` or `npm run deploy:sit`. Wait ~5 min for CDN propagation. Verify with `console.log(window.__BUNDLE_WIDGET_VERSION__)` → `"2.5.0"`.

## Phases Checklist

- [x] Architecture + issue file (commit 1)
- [x] Add `unauthenticated_read_product_inventory` scope + auto-recreate SAT on `app/scopes_update` (commit 2) — **requires app deploy**
- [x] Extend Storefront query in `api.storefront-products.tsx` with `quantityAvailable` + `currentlyNotInStock` (commit 3)
- [x] Widget clamp logic in `updateProductSelection` + UI polish + `WIDGET_VERSION` bump + built bundles (commit 4) — **requires widget deploy**
- [ ] Unit tests for scope update handler + clamp helper (commit 5)

## Related Documentation

- `docs/storefront-inventory-clamp/ARCHITECTURE.md`
- `internal docs/Features/Bundle Types.md` — MIN inventory formula
- `internal docs/Shopify Integration/Admin API.md` — rate-limit reasoning
- Shopify: `https://shopify.dev/docs/api/usage/rate-limits`, `https://shopify.dev/docs/api/usage/access-scopes`

## Impact Analysis

- **Communities touched:** Inventory Sync Webhook Flow, Scope & SAT lifecycle, Widget (full-page + product-page)
- **God nodes affected:** `BundleWidgetFullPage`, `api.storefront-products Route`
- **Downstream risk:** merchant scope re-consent required post-deploy; widget cache propagation delay ~2–10 min
- **Test coverage:** new unit tests for scope-update SAT invalidation + clamp helper
