---
title: Mantle Integration
type: operations
audited: 2026-07-05
sources: app/routes/app/app.tsx, app/services/mantle.server.ts, tests/unit/routes/app-mantle-provider.test.ts, tests/unit/services/mantle-provider.server.test.ts
---

# Mantle Integration

## Admin Provider Flow

The embedded Admin app bootstraps Mantle from `app/routes/app/app.tsx`.

1. The app loader authenticates the Shopify Admin request.
2. The loader calls `buildMantleProviderConfig()` with:
   - `MANTLE_APP_ID`
   - `MANTLE_API_KEY`
   - optional `MANTLE_API_URL`
   - the current Shopify session access token
3. `app/services/mantle.server.ts` queries Shopify shop identity and calls `MantleClient.identify()`.
4. Mantle returns a customer `apiToken`.
5. The Admin React tree is wrapped in `MantleProvider` with `appId`, `customerApiToken`, and optional `apiUrl`.

If `MANTLE_APP_ID`, `MANTLE_API_KEY`, or the Shopify session access token is missing, Mantle setup returns `null` and the Admin app renders without `MantleProvider`.

## Gotcha

`MANTLE_API_KEY` is the server-side key for `MantleClient.identify()`. Do not pass `SHOPIFY_API_KEY` into the Mantle identify flow. The Shopify API key is only the embedded app client id used by Shopify App Bridge / AppProvider.

The loader cache key must also include `MANTLE_API_KEY` so rotations invalidate cached Mantle provider config.

## Verification

Focused checks:

```bash
npx jest tests/unit/routes/app-mantle-provider.test.ts --runInBand
npx jest tests/unit/services/mantle-provider.server.test.ts --runInBand
```
