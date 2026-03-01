# SDE Implementation Plan: Promo Banner Image Crop Tool

**Feature ID:** promo-banner-crop
**Issue ID:** promo-banner-crop-1
**Architecture Reference:** `docs/promo-banner-crop/03-architecture.md`

---

## Overview

Adds an "Adjust Image" crop editor to the per-bundle promo banner image picker.
Merchants can drag a fixed-16:3-ratio bounding box over their selected image to define
which region is shown in the storefront banner.

**New files:** 1 (`ImageCropEditor.tsx`)
**Modified files:** 7

---

## Phase 1: Data Layer
- Step 1.1: Add `promoBannerBgImageCrop String?` to Bundle in `prisma/schema.prisma`
- Step 1.2: Run `prisma db push`

## Phase 2: TypeScript + Metafield Sync
- Step 2.1: Add `promoBannerBgImageCrop?: string | null` to `BundleUiConfig` in `types.ts`
- Step 2.2: Include field in `bundleUiConfig` builder in `bundle-product.server.ts`

## Phase 3: Server-Side Save Handler
- Step 3.1: Parse `promoBannerBgImageCrop` from FormData, persist to DB in `handlers.server.ts`

## Phase 4: ImageCropEditor Component (new file)
- Step 4.1: Create `app/components/design-control-panel/settings/ImageCropEditor.tsx`
  - Props: `{ imageUrl, cropValue, onConfirm, onClose }`
  - Draggable fixed-16:3 bounding box with 4-quadrant overlay
  - Portal at z-index 199999
  - Initial state: restore from cropValue, or centered at 80% width
  - Confirm: convert pixel positions to percentages, call onConfirm with JSON string

## Phase 5: FilePicker Extension
- Step 5.1: Add `cropValue?: string | null` and `onCropChange?: (crop: string | null) => void` props
- Step 5.2: Add internal `cropEditorOpen` state
- Step 5.3: Add "Adjust Image" button in selected-state trigger (plain variant)
- Step 5.4: Import and conditionally render `ImageCropEditor`
- Step 5.5: In `handleRemove`, also call `onCropChange?.(null)`

## Phase 6: Configure Page Route
- Step 6.1: Add `promoBannerBgImageCrop` state (init from `bundle.promoBannerBgImageCrop`)
- Step 6.2: Add `originalPromoBannerBgImageCropRef` for discard
- Step 6.3: Extend `handleDiscard` to reset crop state
- Step 6.4: `formData.append("promoBannerBgImageCrop", promoBannerBgImageCrop ?? "")`
- Step 6.5: Add `promoBannerBgImageCrop` to handleSave dependency array
- Step 6.6: Pass `cropValue={promoBannerBgImageCrop}` and `onCropChange` to `<FilePicker>`

## Phase 7: Widget JS
- Step 7.1: In `createPromoBanner()`, after applying `--bundle-promo-banner-bg-image`,
  read `promoBannerBgImageCrop`, compute bgSize / bgPosition, apply inline

## Phase 8: Build + Lint + Commit
- Step 8.1: `npm run build:widgets`
- Step 8.2: Lint modified files (`npx eslint --max-warnings 9999 ...`)
- Step 8.3: Create issue file `docs/issues-prod/promo-banner-crop-1.md`
- Step 8.4: Commit `[promo-banner-crop-1] feat: ...`

---

## Build & Verification Checklist

- [ ] `prisma db push` succeeds
- [ ] TypeScript: zero new errors
- [ ] ESLint: zero new errors
- [ ] Widget rebuilt: `npm run build:widgets`
- [ ] Manual: "Adjust Image" button appears only when image is selected
- [ ] Manual: crop editor opens, bounding box is draggable and clamped within image
- [ ] Manual: Confirm → storefront banner shows correct region
- [ ] Manual: Cancel → no crop change
- [ ] Manual: Remove image → crop cleared
- [ ] Manual: Discard → crop resets to last saved value
- [ ] Manual: existing bundles without crop data → banner still renders with cover/center

## Rollback Notes

`promoBannerBgImageCrop` is nullable. Running `prisma db push` with the field removed
reverts the schema. Widget falls back to `cover/center` when field is absent from metafield.
