# Issue: Promo Banner API Fields Missing from Bundle JSON Endpoint

**Issue ID:** promo-banner-api-fix-1
**Status:** Completed
**Priority:** 🔴 High
**Created:** 2026-02-21
**Last Updated:** 2026-02-21 02:30

## Overview

`promoBannerBgImage` and `promoBannerBgImageCrop` are correctly saved to the database
and queried in the bundle API endpoint, but they are NOT included in the `formattedBundle`
response object. As a result the widget never receives the image URL and the promo banner
background image never renders on the storefront.

## Progress Log

### 2026-02-21 02:00 - Starting Fix

- Root cause: `api.bundle.$bundleId[.]json.tsx` lines 380–505 build `formattedBundle`
  but omit `promoBannerBgImage` and `promoBannerBgImageCrop`
- The Prisma `findFirst` query (line 162) implicitly selects all scalar fields so the
  data IS present on `bundle` — it just needs to be mapped to the response object
- Fix: add both fields to `formattedBundle` (after `shopifyProductId`, before `steps`)

Files to modify:
- `app/routes/api/api.bundle.$bundleId[.]json.tsx`

### 2026-02-21 02:05 - First Fix (API endpoint)

- ✅ Added `promoBannerBgImage: bundle.promoBannerBgImage ?? null` to `formattedBundle`
- ✅ Added `promoBannerBgImageCrop: bundle.promoBannerBgImageCrop ?? null` to `formattedBundle`
- Files modified: `app/routes/api/api.bundle.$bundleId[.]json.tsx`

### 2026-02-21 02:30 - Second Fix (widget direct inline style)

- Root cause continued: widget used `banner.style.setProperty('--bundle-promo-banner-bg-image', url)`
  to set a CSS custom property, then the CSS rule reads it via
  `background-image: var(--bundle-promo-banner-bg-image, none)`. This indirect chain is fragile:
  the `background` shorthand in the same CSS rule resets `background-image` to none, and if any
  Shopify theme rule has higher specificity, the CSS variable-based approach can lose.
- Fix: set `banner.style.backgroundImage` directly (inline style = highest specificity, always wins)
  and also set `banner.style.backgroundSize = 'cover'` + `banner.style.backgroundPosition = 'center'`
  as defaults, overridden by crop math when crop data is present.
- Widget rebuild required.

## Phases Checklist

- [x] Fix 1: add `promoBannerBgImage` + `promoBannerBgImageCrop` to API `formattedBundle`
- [x] Lint + commit fix 1
- [x] Fix 2: widget sets `banner.style.backgroundImage` directly (not CSS var)
- [x] Widget rebuild (191.2 KB)
- [x] Lint + commit fix 2
