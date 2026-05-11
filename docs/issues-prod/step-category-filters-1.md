# Issue: Category Filter Sub-Tabs Per Step

**Issue ID:** step-category-filters-1
**Status:** In Progress
**Priority:** 🟡 Medium
**Created:** 2026-05-11
**Last Updated:** 2026-05-11 17:00

## Overview

Add horizontal category filter tabs to each bundle step in the FPB widget. Merchants
configure `{ label, collectionHandle }` pairs per step in the admin. The widget renders
a "All | Label A | Label B" tab bar above the product grid; clicking a tab filters the
already-loaded product list to products whose collections include the selected handle.

The `filters Json?` column already exists on `BundleStep` (unused). No DB migration
needed — reuse the column with shape `{ label: string; collectionHandle: string }[]`.

## Phases Checklist

- [x] Phase 1 — Issue file created
- [x] Phase 2 — Failing tests (TDD Red): step-filter pure function + metafield pass-through
- [x] Phase 3 — Metafield sync: add `filters` to step map in bundle-product.server.ts
- [x] Phase 4 — Admin UI: "Category Filters" section in FPB Step Setup card
- [x] Phase 5 — Widget JS: `createCategoryTabs` extended to use `step.filters` custom labels
- [x] Phase 6 — Widget CSS: reuses existing `.category-tabs` / `.category-tab` classes (no new CSS)
- [x] Phase 7 — Build widgets + lint + commit
- [ ] Phase 8 — PPB handler: add `filters` to step create; PPB route: Category Filters card

## Related Documentation

- Architecture: `docs/step-category-filters/02-architecture.md`
- BR context: `docs/ui-audit-26.05.md` § "Category Filter Sub-Tabs Per Step"

## Progress Log

### 2026-05-11 16:30 — Implementation complete

- `app/lib/step-filter.ts`: new pure helper library — `filterProductsByCollectionIds` (collection-based product list filter) + `validateStepFilters` (validates admin input shape `{ label, collectionHandle }[]`)
- `bundle-product.server.ts`: added `filters: Array.isArray(step.filters) ? step.filters : null` to step map in `updateBundleProductMetafields` — passes through to `bundle_ui_config` metafield
- `handlers.server.ts`: added `filters` to step creation in `handleSaveBundle` + added `handle` to `buildFpbBaseConfig` collection map (needed for handle-based lookup in widget)
- `route.tsx`: added "Category Filters" card in Step Setup between Rules and Advanced Step Options — shows list of `{ label, collectionHandle }` rows with label text input + collection dropdown (sourced from step.collections); add/remove buttons; shows empty state when step has no collections
- `bundle-widget-full-page.js`: extended `createCategoryTabs` to check `step.filters` first — when present, renders merchant-defined labels mapped to collection IDs from `step.collections`; falls back to auto-generating tabs from `step.collections` titles unchanged
- Build: `bundle-widget-full-page-bundled.js` 288.6 KB (MINOR bump for new visible feature)
- Tests: 19/19 pass (`step-filter.test.ts` × 16 + `step-category-filters-metafield.test.ts` × 3)
- Lint: 0 errors on all modified files

### 2026-05-11 15:30 — Starting implementation

- `filters Json?` column exists on BundleStep (was unused with old `{id, type, label}` shape)
- Repurposing column with new shape `{ label: string; collectionHandle: string }[]`
- No migration needed
- Files to modify:
  - `tests/unit/services/step-filter.test.ts` (create)
  - `tests/unit/services/bundle-product-metafield-filters.test.ts` (create)
  - `app/services/bundles/metafield-sync/operations/bundle-product.server.ts`
  - `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/route.tsx`
  - `app/assets/bundle-widget-full-page.js`
  - `app/assets/widgets/full-page-css/bundle-widget-full-page.css`
