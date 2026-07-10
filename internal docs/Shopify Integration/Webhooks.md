---
title: Webhooks
type: shopify-integration
audited: 2026-07-08
sources: shopify.app.toml, shopify.app.wolfpack-product-bundles-sit.toml, app/services/webhooks/processor.server.ts
---

# Webhooks

## App Config Subscriptions

The app subscribes only to operational webhook topics that are required across installs:

- `app_purchases_one_time/update`
- `app_subscriptions/update`
- `app/uninstalled`
- `app/scopes_update`
- `products/delete`

Broad topics that generated high delivery volume without a required runtime effect are intentionally not subscribed:

- `products/update`
- `inventory_levels/update`
- `orders/create`

Shopify sends every event matching a subscribed topic. Filtering after receipt still counts as a Shopify delivery, so broad product and inventory topics can create high delivery counts even when most payloads do not affect a Wolfpack bundle.

## Product Delete

`products/delete` is retained because it is the only product catalog webhook currently required for bundle integrity. The handler removes deleted products from bundle steps and archives active bundles that would otherwise contain empty steps.

## App Uninstall Cleanup

`app/uninstalled` removes app-owned operational data for the shop: bundles and their cascaded child records, sessions, design settings, queued jobs, compliance records, old webhook events, old business events, and the shop record.

Revenue analytics are intentionally retained after uninstall. `OrderAttribution` and `BundleEngagement` are not deleted by the uninstall handler because they power historical revenue and funnel reporting for merchant performance driven by the app.

The handler deletes old `BusinessEvent` rows before writing the final `app_uninstalled` event so churned shops do not keep growing event-log storage while still preserving a final uninstall marker.

## Removed Topics

`orders/create` is not subscribed because order attribution is handled by the Web Pixel to `/api/attribution`; the existing order webhook handler is a no-op stub.

`products/update` is not subscribed because Shopify cannot filter it by Wolfpack DB membership. Reintroducing it would deliver all product updates unless the app also writes and maintains a Shopify-side marker such as a tag or metafield.

`inventory_levels/update` is not subscribed because each event requires a shop-wide bundle lookup before inventory sync. Runtime storefront inventory checks and explicit bundle sync flows should own this until there is a narrower, Shopify-side event filter.
