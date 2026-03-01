# Issue: Image Upload in Promo Banner File Picker

**Issue ID:** promo-banner-upload-1
**Status:** Completed
**Priority:** 🟡 Medium
**Created:** 2026-02-20
**Last Updated:** 2026-02-20 03:00

## Overview

Add image upload capability directly inside the existing FilePicker modal so merchants
can upload a new image to Shopify Content → Files without leaving the DCP. The upload
pipeline runs fully server-side (stagedUploadsCreate → binary POST → fileCreate → poll).

## Progress Log

### 2026-02-20 00:00 - Starting implementation

Files to change:
- `shopify.app.toml` — add `write_files` scope
- `app/routes/app/app.upload-store-file.tsx` (NEW) — upload action route
- `app/components/design-control-panel/settings/FilePicker.tsx` — upload UX

## Related Documentation

- `docs/promo-banner-upload/00-BR.md`
- `docs/promo-banner-upload/02-PO-requirements.md`
- `docs/promo-banner-upload/03-architecture.md`
- `docs/promo-banner-upload/04-SDE-implementation.md`

### 2026-02-20 01:00 - Completed all phases

- ✅ Phase 1: `write_files` added to scopes in `shopify.app.toml`
- ✅ Phase 2: `app/routes/app/app.upload-store-file.tsx` — action route with stagedUploadsCreate → binary POST → fileCreate → poll (30s max)
- ✅ Phase 3: `FilePicker.tsx` — upload button, hidden file input, uploadFetcher, uploadStatus state machine, error/timeout banners, grid disable during upload
- ✅ Lint: 0 errors (32 pre-existing warnings)

### 2026-02-20 03:00 - Completed Phase 5: Bug fixes + UX polish

- ✅ `app.upload-store-file.tsx` — fixed `TypeError: Response.json is not a function` by replacing `Response.json()` with `json()` from `@remix-run/node` (matches codebase pattern)
- ✅ `FilePicker.tsx` — replaced Polaris `Modal` with `createPortal` overlay at `z-index: 99999` so it renders above the App Bridge `<Modal variant="max">` DCP modal; added Escape key capture (stops propagation) to prevent DCP close while picker is open; body scroll locked while picker is open
- ✅ `FilePicker.tsx` — redesigned trigger: dashed-border upload zone when no image, thumbnail + Change/Remove buttons when image selected
- ✅ Lint: 0 errors

### 2026-02-20 02:00 - Completed Phase 4: Client-side polling refactor

User feedback: action must not hold HTTP connection open for 30s polling; instead
use fast action + client-side polling with a progress circle.

- ✅ `app/routes/app/app.upload-store-file.tsx` — added `loader` for status checks (`?fileId=`), removed polling loop from `action` (now returns `{ ok, fileId }` immediately after fileCreate ~2–3s)
- ✅ `app/components/design-control-panel/settings/FilePicker.tsx` — added `ProgressCircle` SVG component (spinning/success states), `statusFetcher`, `pollTrigger` state, `pollCountRef`; new upload state machine: "idle" | "uploading" | "polling" | "success" | "timeout" | "error"; grid/buttons blocked only during uploading+polling; success auto-resets to idle after 1.5s
- ✅ Lint: 0 errors

## Phases Checklist

- [x] Phase 1: Scope addition (shopify.app.toml)
- [x] Phase 2: Upload action route (initial blocking implementation)
- [x] Phase 3: FilePicker upload UX (initial)
- [x] Lint
- [x] Commit (7c7a953)
- [x] Phase 4: Client-side polling refactor + ProgressCircle
- [x] Lint
- [x] Commit
- [x] Phase 5: Bug fixes + UX polish
- [x] Lint
- [x] Commit
