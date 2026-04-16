---
type: community
cohesion: 0.07
members: 38
---

# Community 11

**Cohesion:** 0.07 - loosely connected
**Members:** 38 nodes

## Members
- [[Ad-Ready Bundle Infrastructure Feature Specification]] - document - docs/ad-ready-bundles/FEATURE-SPEC.md
- [[Ad-Ready Bundles Architecture Decision Record]] - document - docs/ad-ready-bundles/03-architecture.md
- [[Ad-Ready Bundles PO Requirements]] - document - docs/ad-ready-bundles/02-PO-requirements.md
- [[Ad-Ready Bundles SDE Implementation Plan]] - document - docs/ad-ready-bundles/04-SDE-implementation.md
- [[Analytics Page Redesign PO Requirements]] - document - docs/analytics-redesign/02-PO-requirements.md
- [[Analytics Pixel Toggle PO Requirements]] - document - docs/analytics-pixel-toggle/02-PO-requirements.md
- [[Bundle Variant Price Fix ($0 to Calculated)]] - document - docs/ad-ready-bundles/BREAKING-CHANGES.md
- [[Campaign Bundles (UNLISTED Status)]] - document - docs/ad-ready-bundles/FEATURE-SPEC.md
- [[Critical Price Calculation Fix (January 2025)]] - document - docs/archive/CRITICAL-PRICE-CALCULATION-FIX.md
- [[Hook useBundleForm]] - document - docs/archive/REFACTORING_GUIDE.md
- [[Hook useBundlePricing]] - document - docs/archive/REFACTORING_GUIDE.md
- [[Hook useBundleSteps]] - document - docs/archive/REFACTORING_GUIDE.md
- [[Inngest Remix Serve Route (api.inngest.tsx)]] - source - docs/issues-prod/inngest-webhook-queue-1.md
- [[Inngest Webhook Queue — Architecture ADR]] - document - docs/inngest-webhook-queue/03-architecture.md
- [[Inngest Webhook Queue — Business Requirement]] - document - docs/inngest-webhook-queue/00-BR.md
- [[Inngest Webhook Queue — PO Requirements]] - document - docs/inngest-webhook-queue/02-PO-requirements.md
- [[Inngest Webhook Queue — SDE Implementation Plan]] - document - docs/inngest-webhook-queue/04-SDE-implementation.md
- [[Inngest — Managed Durable Event Queue]] - document - docs/inngest-webhook-queue/00-BR.md
- [[Inventory Levels Update Webhook Handler]] - document - docs/ad-ready-bundles/03-architecture.md
- [[OrderAttribution Prisma Model]] - document - docs/ad-ready-bundles/FEATURE-SPEC.md
- [[Prices Stored in Cents (not dollars)]] - document - docs/archive/CRITICAL-PRICE-CALCULATION-FIX.md
- [[Rationale Option A (Direct GraphQL via unauthenticated.admin) Selected]] - document - docs/ad-ready-bundles/03-architecture.md
- [[Refactoring Guide Phase 4a & 4b]] - document - docs/archive/REFACTORING_GUIDE.md
- [[Service metafield-sync.server.ts]] - document - docs/archive/REFACTORING_GUIDE.md
- [[Service pricing-calculation.server.ts]] - document - docs/archive/REFACTORING_GUIDE.md
- [[Service standard-metafields.server.ts]] - document - docs/archive/REFACTORING_GUIDE.md
- [[Web Pixel Extension for UTM Attribution]] - document - docs/ad-ready-bundles/FEATURE-SPEC.md
- [[WebhookEvent DB Table — Idempotency Logic]] - document - docs/inngest-webhook-queue/03-architecture.md
- [[WebhookProcessor.processPubSubMessage()]] - document - docs/pubsub-to-render-webhook-migration/00-BR.md
- [[api.inventory-sync.ts Route]] - code - app/routes/api.inventory-sync.ts
- [[api.migrate-bundles.ts Route]] - code - app/routes/api.migrate-bundles.ts
- [[handlers.server.ts (Dashboard Handlers)]] - code - app/routes/app/app.dashboard/handlers/handlers.server.ts
- [[inventory-sync.server.ts Service]] - code - app/services/bundles/inventory-sync.server.ts
- [[inventory.server.ts Webhook Handler]] - code - app/services/webhooks/handlers/inventory.server.ts
- [[testsunitservicesinventory-sync.test.ts]] - code - tests/unit/services/inventory-sync.test.ts
- [[testsunitservicesinventory-webhook.test.ts]] - code - tests/unit/services/inventory-webhook.test.ts
- [[testsunitservicespricing-creation.test.ts]] - code - tests/unit/services/pricing-creation.test.ts
- [[unauthenticated.admin() Offline Session Pattern]] - document - docs/ad-ready-bundles/03-architecture.md

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Community_11
SORT file.name ASC
```

## Connections to other communities
- 2 edges to [[_COMMUNITY_Community 2]]
- 2 edges to [[_COMMUNITY_Community 8]]
- 1 edge to [[_COMMUNITY_Community 16]]
- 1 edge to [[_COMMUNITY_Community 20]]
- 1 edge to [[_COMMUNITY_Community 26]]
- 1 edge to [[_COMMUNITY_Community 22]]

## Top bridge nodes
- [[Ad-Ready Bundles Architecture Decision Record]] - degree 11, connects to 2 communities
- [[OrderAttribution Prisma Model]] - degree 5, connects to 2 communities
- [[WebhookProcessor.processPubSubMessage()]] - degree 5, connects to 1 community
- [[Inngest Remix Serve Route (api.inngest.tsx)]] - degree 3, connects to 1 community
- [[Prices Stored in Cents (not dollars)]] - degree 2, connects to 1 community