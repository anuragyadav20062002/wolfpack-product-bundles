# Issue: FPB Bundle Config Metafield Cache

**Issue ID:** fpb-config-metafield-cache-1
**Status:** Completed
**Priority:** 🔴 High
**Created:** 2026-03-20
**Last Updated:** 2026-03-20 13:00

## Overview
Cache full-page bundle config as a Shopify page metafield (`custom:bundle_config`) so the
FPB widget loads without the app proxy. Mirrors the PDP bundle pattern exactly.

## Pipeline Docs
- `docs/fpb-config-metafield-cache/00-BR.md`
- `docs/fpb-config-metafield-cache/02-PO-requirements.md`
- `docs/fpb-config-metafield-cache/03-architecture.md`
- `docs/fpb-config-metafield-cache/04-SDE-implementation.md`

## Progress Log

### 2026-03-20 07:30 - Starting implementation
- Pipeline stages BR → PO → Architect complete
- Beginning Phase 1: shared bundle formatter

### 2026-03-20 12:55 - Completed Phases 1–4
- Phase 1: Extracted `formatBundleForWidget` into `app/lib/bundle-formatter.server.ts`
  - 10 unit tests in `tests/unit/lib/bundle-formatter.test.ts` — all passing
  - Refactored `api.bundle.$bundleId[.]json.tsx` to use shared formatter
- Phase 2: Added `ensureCustomPageBundleConfigDefinition` to `definitions.server.ts`
  - Exported through `metafield-sync/index.ts` and `metafield-sync.server.ts`
- Phase 3: Added `writeBundleConfigPageMetafield` to `widget-full-page-bundle.server.ts`
  - 5 unit tests in `tests/unit/services/fpb-config-metafield.test.ts` — all passing
  - Non-fatal: errors logged, never thrown — widget falls back to proxy if absent
- Phase 4: Wired metafield write into both FPB handlers
  - `handleValidateWidgetPlacement`: upgraded DB query to include steps/StepProduct/pricing; calls writer after page creation + DB update
  - `handleSyncBundle`: calls writer after page re-creation + DB update (step 5b)
- Files changed:
  - `app/lib/bundle-formatter.server.ts` (new)
  - `app/routes/api/api.bundle.$bundleId[.]json.tsx` (refactored)
  - `app/services/bundles/metafield-sync/operations/definitions.server.ts`
  - `app/services/bundles/metafield-sync/index.ts`
  - `app/services/bundles/metafield-sync.server.ts`
  - `app/services/widget-installation/widget-full-page-bundle.server.ts`
  - `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/handlers/handlers.server.ts`
  - `tests/unit/lib/bundle-formatter.test.ts` (new)
  - `tests/unit/services/fpb-config-metafield.test.ts` (new)
### 2026-03-20 13:00 - Completed Phase 5
- Liquid: injected `bundle_config_json` from `page.metafields.custom.bundle_config`; added `data-bundle-config` attribute to widget container
- Widget: FPB `loadBundleData` now checks `data-bundle-config` first; falls back to proxy API if absent/unparseable
- Bumped WIDGET_VERSION: `2.2.4` → `2.3.0`
- Rebuilt `extensions/bundle-builder/assets/bundle-widget-full-page-bundled.js`
- Files changed:
  - `extensions/bundle-builder/blocks/bundle-full-page.liquid`
  - `app/assets/bundle-widget-full-page.js`
  - `scripts/build-widget-bundles.js`
  - `extensions/bundle-builder/assets/bundle-widget-full-page-bundled.js`

## Phases Checklist
- [x] Phase 1: Shared bundle formatter (`app/lib/bundle-formatter.server.ts`)
- [x] Phase 2: Metafield definition helper (`ensureCustomPageBundleConfigDefinition`)
- [x] Phase 3: `writeBundleConfigPageMetafield` service helper
- [x] Phase 4: Call from both FPB handlers
- [x] Phase 5: Liquid + widget changes + widget rebuild
