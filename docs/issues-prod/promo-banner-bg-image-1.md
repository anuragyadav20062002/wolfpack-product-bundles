# Issue: Promo Banner Background Image from Shopify Content → Files

**Issue ID:** promo-banner-bg-image-1
**Status:** Completed
**Priority:** 🟡 Medium
**Created:** 2026-02-20
**Last Updated:** 2026-02-20 00:30

## Overview

Allow merchants to select a background image from their Shopify Content → Files library
for the full-page bundle widget's promo banner. The selected CDN URL is stored in the
existing `promoBannerSettings` Json column (no migration), emitted as a CSS variable,
and applied in the widget CSS via `background-image`.

## Progress Log

### 2026-02-20 00:00 - Starting full implementation (Phase 1–6)

Feature pipeline complete (BR → PO → Architect → SDE). Implementing:
- Phase 1: Type system (`PromoBannerSettings` interface + defaults)
- Phase 2: Data pipeline (`extractPromoBannerSettings`, CSS variable)
- Phase 3: `app/routes/app/app.store-files.tsx` — files API resource route
- Phase 4: `FilePicker.tsx` component + `PromoBannerSettings.tsx` UI update
- Phase 5: Widget CSS update (background-image, cover, center)
- Phase 6: Widget rebuild

Files modified:
- `app/types/state.types.ts`
- `app/components/design-control-panel/config/defaultSettings.ts`
- `app/lib/css-generators/css-variables-generator.ts`
- `app/routes/app/app.design-control-panel/handlers.server.ts`
- `app/components/design-control-panel/settings/PromoBannerSettings.tsx`
- `app/components/design-control-panel/settings/index.ts`
- `extensions/bundle-builder/assets/bundle-widget-full-page.css`

Files created:
- `app/routes/app/app.store-files.tsx`
- `app/components/design-control-panel/settings/FilePicker.tsx`

## Related Documentation

- `docs/promo-banner-bg-image/00-BR.md`
- `docs/promo-banner-bg-image/02-PO-requirements.md`
- `docs/promo-banner-bg-image/03-architecture.md`
- `docs/promo-banner-bg-image/04-SDE-implementation.md`

### 2026-02-20 00:30 - Completed all phases

- ✅ Phase 1: `promoBannerBgImage: string | null` added to `PromoBannerSettings` interface and both defaults
- ✅ Phase 2: `extractPromoBannerSettings` + `--bundle-promo-banner-bg-image` CSS variable
- ✅ Phase 3: `app/routes/app/app.store-files.tsx` — paginated files resource route
- ✅ Phase 4: `FilePicker.tsx` (Polaris Modal + useFetcher + grid) + `PromoBannerSettings.tsx` updated
- ✅ Phase 5: Widget CSS — background-image/size/position added to `.promo-banner` and `.promo-banner.no-discount`
- ✅ Phase 6: Widget rebuilt — `npm run build:widgets` (191.9 KB full-page, 110.7 KB product-page)
- ✅ Lint: 0 errors, 499 warnings (all pre-existing)

## Phases Checklist

- [x] Phase 1: Type system
- [x] Phase 2: Data pipeline
- [x] Phase 3: Files API route
- [x] Phase 4: UI components
- [x] Phase 5: Widget CSS
- [x] Phase 6: Widget rebuild
- [x] Lint all modified files
- [x] Commit
