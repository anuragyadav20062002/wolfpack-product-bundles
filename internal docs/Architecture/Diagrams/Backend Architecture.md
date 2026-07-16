---
schema_version: 1
id: wpb-backend-architecture
title: Backend Architecture
type: architecture-diagram
status: authoritative
last_audited: 2026-07-14
summary: Layered Remix backend architecture across embedded Admin, app-proxy, webhook, domain-service, persistence, and Shopify integration boundaries.
owners:
  - Engineering
domains:
  - backend
  - authentication
  - persistence
  - shopify-integration
systems:
  - Remix
  - Shopify OAuth
  - PostgreSQL
  - Prisma
  - Shopify Admin API
  - Shopify Storefront API
  - Shopify Functions
  - Render
operations:
  - loader
  - action
  - app-proxy verification
  - webhook processing
  - bundle persistence
  - storefront sync
  - metafield synchronization
  - function activation
data_entities:
  - Session
  - Shop
  - Bundle
  - BundleStep
  - Product
  - DiscountSettings
  - DesignSettings
  - OrderAttribution
data_classification:
  - merchant configuration
  - OAuth credentials
  - signed storefront requests
  - operational events
source_paths:
  - app/routes/app/
  - app/routes/api/
  - app/lib/auth-guards.server.ts
  - app/lib/app-proxy.server.ts
  - app/shopify.server.ts
  - app/services/bundles/
  - app/services/cart-transform-service.server.ts
  - app/services/webhooks/
  - app/db.server.ts
  - prisma/schema.prisma
related_docs:
  - ../System Overview.md
  - ../Database Schema.md
  - ../../Shopify Integration/Admin API.md
  - ../../Shopify Integration/Storefront API.md
related_diagrams:
  - Admin UI Frontend Architecture.md
  - Storefront Frontend Architecture.md
  - Metafield Design and Consumption.md
graphify:
  communities:
    - App Routes and Pages
    - Bundle Configuration Handlers
    - Cached Session Storage
    - App Logger
  god_nodes:
    - requireAdminSession
    - AppLogger
tags:
  - architecture
  - mermaid
  - backend
  - remix
  - prisma
keywords:
  - loader action
  - app proxy
  - unauthenticated.admin
  - expiring offline token
  - storefront sync
---

# Backend Architecture

```mermaid
flowchart TB
    subgraph Clients[Request sources]
        AdminBrowser[Embedded Admin browser]
        Storefront[Storefront browser]
        ShopifyHooks[Shopify webhooks]
        Extensions[Shopify Functions and extensions]
    end

    subgraph Edge[Remix route boundary on Render]
        AdminRoutes[Admin loaders and actions]
        ProxyRoutes[Signed app-proxy API routes]
        WebhookRoutes[Webhook receiver routes]
        PublicRoutes[Public and callback routes]
    end

    subgraph Security[Identity and trust layer]
        AdminAuth[requireAdminSession and authenticate.admin]
        ProxyAuth[verifyAppProxyRequest]
        WebhookAuth[Shopify webhook authentication]
        Sessions[Cached session storage and expiring offline token lifecycle]
    end

    subgraph Domain[Domain and orchestration services]
        BundleService[Bundle CRUD and configure handlers]
        SyncService[Storefront sync orchestration]
        MetaService[Metafield writers and definitions]
        CartService[CartTransform and Discount Function activation]
        ThemeService[Theme, placement, and asset services]
        AnalyticsService[Attribution, analytics, and app events]
        WebhookService[Webhook processor and handlers]
    end

    subgraph Persistence[Application persistence]
        Prisma[Prisma data access]
        DB[(PostgreSQL)]
    end

    subgraph Shopify[Shopify platform boundaries]
        AdminAPI[Admin GraphQL API]
        StorefrontAPI[Storefront GraphQL API]
        ThemeExt[Theme app extension assets and Liquid]
        FunctionState[CartTransform and Discount Function state]
    end

    AdminBrowser --> AdminRoutes
    Storefront --> ProxyRoutes
    ShopifyHooks --> WebhookRoutes
    Extensions --> ProxyRoutes
    AdminRoutes --> AdminAuth
    ProxyRoutes --> ProxyAuth
    WebhookRoutes --> WebhookAuth
    PublicRoutes --> Sessions
    AdminAuth --> Sessions
    Sessions --> Prisma

    AdminRoutes --> BundleService
    ProxyRoutes --> BundleService
    ProxyRoutes --> AnalyticsService
    WebhookRoutes --> WebhookService
    BundleService --> SyncService
    SyncService --> CartService
    SyncService --> MetaService
    SyncService --> ThemeService
    WebhookService --> BundleService
    BundleService --> Prisma
    AnalyticsService --> Prisma
    WebhookService --> Prisma
    Prisma --> DB

    BundleService --> AdminAPI
    MetaService --> AdminAPI
    CartService --> AdminAPI
    ThemeService --> AdminAPI
    ProxyRoutes --> StorefrontAPI
    MetaService --> ThemeExt
    CartService --> FunctionState
```

## Boundary rules

- Admin routes authenticate merchant requests before loaders/actions reach domain services.
- App-proxy routes verify Shopify signatures before accepting storefront inputs.
- Background Admin API work uses the stored expiring offline-session path; services must not read raw Prisma access tokens directly.
- Domain services own Shopify mutations and persistence orchestration; route files own HTTP parsing and response shape.
- Storefront sync reloads the canonical bundle from PostgreSQL, activates required Function state, and then writes Shopify resources.
