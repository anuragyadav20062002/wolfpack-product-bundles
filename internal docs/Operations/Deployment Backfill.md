---
schema_version: 1
id: deployment-backfill
title: Deployment Backfill
type: operations
status: active
summary: Guarded dry-run and apply workflow for FPB Page-host migration and bundle resynchronization.
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

It reports `fpbProxyMigrations`, `publicPagesToDelete`, `previewPagesToDelete`, `pageRedirectsToCreate`, and `productRedirectsToUpdate` in addition to scanned and sync counts. It does not acquire Admin clients, mutate Shopify, or update the database.

Apply mode requires the exact confirmation:

```bash
WPB_DEPLOYMENT_BACKFILL_ENABLED=true \
WPB_DEPLOYMENT_BACKFILL_APPLY=true \
WPB_DEPLOYMENT_BACKFILL_CONFIRM=I_UNDERSTAND_THIS_CAN_MUTATE_PRODUCTION \
npm run deployment:backfill
```

For each FPB, apply mode acquires the compliant offline Admin client, ensures Page and parent-product redirects to the canonical proxy path, deletes stored public/preview Pages, clears Page references after cleanup, and only then runs proxy-hosted storefront sync. A migration failure skips normal sync for that FPB, records a failure, and makes the command exit non-zero. PPB continues through unchanged product-host synchronization.

Use `WPB_DEPLOYMENT_BACKFILL_SHOP` and `WPB_DEPLOYMENT_BACKFILL_LIMIT` to narrow scope. Never run apply mode without explicit approval for the exact environment and shop scope. Page-column removal requires a separate zero-reference preflight after the approved migration succeeds.
