---
schema_version: 1
id: wpb-metafield-design-consumption
title: Metafield Design and Consumption
type: architecture-diagram
status: authoritative
last_audited: 2026-07-14
summary: Owner, writer, payload, and consumer map for page, product-variant, CartTransform, cart, and order metafields.
owners:
  - Engineering
domains:
  - metafields
  - storefront-sync
  - checkout
systems:
  - Remix services
  - Shopify Admin API
  - Shopify Storefront API
  - Liquid theme extension
  - Shopify Functions
  - Shopify Orders
operations:
  - metafieldsSet
  - cartMetafieldsSet
  - cart-to-order copy
  - Liquid metafield read
  - Function input query
data_entities:
  - Page
  - ProductVariant
  - CartTransform
  - Cart
  - Order
data_classification:
  - app-owned configuration
  - public Liquid bootstrap context
  - signed runtime secret
  - order display metadata
source_paths:
  - app/services/bundles/metafield-sync/operations/bundle-product.server.ts
  - app/services/bundles/metafield-sync/operations/definitions.server.ts
  - app/services/widget-installation/widget-full-page-bundle.server.ts
  - app/services/cart-transform-service.server.ts
  - app/routes/api/api.cart-bundle-details.tsx
  - extensions/bundle-builder/blocks/bundle-full-page.liquid
  - extensions/bundle-builder/blocks/bundle-product-page.liquid
  - extensions/bundle-cart-transform-rs/src/run.graphql
  - shopify.app.toml
  - shopify.app.wolfpack-product-bundles-sit.toml
related_docs:
  - ../../Shopify Integration/Metafields.md
  - ../Cart Transform Function.md
  - ../Widget Architecture.md
related_diagrams:
  - Cart Transform Runtime Architecture.md
  - Storefront Frontend Architecture.md
graphify:
  communities:
    - Metafield Architecture
    - Metafield Cleanup Service
    - Cart Transform Run Logic
  god_nodes:
    - bundle-widget-full-page.js Widget Source
tags:
  - architecture
  - mermaid
  - metafields
  - data-flow
keywords:
  - custom.bundle_config
  - $app.bundle_ui_config
  - $app.component_reference
  - $app.component_quantities
  - $app.price_adjustment
  - $app.component_pricing
  - $app.runtime_token_secret
  - $app.bundle_details
---

# Metafield Design and Consumption

```mermaid
flowchart LR
    subgraph Writers[Application writers]
        Sync[Storefront sync service]
        VariantWriter[Bundle product metafield writer]
        PageWriter[Full-page page writer]
        TransformSetup[CartTransform setup service]
        CartDetails[Signed cart bundle-details route]
    end

    subgraph Owners[Shopify owners and metafields]
        Page[(Page\ncustom.bundle_config\ncustom.bundle_settings)]
        Variant[(Bundle ProductVariant\n$app.component_reference\n$app.component_quantities\n$app.price_adjustment\n$app.bundle_ui_config\n$app.component_pricing)]
        CT[(CartTransform\n$app.runtime_token_secret\n$app.bundle_cart_line_messaging)]
        Cart[(Cart\n$app.bundle_details)]
        Order[(Order\n$app.bundle_details)]
    end

    subgraph Consumers[Runtime consumers]
        FpbLiquid[FPB Liquid and page marker context]
        PpbLiquid[PPB Liquid bundle detection and bootstrap]
        Proxy[App-proxy bundle API]
        Widget[FPB or PPB widget]
        Transform[Cart Transform Function]
        Discount[Discount Function]
        OrderTools[Shopify order surfaces and downstream integrations]
    end

    Sync --> VariantWriter
    Sync --> PageWriter
    Sync --> TransformSetup
    PageWriter -->|Admin API metafieldsSet| Page
    VariantWriter -->|Admin API metafieldsSet| Variant
    TransformSetup -->|Admin API metafieldsSet| CT
    CartDetails -->|Storefront API cartMetafieldsSet| Cart
    Cart -->|cart_to_order_copyable| Order

    Page -. bootstrap and placement context .-> FpbLiquid
    Variant -->|bundle_ui_config context| PpbLiquid
    FpbLiquid --> Widget
    PpbLiquid --> Widget
    Proxy -->|current full runtime payload| Widget
    Variant -->|EXPAND and display metadata| Transform
    CT -->|secret and messaging| Transform
    CT -->|shared verification secret| Discount
    Order --> OrderTools
```

## Ownership and lifecycle

| Owner | Namespace/key | Primary writer | Primary consumer | Lifecycle note |
|---|---|---|---|---|
| Page | `custom.bundle_config` | Full-page page writer | FPB Liquid/page marker context | Synced with the linked Shopify page; runtime still hydrates current bundle data through the app proxy. |
| Page | `custom.bundle_settings` | Full-page page writer | Display/bootstrap context | Keeps lightweight display settings separate from the full config. |
| Bundle ProductVariant | `$app.bundle_ui_config` | Bundle product metafield writer | PPB Liquid context | Detects the product-page bundle and provides bundle identity; widget fetches current runtime data from the app proxy. |
| Bundle ProductVariant | `$app.component_reference`, `$app.component_quantities` | Bundle product metafield writer | Cart Transform | Supplies the EXPAND component contract. |
| Bundle ProductVariant | `$app.price_adjustment`, `$app.component_pricing` | Bundle product metafield writer | Cart Transform | Supplies pricing and component display data for parent-line expansion. |
| CartTransform | `$app.runtime_token_secret` | CartTransform setup service | Cart Transform and Discount Function | Must match the shop-derived server signing secret. |
| CartTransform | `$app.bundle_cart_line_messaging` | CartTransform setup service | Cart Transform | Controls Function-side cart-line messaging. |
| Cart | `$app.bundle_details` | Signed app-proxy route via Storefront API | Shopify copy pipeline | Accumulates bundle display properties by bundle instance. |
| Order | `$app.bundle_details` | Shopify cart-to-order copy | Order surfaces and downstream integrations | Enabled by matching app config definition with `cart_to_order_copyable`. |

Component-variant `$app.component_parents` is intentionally absent: signed runtime-token validation is the current MERGE authorization source.
