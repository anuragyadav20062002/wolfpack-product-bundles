---
title: Development
type: operations
audited: 2026-07-08
sources: package.json, app/services/bundles/storefront-sync.server.ts
---

# Development

## SIT Dev Stack

Use the bundled SIT command for normal local development:

```bash
npm run dev:sit
```

This runs `shopify app dev --config shopify.app.wolfpack-product-bundles-sit.toml`.

Configure Save, Sync Product, Sync Bundle, and Preview publish storefront data synchronously through the app server. They do not require a local Inngest storefront-sync queue, dynamic SDK URL discovery, or `INNGEST_DEV=1`. Do not use the bare `npm run dev` for SIT work; it does not pin the SIT Shopify app config.
