# Issue: Proxy Health Check Banner on Dashboard

**Issue ID:** proxy-health-check-dashboard-1
**Status:** Completed
**Priority:** 🔴 High
**Created:** 2026-03-20
**Last Updated:** 2026-03-20 07:00

## Overview
If the Shopify app proxy is not registered (e.g. fresh install, broken deploy, or stale
OAuth session), full-page bundle widgets silently fail with "Failed to initialize bundle
widget." Merchants have no idea what's wrong or how to fix it.

This fix adds a server-side proxy health check to the dashboard loader. If the proxy
returns 404 (Shopify never forwarded the request to our server), a critical banner is shown
on the dashboard with a one-click reinstall link.

## Approach
- New public endpoint: `GET /api/proxy-health` → returns `{ ok: true }`, no auth required
- Dashboard loader fetches `https://{shop}/apps/product-bundles/api/proxy-health` with a
  3-second timeout. If it returns 200 + `{ ok: true }`, proxy is healthy. If 404, broken.
  Any other result (timeout, 5xx) defaults to healthy to avoid false positives.
- New `ProxyHealthBanner` component shown above the upgrade banner when proxy is broken.
- Banner message: actionable — "Full-page bundle widgets won't load" + "Reinstall app" CTA.

## Files Changed
- `app/routes/api/api.proxy-health.tsx` — new public health endpoint
- `app/components/ProxyHealthBanner.tsx` — new banner component
- `app/routes/app/app.dashboard/route.tsx` — proxy check in loader + banner in JSX

## Progress Log

### 2026-03-20 07:00 - Completed
- ✅ `app/routes/api/api.proxy-health.tsx` — new public GET endpoint returning `{ ok: true }`, CORS headers, no auth
- ✅ `app/components/ProxyHealthBanner.tsx` — critical banner with "Reinstall app" external link
- ✅ `app/routes/app/app.dashboard/route.tsx` — 3-second server-side proxy health check in loader;
  only flags broken on definitive Shopify 404 (text/html, empty body) to avoid false positives;
  `proxyHealthy` + `appUrl` added to loader return; banner rendered above upgrade prompt banner

## Phases Checklist
- [x] Proxy health endpoint
- [x] ProxyHealthBanner component
- [x] Dashboard loader + JSX integration
