---
schema_version: 1
id: wpb-storefront-frontend
title: Storefront Frontend Architecture
type: architecture-diagram
status: authoritative
last_audited: 2026-07-14
summary: Theme-extension bootstrap, metafield context, API-first runtime hydration, widget composition, asset loading, and cart submission architecture.
owners:
  - Engineering
domains:
  - storefront
  - frontend
  - widgets
systems:
  - Shopify theme
  - Theme app extension
  - Shopify CDN
  - FPB widget
  - PPB widget
  - Wolfpack SDK
  - Remix app proxy
  - Shopify Cart
operations:
  - Liquid render
  - asset_url load
  - bundle hydration
  - template resolution
  - product selection
  - add to cart
  - cart metafield sync
data_entities:
  - compact bootstrap marker
  - bundle_ui_config
  - bundle runtime payload
  - widget selection state
  - cart line properties
data_classification:
  - public storefront configuration
  - signed cart authorization
  - customer selections
source_paths:
  - extensions/bundle-builder/blocks/bundle-app-embed.liquid
  - extensions/bundle-builder/blocks/bundle-full-page.liquid
  - extensions/bundle-builder/blocks/bundle-product-page.liquid
  - app/assets/bundle-widget-full-page.js
  - app/assets/bundle-widget-product-page.js
  - app/assets/widgets/shared/
  - app/assets/sdk/
  - app/routes/api/api.bundle.$bundleId[.]json.tsx
  - app/routes/api/api.cart-transform-runtime-token.tsx
  - app/routes/api/api.cart-bundle-details.tsx
related_docs:
  - ../Widget Architecture.md
  - ../../Shopify Integration/Metafields.md
related_diagrams:
  - Metafield Design and Consumption.md
  - Cart Transform Runtime Architecture.md
  - Backend Architecture.md
graphify:
  communities:
    - Full-Page Bundle Widget Source
    - Product-Page Bundle Widget Source
    - Bundle Data Manager Shared
    - Widget Theme Template Service
  god_nodes:
    - bundle-widget-full-page.js Widget Source
tags:
  - architecture
  - mermaid
  - storefront
  - frontend
  - widgets
keywords:
  - FPB
  - PPB
  - Liquid
  - asset_url
  - data-bundle-config
  - app proxy
  - bundle_ui_config
---

# Storefront Frontend Architecture

```mermaid
flowchart TD
    Customer[Customer browser]

    subgraph Theme[Shopify theme and theme app extension]
        Embed[Wolfpack app embed]
        FPB[Full-page app block]
        PPB[Product-page app block]
        PageMeta[(Page metafield context)]
        VariantMeta[(Bundle ProductVariant bundle_ui_config)]
        Marker[Compact data-bundle-config marker]
        Assets[Shopify asset_url JS and CSS URLs]
    end

    subgraph CDN[Shopify CDN assets]
        FpbBundle[FPB bundled controller]
        PpbBundle[PPB bundled controller]
        SDK[Optional Wolfpack SDK]
        Shared[Inlined shared engine and template modules]
        CSS[Base and template CSS assets]
    end

    subgraph Runtime[Browser runtime]
        Detect[Detect bundle type and validate marker]
        Hydrate[Fetch current bundle payload]
        Resolve[Resolve canonical template and methods]
        State[Selection, pricing, validation, locale, and modal state]
        Render[Content-driven responsive renderer]
        Submit[Cart submission engine]
    end

    subgraph AppProxy[Signed Remix app-proxy APIs]
        BundleAPI[GET bundle JSON with cache validators]
        TokenAPI[POST runtime token]
        DetailsAPI[POST cart bundle details]
        ViewAPI[POST bundle view analytics]
    end

    Cart[Shopify Cart]

    Customer --> Embed
    Customer --> FPB
    Customer --> PPB
    PageMeta -. FPB placement and bootstrap context .-> FPB
    VariantMeta -. PPB identity and bundle-type context .-> PPB
    Embed --> Marker
    FPB --> Marker
    PPB --> Marker
    Embed --> Assets
    FPB --> Assets
    PPB --> Assets
    Assets --> FpbBundle
    Assets --> PpbBundle
    Assets --> SDK
    Assets --> CSS
    Shared --> FpbBundle
    Shared --> PpbBundle
    FpbBundle --> Detect
    PpbBundle --> Detect
    SDK --> Detect
    Marker --> Detect
    Detect --> Hydrate
    Hydrate --> BundleAPI
    BundleAPI -->|current full runtime payload; retry only 503 or 504| Hydrate
    Hydrate --> Resolve
    Resolve --> State
    CSS --> Render
    State --> Render
    Render --> Submit
    Submit --> TokenAPI
    TokenAPI -->|signed runtime token| Submit
    Submit --> Cart
    Submit --> DetailsAPI
    Render -. non-blocking view event .-> ViewAPI
```

## Runtime boundaries

- Liquid owns placement, compact identity/bootstrap context, and Shopify CDN asset URLs.
- The app-proxy bundle endpoint owns current full runtime configuration for both FPB and PPB.
- Widget entry files compose shared engine modules and template-specific method/config modules into the active renderer.
- Browser state is storefront-local; it does not use the Admin Redux store.
- The cart submission path requests authorization immediately before adding lines, then synchronizes `bundle_details` separately for order metadata.
