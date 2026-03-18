# Issue: Toast Notification — Full DCP Customization

**Issue ID:** toast-dcp-full-customization-1
**Status:** Completed
**Priority:** 🟡 Medium
**Created:** 2026-03-19
**Last Updated:** 2026-03-19 21:00

## Overview
The bundle widget toast notifications (e.g. "Please select products before continuing") previously only exposed two DCP settings: `toastBgColor` and `toastTextColor`. Merchants now have complete visual control over the toast — border, roundness, animation speed, font size, shadow, and entry direction.

## Progress Log

### 2026-03-19 18:00 - Feature Pipeline Run
- Ran full BR → PO → Architecture → SDE pipeline
- Docs created: `docs/toast-dcp-customization/00-BR.md`, `02-PO-requirements.md`, `03-architecture.md`, `04-SDE-implementation.md`

### 2026-03-19 19:00 - Implementation Complete
- ✅ Prisma schema: added 8 new columns to `DesignSettings` with defaults
- ✅ TypeScript type: added 8 fields to `DesignSettings` interface in `state.types.ts`
- ✅ Default settings: added all 8 defaults to both `PRODUCT_PAGE_DEFAULTS` and `FULL_PAGE_DEFAULTS`
- ✅ Merge settings: added direct column reads in `mergeSettings.ts`
- ✅ CSS variable generator: added 8 new `--bundle-toast-*` variables
- ✅ Widget CSS (`bundle-widget.css`): replaced hardcoded values with `var()` references; added `.bundle-toast-from-bottom` class + `@keyframes slideFromBottom`/`slideToBottom`
- ✅ Widget CSS (`bundle-widget-full-page.css`): same changes as above
- ✅ Widget JS (`toast-manager.js`): added `_isEnterFromBottom()` helper; both `show()` and `showWithUndo()` conditionally apply `.bundle-toast-from-bottom` class
- ✅ `ToastsSettings.tsx`: full rewrite with Colors, Shape, Typography, Animation, Shadow sections
- ✅ `GeneralPreview.tsx`: toast preview now mirrors all 8 settings with inline styles
- ✅ `PreviewPanel.tsx`: updated to pass all 8 new toast props
- ✅ API route (`api.design-settings.$shopDomain.tsx`): added 8 fields to default + merge
- ✅ Handlers server (`handlers.server.ts`): added 8 fields to `buildSettingsData`
- ✅ Widget rebuilt: version bumped to 2.0.0; full-page 244.7 KB, product-page 153.0 KB
- ✅ Prisma DB: schema pushed to SIT (`prisma db push` — DB already in sync)
- ✅ CSS file sizes: bundle-widget.css 68,306 B, bundle-widget-full-page.css 95,312 B (both under 100,000 B limit)
- ✅ ESLint: 0 errors on all modified files

### Files Modified
- `prisma/schema.prisma`
- `app/types/state.types.ts`
- `app/components/design-control-panel/config/defaultSettings.ts`
- `app/components/design-control-panel/config/mergeSettings.ts`
- `app/lib/css-generators/css-variables-generator.ts`
- `app/routes/api/api.design-settings.$shopDomain.tsx`
- `app/routes/app/app.design-control-panel/handlers.server.ts`
- `extensions/bundle-builder/assets/bundle-widget.css`
- `extensions/bundle-builder/assets/bundle-widget-full-page.css`
- `app/assets/widgets/shared/toast-manager.js`
- `app/components/design-control-panel/settings/ToastsSettings.tsx`
- `app/components/design-control-panel/preview/GeneralPreview.tsx`
- `app/components/design-control-panel/preview/PreviewPanel.tsx`
- `scripts/build-widget-bundles.js`
- `extensions/bundle-builder/assets/bundle-widget-full-page-bundled.js`
- `extensions/bundle-builder/assets/bundle-widget-product-page-bundled.js`

## New DCP Settings Added

| Setting | Type | Default | CSS Variable |
|---------|------|---------|--------------|
| `toastBorderRadius` | Int | 8 | `--bundle-toast-border-radius` |
| `toastBorderColor` | String | `#FFFFFF` | `--bundle-toast-border-color` |
| `toastBorderWidth` | Int | 0 | `--bundle-toast-border-width` |
| `toastFontSize` | Int | 13 | `--bundle-toast-font-size` |
| `toastFontWeight` | Int | 500 | `--bundle-toast-font-weight` |
| `toastAnimationDuration` | Int | 300 | `--bundle-toast-animation-duration` |
| `toastBoxShadow` | String | `0 4px 12px rgba(0,0,0,0.15)` | `--bundle-toast-box-shadow` |
| `toastEnterFromBottom` | Boolean | false | `--bundle-toast-enter-from-bottom` |

## Phases Checklist
- [x] Run feature-pipeline skill
- [x] Prisma migration: add new toast fields
- [x] TypeScript type: add fields to DesignSettings
- [x] Default settings: add defaults to both bundle types
- [x] CSS generator: add new --bundle-toast-* variables
- [x] Widget CSS: replace hardcoded values with var() references
- [x] ToastsSettings.tsx: add new controls
- [x] Widget rebuild + version bump (2.0.0)
- [x] DCP preview update for toast (GeneralPreview.tsx)
- [ ] Deploy: run `shopify app deploy` (ACTION REQUIRED — manual step)

## Deploy Instructions

ACTION REQUIRED — Manual deploy needed.

Run the following command in your terminal:

```
shopify app deploy
```

Reason: Widget JS updated (version 2.0.0) and CSS variables added for toast customization.
After deploying, allow 2-10 minutes for CDN propagation, then verify:
```javascript
console.log(window.__BUNDLE_WIDGET_VERSION__) // should print "2.0.0"
```
