# Issue: Per-Bundle Images & GIFs

**Issue ID:** bundle-images-gifs-1
**Status:** Completed
**Priority:** 🟡 Medium
**Created:** 2026-02-20
**Last Updated:** 2026-02-20 01:00

## Overview

Add a per-bundle "Images & GIFs" section to the full-page bundle configure page, allowing
merchants to set a unique promo banner background image for each bundle. Includes:
- Prisma migration for `promoBannerBgImage String?` on the `Bundle` model
- "Images & GIFs" nav section with FilePicker in configure page
- Metafield sync to include the field in `bundle_ui_config`
- Widget JS reading the URL and applying `--bundle-promo-banner-bg-image` CSS variable
- CSS height increase for the promo banner

## Related Documentation

- `docs/bundle-images-gifs/00-BR.md`
- `docs/bundle-images-gifs/02-PO-requirements.md`
- `docs/bundle-images-gifs/03-architecture.md`
- `docs/bundle-images-gifs/04-SDE-implementation.md`

## Progress Log

### 2026-02-20 00:00 - Starting Implementation
- Pipeline stages 1–4 complete
- About to implement: Prisma migration, types, metafield builder, handler, UI, widget, CSS
- Files to modify:
  - `prisma/schema.prisma`
  - `app/services/bundles/metafield-sync/types.ts`
  - `app/services/bundles/metafield-sync/operations/bundle-product.server.ts`
  - `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/handlers/handlers.server.ts`
  - `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/route.tsx`
  - `app/assets/bundle-widget-full-page.js`
  - `extensions/bundle-builder/assets/bundle-widget-full-page.css`
- Next: Prisma schema → migration → types → builder → handler → UI → widget → CSS → build → lint → commit

### 2026-02-20 01:00 - Implementation Complete
- ✅ `prisma/schema.prisma`: added `promoBannerBgImage String?` to Bundle model
- ✅ DB synced via `prisma db push` (remote DB lacks SUPERUSER for migrate dev)
- ✅ `app/services/bundles/metafield-sync/types.ts`: added `promoBannerBgImage?` to BundleUiConfig
- ✅ `bundle-product.server.ts`: included field in bundleUiConfig builder
- ✅ `handlers.server.ts`: parse `promoBannerBgImage` from FormData, persist to DB
- ✅ `route.tsx`: ImageIcon + LockIcon + Box + FilePicker imports; images_gifs nav item; state + discard + save wiring; right-panel section
- ✅ `bundle-widget-full-page.js`: CSS variable set in createPromoBanner()
- ✅ `bundle-widget-full-page.css`: promo banner height increased (min-height 140/180/220px, padding 28/36/48px)
- ✅ Widget rebuilt: `npm run build:widgets`
- ✅ Lint: 0 errors, 828 pre-existing warnings
- Files changed: prisma/schema.prisma, types.ts, bundle-product.server.ts, handlers.server.ts, route.tsx, bundle-widget-full-page.js, bundle-widget-full-page.css, bundle-widget-full-page-bundled.js

## Phases Checklist

- [x] Phase 1: Prisma migration
- [x] Phase 2: TypeScript + metafield sync
- [x] Phase 3: Save handler
- [x] Phase 4: Configure page UI
- [x] Phase 5: Widget JS + CSS + build
- [x] Phase 6: Lint + commit
