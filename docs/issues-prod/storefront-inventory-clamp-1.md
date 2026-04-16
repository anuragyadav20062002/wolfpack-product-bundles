# Issue: Per-Component Stock Clamping in Bundle Widget

**Issue ID:** storefront-inventory-clamp-1
**Status:** In Progress
**Priority:** 🟡 Medium
**Created:** 2026-04-16
**Last Updated:** 2026-04-16

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

## Phases Checklist

- [x] Architecture + issue file (commit 1)
- [ ] Add `unauthenticated_read_product_inventory` scope + auto-recreate SAT on `app/scopes_update` (commit 2) — **requires app deploy**
- [ ] Extend Storefront query in `api.storefront-products.tsx` with `quantityAvailable` + `currentlyNotInStock` (commit 3)
- [ ] Widget clamp logic in `updateProductSelection` + UI polish + `WIDGET_VERSION` bump + built bundles (commit 4) — **requires widget deploy**
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
