# Architecture — Per-Component Stock Clamping in the Bundle Widget

**Status:** Approved — SDE stage
**Created:** 2026-04-16
**Issue:** `storefront-inventory-clamp-1`

---

## Problem

The bundle widget lets a shopper freely add more units of a component than Shopify actually has in stock. Today the app relies on two downstream gates:

1. The bundle variant's own stock number (a `MIN(component_inv / component_qty)` computed by `syncBundleInventory`).
2. Shopify's checkout-level inventory lock.

Neither clamps *per component, in real time, in the UI*. Consequences:
- A shopper can select 2× of a component that has 1 in stock and only discover the error at checkout.
- Low-stock signals (e.g. "only 2 left") are never surfaced.
- Stale cached inventory on the bundle variant (debounce 60s) can briefly oversell.

## Goal

Clamp per-component quantity selectors in the widget to each component's real `quantityAvailable`, and disable out-of-stock components. Keep Shopify's checkout lock as the final gate.

## Constraints

- Must not pressure the Admin GraphQL API rate limit (Standard plan = 100 points/sec, per-app-per-store).
- Must not require merchant changes beyond a one-time scope re-consent.
- Must respect the "No Backwards Compatibility" rule — old bundles re-sync to pick up new behaviour; no shims.
- Widget source files must be built (`npm run build:widgets`) and `WIDGET_VERSION` bumped before deploy.

## Decision: Use the Storefront API, not the Admin API

Verified against Shopify official docs:

| Factor | Admin API | Storefront API |
|---|---|---|
| Rate limit | 100 pts/sec on Standard (per plan, per app per store) | **No rate limits** on normal queries |
| Inventory exposure | `inventoryItem.inventoryLevels.quantities(available)` | `ProductVariant.quantityAvailable` with `unauthenticated_read_product_inventory` scope |
| Call surface | Server-side only | Public-token safe |

Sources:
- `https://shopify.dev/docs/api/usage/rate-limits`
- `https://shopify.dev/docs/api/storefront/latest/objects/ProductVariant`
- `https://shopify.dev/docs/api/usage/access-scopes`

The app already has:
- `Session.storefrontAccessToken` (Prisma) at `prisma/schema.prisma:68`
- `getStorefrontAccessToken()` + `createStorefrontAccessToken()` at `app/services/storefront-token.server.ts`
- Public proxy route `app/routes/api/api.storefront-products.tsx` that the widget already calls at `app/assets/bundle-widget-full-page.js:3178`

So the implementation is: add the inventory scope, extend the existing Storefront GraphQL query, and clamp in the widget.

## Implementation

### Layer 1 — Live inventory via Storefront API

1. **Add scope `unauthenticated_read_product_inventory`** to:
   - `shopify.app.toml`
   - `shopify.app.wolfpack-product-bundles-sit.toml` (if the scope list differs)
2. **Recreate SAT on scope change.** Shopify's delegated storefront access tokens snapshot the app's unauthenticated scopes at creation time. Existing tokens will NOT see the new scope. `handleScopesUpdate` in `app/services/webhooks/handlers/lifecycle.server.ts:142` currently only updates `session.scope`. Extend it to null out `session.storefrontAccessToken` so the next `getStorefrontAccessToken()` call in `storefront-token.server.ts:110` recreates the token with the new scope.
3. **Extend the Storefront query** in `app/routes/api/api.storefront-products.tsx` (the `VARIANT_QUERY` constant at line 26): add `quantityAvailable` and `currentlyNotInStock` to each variant node. Propagate in the response mapping at line 203.

No change to `bundle-formatter.server.ts` or the metafield cache — those paths are fed from DB-cached data which the widget already augments by calling `/api/storefront-products` at render time.

### Layer 2 — Widget clamp

File: `app/assets/bundle-widget-full-page.js`

1. **Store fetched inventory.** The fetch at line 3178 already hydrates `this.stepProductData[stepIndex]` with variant data. Add `available` (number|null) and `currentlyNotInStock` (boolean) fields from the response into each variant object.
2. **Add `getVariantAvailable(stepIndex, variantId)` helper.** Returns `{ available: number | null, outOfStock: boolean }`. Returns `{ available: null, outOfStock: false }` when the variant has no tracked inventory (treat as unlimited).
3. **Clamp in `updateProductSelection`** at line 3655:
   ```js
   const { available, outOfStock } = this.getVariantAvailable(stepIndex, productId);
   if (outOfStock) {
     ToastManager.show('This item is out of stock.');
     return;
   }
   if (available !== null && quantity > available) {
     quantity = available;
     ToastManager.show(`Only ${available} in stock — quantity adjusted.`);
   }
   ```
4. **Disable `+` button** when `available !== null && currentQuantity >= available`. Render state in `updateProductQuantityDisplay`.
5. **Disable "Add to Bundle" button** when `outOfStock`. Render card with `is-out-of-stock` class.
6. **Variant swap** at line 3620: re-clamp the moved quantity against the new variant's `available`.
7. **Low-stock badge** on cards when `available !== null && available <= 3`: render "Only N left".

Mirror all of the above in `app/assets/bundle-widget-product-page.js`.

### Layer 3 — Final gate (unchanged)

Existing cart transform + Shopify checkout inventory lock. No changes required. Previously considered a pre-checkout validation POST — deferred; clamp + real `quantityAvailable` should be sufficient.

## Commit sequence

1. **docs** — This document + issue file.
2. **feat** — Add `unauthenticated_read_product_inventory` scope + null SAT on scope update webhook.
3. **feat** — Extend Storefront query for `quantityAvailable` + `currentlyNotInStock`.
4. **feat** — Widget clamp logic + UI polish + `WIDGET_VERSION` bump + built bundles.
5. **test** — Unit tests for scope update handler + widget clamp helper.

Deploy gates:
- After commit 2: `npm run deploy:prod` or `npm run deploy:sit` (user-run) — merchants re-consent, SATs auto-recreate.
- After commit 4: `npm run deploy:prod` or `npm run deploy:sit` (user-run) — widget bundle goes live.

## Impact Analysis

- **Communities touched** (per `graphify-out/GRAPH_REPORT.md`):
  - "Inventory Sync Webhook Flow" — indirect (still owns bundle-level MIN)
  - Scope & SAT lifecycle (lifecycle.server.ts, storefront-token.server.ts)
  - Widget full-page + product-page (god nodes)
- **God nodes affected:** `BundleWidgetFullPage` (line 3655 onward), `api.storefront-products Route`
- **Downstream risk:**
  - Merchants not re-consenting to the new scope → SATs recreated without inventory scope → `quantityAvailable` returns GraphQL error. Mitigation: scope update webhook pathway; widget gracefully falls back to "no clamp" when inventory fields are missing from the response.
  - Widget bundle cache propagation delay (2–10 min) post-deploy — expected per CLAUDE.md.
- **Test coverage:**
  - `tests/unit/services/scope-update.test.ts` (new) — null SAT on scope change
  - `tests/unit/extensions/widget-clamp.test.ts` (new) — `getVariantAvailable`, clamp in `updateProductSelection`
  - Existing: `inventory-sync.test.ts`, `inventory-webhook.test.ts` — no change expected

## Open questions

- Do we need a pre-checkout validation endpoint (Layer 3)? → **No, deferred**. Shopify's checkout inventory lock is the final gate; clamp is belt-and-suspenders.
- Do we cache `quantityAvailable` in `StepProduct.variants`? → **No**. The widget already fetches fresh variant data via `/api/storefront-products` on every render; adding a DB cache would re-introduce the staleness problem we're trying to solve.
