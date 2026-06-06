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

Used as the primary (zero-latency) data source for the FPB widget. The entire bundle configuration is serialised to JSON and stored here when a merchant clicks "Place Widget Now" or "Sync Bundle".

### Writer
`app/services/bundles/metafield-sync/bundle-config-metafield.server.ts`

### Reader (Liquid)
```liquid
data-bundle-config="{{ page.metafields.custom.bundle_config | escape }}"
```

### Reader (Widget JS)
`app/assets/bundle-widget-full-page.js` → `loadBundleConfig()` (~line 325)

## Sync Rule

If the bundle config structure changes:
1. Update the **server writer** (`bundle-config-metafield.server.ts`)
2. Update the **widget parser** (`bundle-widget-full-page.js`)
3. Both must be updated in the same change — never one without the other
4. Bump `WIDGET_VERSION` and show a sync prompt banner so merchants re-sync

## Why Metafield Caching

Before this pattern, widgets on cold-start Render instances would silently fail — the proxy call timed out. The metafield cache eliminates the network round-trip for the common case. The proxy fallback with 3s retry handles edge cases.

## Size Constraints

Shopify metafield values have a 64KB hard limit. The bundle variant `$app.bundle_ui_config` payload is especially sensitive for category-backed FPB/PPB bundles because category products can include rich product, image, option, and variant objects.

Runtime category payloads must be compacted at `app/lib/bundle-config/category-runtime.ts` before they are written by `app/services/bundles/metafield-sync/operations/bundle-product.server.ts`. Preserve storefront-required fields only: product IDs/title/handle/image/price, compact product options, and compact variants with ID/title/price/compare-at/availability/inventory/options/image/selling-plan data. Strip admin/cache-only fields such as metafields, SKU, selectedOptions blobs, inventory policy, timestamps, and extra image metadata.

## FPB Preview Cache Contract

Pending Bundle Visibility preview pages render from a generated Shopify page body with inline `data-bundle-config`. The full-page widget only trusts this cached config when the bundle has both `bundleDesignTemplate` and `bundleDesignPresetId`. Therefore `formatBundleForWidget()` must default full-page bundles with empty design fields to Standard Design: `bundleDesignTemplate: "FBP_SIDE_FOOTER"` and `bundleDesignPresetId: "DEFAULT"`. Without those explicit defaults, preview can ignore the fresh inline config and fall back to stale/proxy behavior.
