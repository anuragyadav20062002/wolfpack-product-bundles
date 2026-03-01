# SDE Implementation Plan: Promo Banner Background Image

**Feature ID:** promo-banner-bg-image
**Issue ID:** promo-banner-bg-image-1
**Created:** 2026-02-20

---

## Overview

End-to-end implementation of the promo banner background image feature.
Touches 6 existing files, creates 2 new files, and rebuilds the widget bundle.
No DB migration required.

---

## Phase 1: Type System

**Step 1.1** — Add `promoBannerBgImage: string | null` to `PromoBannerSettings`
→ `app/types/state.types.ts`

**Step 1.2** — Add `promoBannerBgImage: null` to both product-page and full-page defaults
→ `app/components/design-control-panel/config/defaultSettings.ts`

---

## Phase 2: Data Pipeline (Server)

**Step 2.1** — Add `promoBannerBgImage` to `extractPromoBannerSettings()` in DCP handler
→ `app/routes/app/app.design-control-panel/handlers.server.ts`

**Step 2.2** — Emit `--bundle-promo-banner-bg-image` CSS variable
→ `app/lib/css-generators/css-variables-generator.ts`
- When URL: `url('...')`
- When null/undefined: `none`

---

## Phase 3: Files API Route

**Step 3.1** — Create `app/routes/app/app.store-files.tsx`
- Accepts `?cursor=` and `?query=` URL params
- Uses `authenticate.admin(request)` for GraphQL access
- Queries Shopify Admin `files` API for images only (`media_type:IMAGE`)
- Returns `{ files: StoreFile[], pageInfo }`

---

## Phase 4: UI Components

**Step 4.1** — Create `app/components/design-control-panel/settings/FilePicker.tsx`
- Polaris `Modal` with file grid
- `useFetcher` calls `/app/store-files`
- Client-side search filter
- Load-more pagination via cursor
- Calls `onChange(url)` / `onChange(null)` on select/clear

**Step 4.2** — Update `PromoBannerSettings.tsx`
- Add Background Image subsection between Background Color and Border Radius
- Conditionally renders thumbnail+remove vs choose button

---

## Phase 5: Widget CSS

**Step 5.1** — Update `.promo-banner` rule in `extensions/bundle-builder/assets/bundle-widget-full-page.css`
- Add `background-image: var(--bundle-promo-banner-bg-image, none)`
- Add `background-size: cover`
- Add `background-position: center`

**Step 5.2** — Update `.promo-banner.no-discount` rule
- Add same `background-image: var(--bundle-promo-banner-bg-image, none)` so the
  higher-specificity shorthand doesn't mask the new image variable

---

## Phase 6: Widget Rebuild

```bash
npm run build:widgets
```

---

## Build & Verification Checklist

- [ ] TypeScript compiles without new errors
- [ ] Widget rebuilt — bundled JS in `extensions/bundle-builder/assets/`
- [ ] Backward-compatible: existing rows with no `promoBannerBgImage` render as solid colour
- [ ] CSS variable emits `none` when field is null
- [ ] Picker opens, shows thumbnails, loads more, selects image, saves URL
- [ ] "Remove image" clears field → CSS variable reverts to `none`
- [ ] DCP page reload → selected image persists

## Rollback Notes

Revert commits touching:
- `app/types/state.types.ts`
- `app/components/design-control-panel/config/defaultSettings.ts`
- `app/lib/css-generators/css-variables-generator.ts`
- `app/routes/app/app.design-control-panel/handlers.server.ts`
- `app/components/design-control-panel/settings/PromoBannerSettings.tsx`
- `extensions/bundle-builder/assets/bundle-widget-full-page.css`

Delete created files:
- `app/routes/app/app.store-files.tsx`
- `app/components/design-control-panel/settings/FilePicker.tsx`

Rebuild widget bundle.
