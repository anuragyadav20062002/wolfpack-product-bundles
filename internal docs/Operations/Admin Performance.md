---
title: Admin Performance
type: operations
last_audited: 2026-06-12
---

# Admin Performance

## Web Vitals Source

Shopify App Bridge is the source of embedded Admin Web Vitals used for Built for Shopify assessment. The root document must keep:

- `<meta name="shopify-api-key" ...>`
- `<script src="https://cdn.shopify.com/shopifycloud/app-bridge.js">`

The App Bridge script should be the first script in `<head>` and should not be pinned to a versioned URL.

## Removed Custom Telemetry

The previous app-owned Web Vitals pipeline was retired on 2026-06-12:

- `app/lib/web-vitals.client.ts`
- `app/routes/api/api.web-vitals.tsx`
- Prisma model/table `AdminWebVital`
- npm dependency `web-vitals`

Do not recreate `/api/web-vitals` for BFS eligibility. Use Shopify-collected metrics for BFS and Chrome Performance / Network `Server-Timing` for local diagnosis.

## Critical Path Rule

The `/app` layout loader must keep Shopify authentication on the critical path, but non-critical maintenance should not block the initial shell. Offline-session migration runs in the background and logs failures instead of delaying first render.
