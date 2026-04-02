# Issue: Migrate FPB & PDP to App Embed Block Architecture

**Issue ID:** embed-block-architecture-1
**Status:** In Progress
**Priority:** 🔴 High
**Created:** 2026-04-02
**Last Updated:** 2026-04-02 21:00

## Overview

Replace old app block architecture (target: "section", required per-page placement) with
app embed blocks (target: "body", activated once per store). This eliminates the need for
merchants to manually place the widget block on each page in the theme editor.

## Architecture Change

### Old Architecture
- `bundle-full-page.liquid` — app block, target: "section", placed on page template
- `bundle-product-page.liquid` — app block, target: "section", placed on product template
- Merchant must add the block to each page/product template manually
- `api.install-fpb-widget` and `api.install-pdp-widget` called `themeFilesUpsert` to
  write template JSON files (requires write_themes exemption)

### New Architecture
- `bundle-full-page-embed.liquid` — app embed block, target: "body", enabled_on: page
  - Reads `page.metafields.custom.bundle_id` — renders widget only on bundle pages
  - Activated ONCE per store in Theme Settings > App Embeds
- `bundle-product-page-embed.liquid` — app embed block, target: "body", enabled_on: product
  - Reads `product.variants.first.metafields['$app']['bundle_ui_config']`
  - Uses JS to reposition widget container after the add-to-cart form
  - Activated ONCE per store in Theme Settings > App Embeds

### Merchant Experience
1. Install app → shown embed activation deep link (once, not per-bundle)
2. Click link → Theme Settings > App Embeds → toggle both embeds ON → click Save
3. Create/configure any bundle → it works immediately, no further theme steps needed

### One-time merchant action required
The Save click in the theme editor is unavoidable without `write_themes`. The deep link
pre-activates the toggle — merchant just clicks Save once.

## Files

### Created
- `extensions/bundle-builder/blocks/bundle-full-page-embed.liquid`
- `extensions/bundle-builder/blocks/bundle-product-page-embed.liquid`

### Deleted
- `extensions/bundle-builder/blocks/bundle-full-page.liquid`
- `extensions/bundle-builder/blocks/bundle-product-page.liquid`

### Modified
- `app/services/widget-installation/widget-full-page-bundle.server.ts`
- `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/handlers/handlers.server.ts`
- `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/route.tsx`
- `app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/route.tsx`

## Progress Log

### 2026-04-02 20:00 — Implementation Started
- Created new embed blocks for FPB and PDP
- Deleted old app blocks
- Updated server handlers to return embed activation links
- Updated configure pages to show embed activation guidance

### 2026-04-02 21:00 — PDP Configure Updated
- ✅ Removed `installFetcher` and `isInstallingWidget` from PDP configure route
- ✅ `handleAddToStorefront` now opens embed activation deep link directly
- ✅ Removed old useEffect that handled `/api/install-pdp-widget` response
- Files modified: `app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/route.tsx`
- Lint: 0 errors

## Phases Checklist

- [x] Create bundle-full-page-embed.liquid
- [x] Create bundle-product-page-embed.liquid
- [x] Delete bundle-full-page.liquid
- [x] Delete bundle-product-page.liquid
- [x] Update FPB server: widgetInstallationLink → embed activation URL
- [x] Update FPB configure route: toast + embed link
- [x] Update FPB handlers.server.ts: widgetInstallationRequired + embed link
- [x] Update PDP configure: handleAddToStorefront → embed activation deep link
- [x] Lint all modified files (0 errors)
- [ ] Commit
- [ ] Deploy (manual: npm run deploy:prod or deploy:sit)
- [ ] Test embed activation on storefront
