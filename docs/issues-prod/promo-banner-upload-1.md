# Issue: Image Upload in Promo Banner File Picker

**Issue ID:** promo-banner-upload-1
**Status:** Completed
**Priority:** 🟡 Medium
**Created:** 2026-02-20
**Last Updated:** 2026-02-20 01:00

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

## Phases Checklist

- [x] Phase 1: Scope addition (shopify.app.toml)
- [x] Phase 2: Upload action route
- [x] Phase 3: FilePicker upload UX
- [x] Lint
- [x] Commit
