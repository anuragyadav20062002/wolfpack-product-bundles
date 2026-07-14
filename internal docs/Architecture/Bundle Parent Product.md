---
schema_version: 1
id: bundle-parent-product
title: Bundle Parent Product
type: architecture
status: authoritative
summary: Shared neutral Shopify parent-product contract for FPB and PPB bundles.
last_audited: 2026-07-14
owners:
  - engineering
domains:
  - storefront
systems:
  - bundle-parent-product
source_paths:
  - app/services/bundles/bundle-parent-product.server.ts
  - app/services/bundles/metafield-sync/operations/bundle-product.server.ts
related_docs:
  - Architecture/FPB Host Evaluation.md
tags:
  - architecture
  - parent-product
keywords:
  - bundle-product-placeholder.avif
  - requiresComponents
---

# Bundle Parent Product

## Shared contract

Full Page Bundles and Product Page Bundles use the same Shopify parent product. `ensureBundleParentProduct()` owns creation and explicit sync invariants for both bundle types.

A newly created parent product has:

- Shopify status `UNLISTED`.
- Online Store publication only; incompatible sales channels are not included in the publication mutation.
- One default variant with price `0.00`, `inventoryPolicy: CONTINUE`, `taxable: false`, and `requiresComponents: true`.
- Canonical `${SHOPIFY_APP_URL}/bundle-product-placeholder.avif` media and neutral Wolfpack bundle-parent tags.
- Creation-only title, vendor, and troubleshooting description. PPB starts with the generated merchant-facing handle; FPB starts with the app-owned `wpb-parent-{bundleId}` handle.

Online Store publication discovery uses `Publication.name` with the app's current 2025-10 Admin API contract. Although Shopify deprecates this field in favor of `Catalog.title`, the installed app token returns every `Publication.catalog` as `null` on the agent store while returning the publication names. Using the single token-visible field avoids adding a broader catalog/markets permission or a fallback chain; revisit this when the app API version and scopes are upgraded together.

The service queries a stored `shopifyProductId` first. If Shopify returns no product, the service creates a replacement in the same operation. After creation it persists Shopify's returned product ID and actual handle before configuring the variant or publication. A later failure therefore remains retryable without deleting the created product or creating another product on the next explicit sync.

## Merchant ownership boundary

After creation, the merchant owns the parent product's title, description, media, status, and general merchandising metadata in Shopify. PPB handles remain merchant-owned. FPB handles are app-owned because the signed proxy is the sole storefront host; explicit FPB sync reserves a redirect from any live non-internal handle and restores `wpb-parent-{bundleId}` without writing status, publication, media, variants, or other merchandising fields.

Bundle availability and Shopify discoverability are separate controls:

- The Wolfpack bundle status controls whether the bundle configuration is available to the app/storefront runtime.
- The Shopify product status controls product discovery in collections, search, and other Shopify surfaces.
- Merchants use **Edit Product** in Shopify Admin to change parent-product discoverability.

No second product-status column or legacy status mapping is used.

## Explicit sync sequence

Sync Product and Sync Bundle both:

1. Ensure the parent exists.
2. Enforce the neutral default-variant contract.
3. Ensure Online Store publication.
4. Write standard Shopify bundle metafields and app-owned parent-variant metafields.
5. Persist Shopify's live handle.

FPB Sync Bundle returns the canonical app-proxy URL and performs no Shopify Page operation. PPB Sync Bundle remains product-hosted. Neither sync overwrites merchant-owned parent media.

## Storefront hosts

- FPB is hosted at `/apps/product-bundles/wpb/{bundleId}` through the signed app proxy.
- PPB remains hosted at `/products/{shopifyProductHandle}` through the parent product page.

The parent product is still required for both bundle types as the metafield owner and Cart Transform identity.

## Cart Transform pricing

The neutral `0.00` parent catalog price is not the bundle total. MERGE reads the selected component variants, quantities, parent variant ID, and pricing configuration from the signed runtime-token contract. EXPAND/display paths continue to use parent-variant metafields. `requiresComponents: true` identifies the default variant as a bundle parent. Component selection, checkout representation, and existing line properties are unchanged.
