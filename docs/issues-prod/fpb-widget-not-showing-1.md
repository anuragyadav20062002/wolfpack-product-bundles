# Issue: FPB Widget Not Showing On Storefront

**Issue ID:** fpb-widget-not-showing-1
**Status:** In Progress
**Priority:** 🔴 High
**Created:** 2026-04-02
**Last Updated:** 2026-04-02 19:30

## Overview

Full-page bundle (FPB) widget does not appear on the storefront even when the bundle
status is "active". Reported for `baygifts.myshopify.com/pages/build-your-own-hamper`.

## Root Cause

`createFullPageBundle()` in `widget-full-page-bundle.server.ts` never sets
`widgetInstallationRequired` or `widgetInstallationLink` in its return value. Both fields
are always `undefined`.

The handler (`handleCreateStorefrontPage`) passes these fields straight through:
```ts
widgetInstallationRequired: result.widgetInstallationRequired,  // always undefined
widgetInstallationLink: result.widgetInstallationLink,           // always undefined
```

The client (route.tsx) checks:
```ts
if (installRequired && installLink) { window.open(installLink, '_blank'); }
```

Since both are `undefined`, the theme editor deep link is **never opened**. Merchants
click "Place Widget Now", get a "Bundle page created successfully!" toast, and are
never directed to the Shopify Theme Editor to place the `bundle-full-page` app block.
The Shopify page is created (handle + page ID saved to DB) but the app block is never
on the page template — so the widget never renders on the storefront.

`handleSyncBundle` has the same problem: it recreates the page on sync but also never
returns `widgetInstallationRequired` or the theme editor link.

## Impact

Every merchant who has ever clicked "Place Widget Now" for an FPB bundle has this
problem. The page exists, the bundle is active, but the storefront shows a blank page.

## Investigation Evidence

- `baygifts.myshopify.com` bundle ID `cmngwyche0000kd3fptbdktrl`: status=active,
  `shopifyPageHandle=build-your-own-hamper`, `shopifyPageId` set.
- Storefront page HTML: zero Wolfpack scripts, no `data-bundle-config`, no
  `#bundle-builder-app` element.
- Horizon theme (ID 196334453079) has never had the `bundle-full-page` block placed.

## Fix

### File 1: `app/services/widget-installation/widget-full-page-bundle.server.ts`

In `createFullPageBundle()`, after creating/reusing the page, generate and return the
theme editor deep link:

```ts
return {
  success: true,
  pageId: createdPage.id,
  pageHandle: createdPage.handle,
  pageUrl,
  slugAdjusted,
  widgetInstallationRequired: true,
  widgetInstallationLink: `https://${shopDomain}.myshopify.com/admin/themes/current/editor?template=page.full-page-bundle&addAppBlockId=${apiKey}/bundle-full-page&target=newAppsSection&previewPath=${encodeURIComponent(`/pages/${createdPage.handle}`)}`,
};
```

### File 2: `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/handlers/handlers.server.ts`

In `handleSyncBundle()`, after recreating the page, also return the theme editor link
so merchants can place the block after a sync.

---

## Progress Log

### 2026-04-02 19:30 — Fix Applied
- ✅ Confirmed page exists in Shopify for baygifts but no app block placed
- ✅ Identified root cause: `createFullPageBundle()` never sets `widgetInstallationRequired`
- ✅ Traced full call chain: "Place Widget Now" → `handleCreateStorefrontPage` → `createFullPageBundle` → returns without install link
- ✅ Fixed `createFullPageBundle`: now returns `widgetInstallationRequired: true` + theme editor deep link with `bundle-full-page` block, `page.full-page-bundle` template, and `previewPath=/pages/{handle}`
- ✅ Fixed `handleSyncBundle`: now returns `widgetInstallationRequired: true` + theme editor link after page re-creation
- ✅ Fixed route.tsx: sync bundle client handler now opens theme editor link (with 800ms delay after toast) when `widgetInstallationLink` is present
- ✅ Lint: 0 errors

## Phases Checklist

- [x] Investigate why baygifts storefront shows blank page
- [x] Identify root cause
- [x] Fix `createFullPageBundle` — return `widgetInstallationRequired` + theme editor link
- [x] Fix `handleSyncBundle` — return theme editor link after page re-creation
- [x] Lint
- [ ] Commit
