---
title: Deployment Backfill
type: operations
audited: 2026-07-10
sources: scripts/deployment-backfill.ts; app/services/deployment-backfill.server.ts; app/services/bundles/storefront-sync.server.ts
---

# Deployment Backfill

`npm run deployment:backfill` is a deployment-time safety gate. It is called by `npm run deploy`, `npm run deploy:sit`, and `npm run deploy:prod`, but it does nothing unless explicitly enabled through environment variables.

The script is generic: it reads installed shops and bundle IDs from the database, then runs the existing `syncBundleStorefrontNow` app function for each bundle. That path refreshes the current Shopify product/page/metafield shape from DB state instead of carrying one-off JSON migration logic inside the script.

## Default behavior

With no flags, the script exits in disabled mode and scans nothing:

```bash
npm run deployment:backfill
```

Dry-run scans targets but does not call sync functions:

```bash
WPB_DEPLOYMENT_BACKFILL_ENABLED=true npm run deployment:backfill
```

## Apply mode

Apply mode mutates Shopify resources and bundle sync state. It can update product/page metafields, product status, page body data, cart transform setup, sync timestamps, and failure state for every targeted bundle.

Required flags:

```bash
WPB_DEPLOYMENT_BACKFILL_ENABLED=true \
WPB_DEPLOYMENT_BACKFILL_APPLY=true \
WPB_DEPLOYMENT_BACKFILL_CONFIRM=I_UNDERSTAND_THIS_CAN_MUTATE_PRODUCTION \
npm run deployment:backfill
```

Optional filters:

```bash
WPB_DEPLOYMENT_BACKFILL_ENABLED=true \
WPB_DEPLOYMENT_BACKFILL_SHOP=example.myshopify.com \
npm run deployment:backfill

WPB_DEPLOYMENT_BACKFILL_ENABLED=true \
WPB_DEPLOYMENT_BACKFILL_LIMIT=10 \
npm run deployment:backfill
```

`WPB_DEPLOYMENT_BACKFILL_INCLUDE_UNINSTALLED=true` includes shops with `uninstalledAt` set. Do not use that flag unless the target shop list was manually audited.

## Approval rule

Never run apply mode without explicit user approval in the current conversation or deployment checklist. Production apply mode is dangerous: it can mutate many live merchant stores and those changes may not be reversible from the app database alone.

When apply mode is needed, stop and ask the user to approve the exact environment, target scope, and command before running it.
