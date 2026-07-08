---
title: Metafields
type: shopify-integration
audited: 2026-04-16
sources: extensions/bundle-builder/blocks/bundle-full-page.liquid, app/services/bundles/metafield-sync/
---

# Metafields

## Bundle Config Metafield

**Namespace/key**: `custom.bundle_config`
**Owner type**: Page
**Access**: `page.metafields.custom.bundle_config`

Stores the full FPB bundle configuration written by "Place Widget Now" and "Sync Bundle". Current full-page storefront markup does not serialize this full payload into page HTML; both the section app block and the hidden app-embed marker emit a compact bootstrap pointer and hydrate current bundle data through the app-proxy bundle API. This avoids stale page metafields or stale page-body marker HTML rendering an old template or product/category set before the API refresh corrects it.

### Writer
`app/services/bundles/metafield-sync/bundle-config-metafield.server.ts`

### Readers (Liquid / Page Body Marker)
```liquid
data-bundle-config='{"v":2,"type":"full_page","bundleType":"full_page","id":"...","bundleDesignTemplate":"FBP_SIDE_FOOTER","bundleDesignPresetId":"CLASSIC"}'
```

The hidden `data-wpb-full-page-bundle` marker written by `app/services/widget-installation/widget-full-page-bundle.server.ts` uses the same compact payload. The template and preset fields are lightweight visual route hints only; the widget still hydrates current products, steps, rules, and pricing through the app-proxy bundle API before rendering.

FPB runtime layout is template/preset-driven. `bundleDesignTemplate: "FBP_SIDE_FOOTER"` selects the full-page side-footer renderer and `bundleDesignPresetId` selects Standard, Classic, Compact, or Horizontal styling. The older `Bundle.fullPageLayout` database column is legacy storage only until a future schema migration; it must not be emitted in Admin save transport, app-proxy widget payloads, or FPB runtime metafield configs.

### Reader (Widget JS)
`app/assets/bundle-widget-full-page.js` → `loadBundleData()`

## Sync Rule

If the bundle config structure changes:
1. Update the **server writer** (`bundle-config-metafield.server.ts`)
2. Update the **widget parser** (`bundle-widget-full-page.js`)
3. Both must be updated in the same change — never one without the other
4. Bump `WIDGET_VERSION` and show a sync prompt banner so merchants re-sync

## Async Storefront Sync

As of 2026-07-08, Admin save requests persist bundle data to Postgres and enqueue `bundle/storefront-sync.requested` instead of waiting for Shopify storefront publication. The event payload is intentionally small: `shopDomain`, `bundleId`, `bundleType`, `reason`, and `attemptId`.

The Inngest worker reloads the bundle from DB, opens an unauthenticated Admin client for the shop, activates the Cart Transform, then writes page/product/component metafields. `Bundle.storefrontSyncStatus` tracks `queued`, `syncing`, `synced`, or `failed`; the configure pages show that state and expose retry. This keeps large component sets from turning Admin save into a long-running Shopify API request.

Component variant `$app:component_parents` writes must use `metafieldsSet` batches of at most 25 inputs. A 260-variant bundle should produce 11 mutations, not 260 one-variant mutations.

## Why Bootstrap Hydration

Full-page storefront markup uses a compact bootstrap marker so first render hydrates from the current app-proxy payload. The proxy path keeps a 3s retry for `503`/`504` responses to handle Render cold starts. The page metafield and hidden page-body marker remain useful for sync/install state, but neither must be treated as the first-paint full payload because Shopify page HTML can outlive a template change. The compact marker may carry `bundleDesignTemplate` and `bundleDesignPresetId` so the app embed can stamp the initial shell and load the correct preset stylesheet before proxy hydration, preventing a Standard-looking shell before Classic initializes.

Saving a placed FPB refreshes the hidden page-body marker before writing page metafields. This keeps template changes visible through the dev tunnel without requiring an app deploy or a separate placement refresh.

## Size Constraints

Shopify metafield values have a 64KB hard limit. The bundle variant `$app.bundle_ui_config` payload is especially sensitive for category-backed FPB/PPB bundles because category products can include rich product, image, option, and variant objects.

Runtime category payloads must be compacted at `app/lib/bundle-config/category-runtime.ts` before they are written by `app/services/bundles/metafield-sync/operations/bundle-product.server.ts`. Preserve storefront-required fields only: product IDs/title/handle/image/price/weight, compact product options, and compact variants with ID/title/price/compare-at/weight/availability/inventory/options/image/selling-plan data. Strip admin/cache-only fields such as metafields, SKU, selectedOptions blobs, inventory policy, timestamps, and extra image metadata.

Admin save transport should follow the same compact-field policy before posting `stepsData`. The route-level FPB save serializer is responsible for stripping picker/Admin graph data while preserving the product, variant, collection, category, and rule fields needed by persistence and storefront runtime generation.

## FPB Preview Cache Contract

Pending Bundle Visibility preview pages render from a generated Shopify page body with inline `data-bundle-config`. The full-page widget only trusts this cached config when the bundle has both `bundleDesignTemplate` and `bundleDesignPresetId`. Therefore `formatBundleForWidget()` must default full-page bundles with empty design fields to Standard Design: `bundleDesignTemplate: "FBP_SIDE_FOOTER"` and `bundleDesignPresetId: "STANDARD"`. Without those explicit defaults, preview can ignore the fresh inline config and fall back to stale/proxy behavior.

## Bundle Details Order Attribution

The storefront widgets write app-owned cart metafield `bundle_details` through the signed app-proxy route `/apps/product-bundles/api/cart-bundle-details`. The route uses Storefront API `cartMetafieldsSet` without a namespace, so Shopify stores the key in the app-owned namespace (`$app`).

`shopify.app.toml` and `shopify.app.wolfpack-product-bundles-sit.toml` define `[order.metafields.app.bundle_details]` with `capabilities.cart_to_order_copyable = true`. Shopify requires the cart and order metafields to have matching namespace and key before checkout completion can copy the cart value to the order.

This preserves EB-style bundle display metadata on created orders without adding a post-order reconstruction job.
