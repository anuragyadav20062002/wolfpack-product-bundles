---
schema_version: 1
id: deployment-backfill
title: Deployment Backfill
type: operations
status: active
summary: Guarded dry-run and apply workflow for CartTransform replacement, FPB Page-host migration, and bundle resynchronization.
last_audited: 2026-07-14
owners:
  - engineering
domains:
  - operations
systems:
  - deployment-backfill
source_paths:
  - scripts/deployment-backfill.ts
  - app/services/deployment-backfill.server.ts
  - app/services/cart-transform-service.server.ts
  - app/services/bundles/fpb-page-host-migration.server.ts
related_docs:
  - Architecture/FPB Host Evaluation.md
tags:
  - operations
  - migration
keywords:
  - WPB_DEPLOYMENT_BACKFILL_APPLY
  - fpbProxyMigrations
---

# Deployment Backfill

`npm run deployment:backfill` remains disabled by default. Deploy scripts invoke the gate, but no shops are scanned without explicit enablement.

Dry-run is mutation-free:

```bash
WPB_DEPLOYMENT_BACKFILL_ENABLED=true npm run deployment:backfill
```

It reports `cartTransformsToReplace`, `fpbProxyMigrations`, `publicPagesToDelete`, `previewPagesToDelete`, `pageRedirectsToCreate`, `productRedirectsToUpdate`, and `productHandlesToInternalize` in addition to scanned and sync counts. It does not acquire Admin clients, mutate Shopify, or update the database.

Apply mode requires the exact confirmation:

```bash
WPB_DEPLOYMENT_BACKFILL_ENABLED=true \
WPB_DEPLOYMENT_BACKFILL_APPLY=true \
WPB_DEPLOYMENT_BACKFILL_CONFIRM=I_UNDERSTAND_THIS_CAN_MUTATE_PRODUCTION \
npm run deployment:backfill
```

Apply mode first acquires the compliant offline Admin client once for every selected installed shop, including shops with no bundles. It deletes the shop's current CartTransform, requires Shopify to return the exact deleted ID, recreates the transform with `blockOnFailure: true`, and restores the derived runtime-token secret on the new owner. A delete, create, or secret-write failure skips every bundle for that shop, records a shop failure, and makes the command exit non-zero.

After the shop-level replacement succeeds, each FPB ensures Page redirects, reads the live parent handle, reserves the old product-path redirect, moves the synthetic parent to `wpb-parent-{bundleId}` with `redirectNewHandle: false`, verifies the proxy redirect, deletes stored public/preview Pages, clears Page references, persists the returned internal handle, and only then runs proxy-hosted storefront sync. A migration failure skips normal sync for that FPB, records a bundle failure, and makes the command exit non-zero. PPB continues through unchanged product-host synchronization.

The parent remains `UNLISTED` and published; the migration changes only its handle. This keeps the parent variant available for cart and Cart Transform while making the old product path a Shopify-native redirect source. The app embed redirect remains a pre-migration fallback; PPB and Theme Editor documents are left unchanged.

Use `WPB_DEPLOYMENT_BACKFILL_SHOP` and `WPB_DEPLOYMENT_BACKFILL_LIMIT` to narrow scope. Never run apply mode without explicit approval for the exact environment and shop scope. Page-column removal requires a separate zero-reference preflight after the approved migration succeeds.
