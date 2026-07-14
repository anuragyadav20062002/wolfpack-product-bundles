---
title: Bundle Parent Product
type: architecture
audited: 2026-07-14
sources: app/services/bundles/bundle-parent-product.server.ts; app/services/bundles/metafield-sync/operations/bundle-product.server.ts
---

# Bundle Parent Product

## Shared contract

Full Page Bundles and Product Page Bundles use the same Shopify parent product. `ensureBundleParentProduct()` owns creation and explicit sync invariants for both bundle types.

A newly created parent product has:

- Shopify status `UNLISTED`.
- Online Store publication only; incompatible sales channels are not included in the publication mutation.
- One default variant with price `0.00`, `inventoryPolicy: CONTINUE`, `taxable: false`, and `requiresComponents: true`.
- Wolfpack placeholder media and neutral Wolfpack bundle-parent tags.
- Creation-only title, handle, vendor, and troubleshooting description.

Online Store publication discovery uses the non-deprecated `Catalog.title`. Shopify returns a generated catalog title such as `Channel Catalog 193382154499 for Online Store`, so matching the literal `Online Store` is incorrect; identify the Online Store catalog by its ` for Online Store` suffix.

The service queries a stored `shopifyProductId` first. If Shopify returns no product, the service creates a replacement in the same operation. After creation it persists Shopify's returned product ID and actual handle before configuring the variant or publication. A later failure therefore remains retryable without deleting the created product or creating another product on the next explicit sync.

## Merchant ownership boundary

After creation, the merchant owns the parent product's title, description, handle, media, status, and general merchandising metadata in Shopify. Bundle saves and status changes do not write those fields. Explicit Sync Product and Sync Bundle read the live handle and refresh only `Bundle.shopifyProductHandle` when it changed.

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

FPB Sync Bundle additionally preserves its existing Shopify Page reset/create lifecycle. PPB Sync Bundle does not archive or delete the parent product.

## Storefront hosts

- FPB remains hosted at `/pages/{shopifyPageHandle}` through a Shopify Page.
- PPB remains hosted at `/products/{shopifyProductHandle}` through the parent product page.

The parent product is still required for both bundle types as the metafield owner and Cart Transform identity.

## Cart Transform pricing

The neutral `0.00` parent catalog price is not the bundle total. MERGE reads the selected component variants, quantities, parent variant ID, and pricing configuration from the signed runtime-token contract. EXPAND/display paths continue to use parent-variant metafields. `requiresComponents: true` identifies the default variant as a bundle parent. Component selection, checkout representation, and existing line properties are unchanged.
