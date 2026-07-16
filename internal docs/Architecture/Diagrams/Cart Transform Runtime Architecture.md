---
schema_version: 1
id: wpb-cart-transform-runtime
title: Cart Transform Runtime Architecture
type: architecture-diagram
status: authoritative
last_audited: 2026-07-14
summary: Signed runtime-token flow from storefront selection through Shopify Cart Transform merge and add-on Discount Function validation.
owners:
  - Engineering
domains:
  - checkout
  - cart-transform
  - pricing
systems:
  - Storefront widget
  - Remix app proxy
  - PostgreSQL
  - Shopify Cart
  - Rust Cart Transform Function
  - Rust Discount Function
operations:
  - runtime token issuance
  - cart line creation
  - HMAC verification
  - linesMerge
  - lineExpand
  - product discount generation
data_entities:
  - Bundle
  - BundleStep
  - RuntimeTokenPayload
  - CartLine
  - CartTransform
data_classification:
  - signed storefront input
  - app-owned secret
  - merchant configuration
source_paths:
  - app/routes/api/api.cart-transform-runtime-token.tsx
  - app/services/cart-transform-runtime-token.server.ts
  - app/services/cart-transform-service.server.ts
  - extensions/bundle-cart-transform-rs/shopify.extension.toml
  - extensions/bundle-cart-transform-rs/src/run.graphql
  - extensions/bundle-cart-transform-rs/src/merge.rs
  - extensions/bundle-cart-transform-rs/src/expand.rs
  - extensions/bundle-discount-function/src/cart_lines_discounts_generate_run.rs
related_docs:
  - ../Cart Transform Function.md
  - ../../Shopify Integration/Cart Transform API.md
  - ../../Features/Bundle Instance Tracking.md
related_diagrams:
  - Metafield Design and Consumption.md
  - Storefront Frontend Architecture.md
graphify:
  communities:
    - Cart Transform Run Logic
    - Cart Transform Logger
    - Bundle Pricing Calculation
  god_nodes:
    - bundle-widget-full-page.js Widget Source
tags:
  - architecture
  - mermaid
  - cart-transform
  - checkout
  - runtime-token
keywords:
  - _wolfpack_bundle_runtime
  - _wolfpackProductBundle:OfferId
  - runtime_token_secret
  - linesMerge
  - lineExpand
  - HMAC-SHA256
---

# Cart Transform Runtime Architecture

```mermaid
sequenceDiagram
    autonumber
    actor Customer
    participant Widget as FPB or PPB widget
    participant TokenRoute as Signed app-proxy token route
    participant DB as PostgreSQL via Prisma
    participant Admin as Shopify Admin API
    participant Cart as Shopify Cart
    participant Transform as Rust Cart Transform
    participant Discount as Rust Discount Function
    participant Checkout as Shopify Checkout

    Customer->>Widget: Select components and optional add-ons
    Widget->>TokenRoute: POST bundleId, bundleType, offerGroupId, selections
    TokenRoute->>TokenRoute: Verify Shopify app-proxy signature
    TokenRoute->>DB: Load current bundle, steps, categories, pricing
    TokenRoute->>Admin: Resolve bundle parent ProductVariant GID
    TokenRoute->>TokenRoute: Validate selected variants and quantities
    TokenRoute->>TokenRoute: Sign RuntimeTokenPayload with shop-derived HMAC secret
    TokenRoute-->>Widget: _wolfpack_bundle_runtime
    Widget->>Cart: Add component and add-on lines with bundle attributes
    Cart->>Transform: cart.transform.run input
    Transform->>Transform: Read CartTransform $app.runtime_token_secret
    Transform->>Transform: Verify signature, offer group, variants, quantities, parent, pricing
    alt Valid base component group
        Transform-->>Cart: linesMerge to bundle parent
    else Parent line requires expansion
        Transform-->>Cart: lineExpand from parent variant metafields
    else Missing, tampered, or mismatched token
        Transform-->>Cart: No merge operation
    end
    Cart->>Discount: Product discount function input
    Discount->>Discount: Verify the same runtime token contract
    opt Authorized discounted add-on
        Discount-->>Cart: Native product discount candidate named Add On
    end
    Cart-->>Checkout: Parent bundle plus separate add-ons and native discounts
    Checkout-->>Customer: Render final lines, savings, and bundle details
```

## Trust boundaries

- Storefront selections are untrusted until the signed app-proxy route validates them against the current database bundle.
- The HMAC secret is derived server-side and synchronized to the active CartTransform owner as `$app.runtime_token_secret`.
- Cart Transform and Discount Function independently reject missing, tampered, or selection-mismatched tokens.
- Add-on lines stay outside the parent `linesMerge`; authorized add-on savings are emitted by the Discount Function.
