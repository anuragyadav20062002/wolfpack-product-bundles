---
title: System Overview
type: architecture
audited: 2026-07-10
sources: docs/APPLICATION_ARCHITECTURE.md, docs/DEPLOYMENT.md, prisma/schema.prisma
---

# System Overview

## Stack

| Layer | Technology |
|---|---|
| Framework | Remix (Shopify App template) |
| Runtime | Node.js 22 |
| Database | PostgreSQL (production), SQLite (dev) |
| ORM | Prisma |
| Hosting | Render (app server) |
| CDN / Extensions | Shopify (via `shopify app deploy`) |
| Auth | Shopify OAuth (session-based via `@shopify/shopify-app-remix`) |

---

## Services

### App Server (Render)
- Remix SSR + API routes
- Serves admin UI (merchant dashboard)
- Proxies storefront API calls via `/apps/product-bundles/`
- Cold-start latency: ~3–10s on free/starter Render plans — widget has retry logic for this

### Shopify Extensions
Three deployed extensions:

| Extension | Type | Description |
|---|---|---|
| `bundle-builder` | App Block / Theme App Extension | Liquid blocks for FPB and PDP widgets |
| `bundle-cart-transform-ts` | Cart Transform Function (TS/WASM) | MERGE/EXPAND bundle lines at checkout |
| `bundle-checkout-ui` | Checkout UI Extension (Preact) | Per-line-item bundle display in checkout + thank-you |

### Widget Architecture
See [[Architecture/Widget Architecture]] for FPB/PDP load strategy and versioning.

---

## Key Services in `app/services/`

- **`bundles/`**: Core bundle CRUD, settings merge, CSS generation
- **`bundles/metafield-sync/`**: Writes bundle config to Shopify metafield for zero-latency widget load
- **`billing/`**: Shopify Billing API integration
- **`inventory/`**: Bundle inventory sync (MIN of component quantities / step qty)
- **`unauthenticated.admin(shopDomain)`**: Admin GraphQL client for webhooks/background jobs — exported from `app/shopify.server.ts:140`

---

## God Nodes (from Graphify)

From `graphify-out/GRAPH_REPORT.md`:
1. **BundleWidgetFullPage** — FPB widget source
2. **BundleWidgetProductPage** — PDP widget source
3. **AppStateService** — central state management
4. **CartTransformRun** — cart transform function entry
5. **BillingService** — billing + plan enforcement

---

## Corrections vs APPLICATION_ARCHITECTURE.md

- Node.js version: doc said 18+/20+ → **actual: 22**
- Missing DB models: `DesignSettings`, `OrderAttribution`, `BundleAnalytics`
- `BundleStatus.unlisted` not documented
- `FullPageLayout` enum not documented
- DB schema shown in doc is outdated (Nov 2025 vs current)
