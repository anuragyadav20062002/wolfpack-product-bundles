# Issue: Loading GIF Overlay for Bundle Widgets

**Issue ID:** loading-gif-overlay-1
**Status:** Completed
**Priority:** 🟡 Medium
**Created:** 2026-02-22
**Last Updated:** 2026-02-22

## Overview

Add a merchant-configurable loading GIF (or CSS spinner fallback) overlay to both bundle widget types. The overlay appears during: (1) initial bundle load, (2) step transitions, (3) Add to Cart fetch. Merchant configures the GIF via the "Images & GIFs" section (both configure pages).

## Related Documentation

- `docs/loading-gif-overlay/00-BR.md`
- `docs/loading-gif-overlay/02-PO-requirements.md`
- `docs/loading-gif-overlay/03-architecture.md`
- `docs/loading-gif-overlay/04-SDE-implementation.md`

## Progress Log

### 2026-02-22 - Implementation Complete

- ✅ Phase 1: DB + Metafield + API
  - `prisma/schema.prisma`: added `loadingGif String?` to Bundle model
  - `prisma db push` applied column to SIT DB
  - `metafield-sync/types.ts`: added `loadingGif?: string | null` to BundleUiConfig
  - `bundle-product.server.ts`: `loadingGif` included in bundleUiConfig builder
  - `api.bundle.$bundleId[.]json.tsx`: `loadingGif` returned in formattedBundle response
- ✅ Phase 2: Configure Route — Full-page
  - `handlers.server.ts`: parse `loadingGif` from FormData, save to DB (`loadingGif: loadingGif`)
  - `route.tsx`: `loadingGif` state + ref + formData append + useCallback dep + discard reset; "Loading Animation" FilePicker card in images_gifs section
- ✅ Phase 3: Configure Route — Product-page
  - `handlers.server.ts`: parse `loadingGif` from FormData, save to DB
  - `route.tsx`: `ImageIcon` + `FilePicker` imports added; `images_gifs` nav tab added; `loadingGif` state + ref + formData + dep + custom discard callback; images_gifs section with Loading Animation card
- ✅ Phase 4: CSS Overlay Component
  - `bundle-widget.css`: `.bundle-loading-overlay`, `.is-visible`, `__gif`, `__spinner`, `@keyframes bundle-spin`
- ✅ Phase 5: Widget JS — Product-page
  - Added `showLoadingOverlay(gifUrl)` + `hideLoadingOverlay()` methods
  - `init()`: read gif from dataset before `loadBundleData()`; show overlay; hide after `renderUI()`
  - Modal tab click: show overlay before `loadStepProducts()`, hide in `finally`
  - `addToCart()`: show overlay + disable button before fetch; hide in `finally`
- ✅ Phase 6: Widget JS — Full-page
  - Added `showLoadingOverlay(gifUrl)` + `hideLoadingOverlay()` methods
  - `init()`: show spinner (null gif, before API call); hide after `renderUI()`
  - `renderFullPageLayout()`: show overlay before `loadStepProducts()`; hide on success/error
  - `addBundleToCart()`: disable `.footer-btn-next`, show overlay; hide + re-enable in `finally`
- ✅ Phase 7: Build + Lint + Commit
  - Widget bundles rebuilt: 193.5 KB full-page, 116.3 KB product-page
  - ESLint: 0 errors, 1607 pre-existing warnings

## Phases Checklist

- [x] Phase 1: DB + Metafield + API
- [x] Phase 2: Configure Route — Full-page
- [x] Phase 3: Configure Route — Product-page
- [x] Phase 4: CSS Overlay Component
- [x] Phase 5: Widget JS — Product-page
- [x] Phase 6: Widget JS — Full-page
- [x] Phase 7: Build + Lint + Commit
