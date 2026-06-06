# Issue: PPB Step Banner Image — Admin UI + Widget Rendering

**Issue ID:** ppb-step-images-1
**Status:** Completed
**Priority:** 🟡 Medium
**Created:** 2026-05-11
**Last Updated:** 2026-05-11 17:30

## Overview

The FPB configure route already has a "Step Images" card (step banner image + tab icon per step).
The PPB configure route and widget are missing equivalent support.

Scope for PPB:
- **Admin UI**: Step Banner Image upload per step (in Bundle Assets section)
- **Handler**: persist `bannerImageUrl`, `imageUrl`, `timelineIconUrl` on step create
- **Widget**: render per-step banner image above each step's card in `renderProductPageLayout`

Tab icon (`imageUrl`) and timeline icon (`timelineIconUrl`) are not rendered in the PPB widget
layout (no step tabs / timeline in product-page bundle view) — fields are still persisted by
the handler for data integrity.

## Phases Checklist

- [x] Phase 1 — Issue file created
- [x] Phase 2 — PPB handler: add `bannerImageUrl`, `imageUrl`, `timelineIconUrl` to step create
- [x] Phase 3 — PPB route: Step Images card in Bundle Assets section
- [x] Phase 4 — PPB widget: inject banner image before step cards in `renderProductPageLayout`
- [x] Phase 5 — Build PPB widget, lint, commit

## Related Documentation

- Architecture: `docs/step-banner-image/02-architecture.md`
- FPB issue (done): `docs/issues-prod/fpb-step-image-banner-1.md`

## Progress Log

### 2026-05-11 17:30 — Implementation complete

- `handlers.server.ts`: added `bannerImageUrl`, `imageUrl`, `timelineIconUrl` to step create
- `route.tsx`: Step Images card in Bundle Assets section — `activeAssetTabIndex` state, tab row per step, `bannerImageUrl` FilePicker
- `bundle-widget-product-page.js`: `_createStepBannerImage(step)` helper; `renderProductPageLayout` injects banner above each step's cards
- Build: bundle-widget-product-page-bundled.js 136.3 KB
- Lint: 0 errors

### 2026-05-11 17:20 — Starting implementation

- PPB handler step create is missing `bannerImageUrl`, `imageUrl`, `timelineIconUrl`
- PPB route Bundle Assets section has no Step Images card
- PPB widget `renderProductPageLayout` has no banner image injection
- No new DB migration needed — columns already exist on BundleStep
- No new tests needed — metafield pass-through already covered by FPB tests
