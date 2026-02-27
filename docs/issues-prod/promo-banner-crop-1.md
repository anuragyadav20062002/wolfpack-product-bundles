# Issue: Promo Banner Image Crop Tool

**Issue ID:** promo-banner-crop-1
**Status:** Completed
**Priority:** 🟡 Medium
**Created:** 2026-02-20
**Last Updated:** 2026-02-20 03:30

## Overview

Add an "Adjust Image" drag-crop editor to the per-bundle promo banner image picker.
Merchants drag a fixed-16:3-ratio bounding box over their image to define which region
is shown in the storefront promo banner.

## Related Documentation

- `docs/promo-banner-crop/00-BR.md`
- `docs/promo-banner-crop/02-PO-requirements.md`
- `docs/promo-banner-crop/03-architecture.md`
- `docs/promo-banner-crop/04-SDE-implementation.md`

## Progress Log

### 2026-02-20 02:00 - Starting Implementation
- All pipeline stages complete (BR → PO → Architect → SDE plan)
- Files to create: `ImageCropEditor.tsx`
- Files to modify: `schema.prisma`, `types.ts`, `bundle-product.server.ts`, `handlers.server.ts`, `route.tsx`, `FilePicker.tsx`, `bundle-widget-full-page.js`
- Next: Phase 1 (Prisma) → Phase 2 (types) → Phase 3 (handler) → Phase 4 (ImageCropEditor) → Phase 5 (FilePicker) → Phase 6 (route) → Phase 7 (widget) → Phase 8 (build/lint/commit)

### 2026-02-20 02:30 - Phases 1–4 Completed
- ✅ Phase 1: `promoBannerBgImageCrop String?` added to `prisma/schema.prisma`, pushed with `prisma db push`
- ✅ Phase 2: `promoBannerBgImageCrop?: string | null` added to `BundleUiConfig` in `types.ts`; field added to metafield builder in `bundle-product.server.ts`
- ✅ Phase 3: `handlers.server.ts` parses and persists `promoBannerBgImageCrop` from FormData
- ✅ Phase 4: `ImageCropEditor.tsx` created — portal at z-index 199999, mouse+touch drag, 4-quadrant overlay, corner markers, Escape capture, `initCropBox` via rAF on image load

### 2026-02-20 03:30 - Phases 5–8 Completed
- ✅ Phase 5: `FilePicker.tsx` extended with `cropValue?`/`onCropChange?` props; "Adjust Image" button added to selected state; `handleRemove` now calls `onCropChange?.(null)`; `ImageCropEditor` imported and rendered when `cropEditorOpen` is true
- ✅ Phase 6: `route.tsx` — added `promoBannerBgImageCrop` state + ref; `handleDiscard` resets crop; `handleSave` appends crop to FormData and includes in dep array; `<FilePicker>` receives `cropValue` and `onCropChange`
- ✅ Phase 7: `bundle-widget-full-page.js` — `createPromoBanner()` now parses `promoBannerBgImageCrop`, computes `backgroundSize` and `backgroundPosition` using architecture-doc CSS math, applies inline on banner element; falls back to cover/center on invalid JSON
- ✅ Phase 8: Widget rebuilt (193.1 KB), 0 ESLint errors (265 pre-existing warnings only)
- Files modified: `FilePicker.tsx`, `route.tsx`, `bundle-widget-full-page.js`, `bundle-widget-full-page-bundled.js`

## Phases Checklist

- [x] Phase 1: Prisma schema + db push
- [x] Phase 2: TypeScript types + metafield builder
- [x] Phase 3: Save handler
- [x] Phase 4: ImageCropEditor component
- [x] Phase 5: FilePicker extension
- [x] Phase 6: Configure page route
- [x] Phase 7: Widget JS
- [x] Phase 8: Build + lint + commit
