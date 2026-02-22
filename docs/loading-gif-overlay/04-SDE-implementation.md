# SDE Implementation Plan: Loading GIF Overlay

## Overview

11 source files to change. Build produces 2 auto-generated bundled files.

## Phase 1: DB + Metafield + API
- 1.1 Add `loadingGif String?` to `prisma/schema.prisma` Bundle model
- 1.2 Run `npx prisma db push` to apply column
- 1.3 Add `loadingGif` to `BundleUiConfig` in `metafield-sync/types.ts`
- 1.4 Add `loadingGif` to bundleUiConfig builder in `bundle-product.server.ts`
- 1.5 Add `loadingGif` to `formattedBundle` in `api.bundle.$bundleId[.]json.tsx`

## Phase 2: Configure Route — Full-page
- 2.1 Add `loadingGif` parsing in `handlers.server.ts` (full-page)
- 2.2 Add `loadingGif` state + ref + FilePicker card + formData + deps + discard in `route.tsx` (full-page)

## Phase 3: Configure Route — Product-page
- 3.1 Add `loadingGif` parsing in `handlers.server.ts` (product-page)
- 3.2 Add `images_gifs` nav tab + section + state + FilePicker + formData + deps in `route.tsx` (product-page)

## Phase 4: CSS Overlay Component
- 4.1 Add `.bundle-loading-overlay`, `.bundle-loading-overlay__gif`, `.bundle-loading-overlay__spinner`, `@keyframes bundle-spin` to `bundle-widget.css`

## Phase 5: Widget JS — Product-page
- 5.1 Add `showLoadingOverlay(gifUrl)` and `hideLoadingOverlay()` methods
- 5.2 Wrap `init()` with overlay (before `loadBundleData()` / after `renderUI()`)
- 5.3 Wrap modal tab click `loadStepProducts()` with overlay
- 5.4 Add overlay to `addToCart()` (show before fetch, hide in `finally`)

## Phase 6: Widget JS — Full-page
- 6.1 Add `showLoadingOverlay(gifUrl)` and `hideLoadingOverlay()` methods
- 6.2 Wrap `init()` with overlay
- 6.3 Wrap `renderFullPageLayout()` product load with overlay
- 6.4 Add overlay + button disable/enable to `addBundleToCart()`

## Phase 7: Build + Lint + Commit
- 7.1 `npm run build:widgets`
- 7.2 `npx eslint --max-warnings 9999` on modified source files
- 7.3 Create issue file `docs/issues-prod/loading-gif-overlay-1.md`
- 7.4 Commit all changes

## Build & Verification Checklist
- [ ] `prisma db push` succeeded
- [ ] `loadingGif` appears in `bundle_ui_config` metafield JSON
- [ ] `loadingGif` returned by `/api/bundle/:bundleId.json`
- [ ] FilePicker appears in full-page "Images & GIFs" section
- [ ] "Images & GIFs" tab and section appear in product-page configure
- [ ] Overlay appears during initial load on storefront
- [ ] Overlay appears during step transitions
- [ ] Overlay + button disable appears during Add to Cart
- [ ] CSS spinner shows when no GIF configured
- [ ] GIF shows (max 120px) when configured
- [ ] Overlay fades out after each moment
- [ ] Widget built (both bundles)
- [ ] 0 ESLint errors

## Rollback Notes
- Remove `loadingGif` column: `ALTER TABLE "Bundle" DROP COLUMN IF EXISTS "loadingGif";`
- Revert all source file changes and rebuild
