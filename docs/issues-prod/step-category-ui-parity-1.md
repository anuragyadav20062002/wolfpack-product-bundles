# Issue: Step Setup + Category UI/UX Parity with Easy Bundles

**Issue ID:** step-category-ui-parity-1
**Status:** In Progress
**Priority:** 🔴 High
**Created:** 2026-05-15
**Last Updated:** 2026-05-15 23:00

## Overview

Full UI/UX parity between WPB Full-Page Bundle edit flow and Easy Bundles for:
- Bundle Product card (step product cards)
- Step Setup section (entirely)
- Category section with per-category Products + Collections tabs

Easy Bundles is the gold standard reference. Every pixel-accurate difference must be
resolved. Architectural/data model changes are driven by EB's category-per-row model.

## Architecture Decisions

- **Data model**: Option B — New `StepCategory` Prisma model (full relational, separate table)
  - Replaces the existing `collections` (Json) + `filters` (Json) blobs on `BundleStep`
  - Each `StepCategory` has: `name`, `sortOrder`, `products` (Json), `collections` (Json)
  - EB's model: each category = { name (storefront tab label), products[], collections[] }
  - `BundleStep.StepProduct[]` relation stays for backward compat during migration

- **Category section**: Both "Browse Products" and "Browse Collections" tabs work per category
  - EB uses category rows so merchants can assign both Products AND Collections to one tab
  - WPB must implement the same per-category Products + Collections tabs

## Phases Checklist

### Phase 1 — Safe UI changes (no data model dependency)
- [x] Nav rail: Replace ✥/◌/⌂/⌘ emoji icons with ●/○ CSS circle indicators
- [x] Step chip: Remove ✕ delete button from chip
- [x] Step Setup header: Add globe (Multi Language) + clone + delete icon buttons alongside checkbox (match EB header layout)
- [x] Step Setup card: Remove bottom Clone Step + Delete Step buttons (moved to header)

### Phase 2 — StepCategory Prisma model
- [x] Add `StepCategory` model to `prisma/schema.prisma`
- [x] Add `StepCategory[]` relation to `BundleStep`
- [x] Run Prisma migration: `npx prisma migrate dev` → `20260515135812_add_step_category`

### Phase 3 — FPB save handler + loader
- [x] Update FPB loader Prisma include to load `StepCategory[]` (`route.tsx` + all handler re-fetches)
- [x] Save handler: add `StepCategory: { create: [...] }` to step create block
- [x] All 5 Prisma includes in `handlers.server.ts` updated with `StepCategory: { orderBy: { sortOrder: 'asc' } }`

### Phase 4 — FPB route UI — Category accordion rows
- [x] Add `categoryActiveTabs: Record<string, number>` state (keyed by `${stepId}__${catId}`)
- [x] Replace old step-level Browse Products/Collections tabs + legacy Category filters section with EB-style per-category accordion rows
- [x] Each row: drag handle + inline name textbox + clone/delete icon buttons
- [x] Per-category Browse Products tab + Browse Collections tab with resourcePicker
- [x] Add Category button appends new empty `StepCategory` to state
- [x] All mutations wired to `stepsState.updateStepField` + `markAsDirty()`
- [x] CSS: added `.categoryAccordion`, `.categoryAccordionHeader`, `.categoryNameInput` classes
- [x] Lint: 0 errors

### Phase 5 — Metafield builders + widget
- [x] Update `bundle-product.server.ts` to read `StepCategory[]` for metafield config
- [x] Update `component-product.server.ts` for variant GID resolution
- [x] Update `handlers.server.ts` buildFpbBaseConfig / buildFullPageBundleMetafieldSteps
- [x] Metafield shape extended with `categories` field; widget backward compat maintained via flattened `products`/`collections`

### Phase 6 — Create wizard parity
- [ ] Update `app.bundles.create_.configure.$bundleId/route.tsx` for same Category UI

### Phase 7 — Lint + Chrome DevTools verification
- [ ] 0 ESLint errors on all modified files
- [ ] Chrome DevTools screenshot comparison: WPB vs EB Step Setup + Category section

## Progress Log

### 2026-05-15 23:00 — Completed Phase 5

- ✅ `buildFullPageBundleMetafieldSteps` updated: flattens StepCategory products into `step.products` (backward compat) and StepCategory collections into `step.collections`; writes optional `step.categories` array for future widget tab support
- ✅ Validation in `handleSaveBundle` now counts StepCategory products/collections as valid "has products" signal
- ✅ `bundle-product.server.ts`: after StepProduct/collections processing, also resolves product GIDs from `step.StepCategory[i].products` and fetches collection products from `step.StepCategory[i].collections`
- ✅ `component-product.server.ts`: same StepCategory additions — ensures `component_parents` metafield is written to component variants even when products come from categories
- ✅ Lint: 0 errors on all modified files
- Files modified: `handlers.server.ts`, `bundle-product.server.ts`, `component-product.server.ts`

### 2026-05-15 22:15 — Auto-save bug fix (FPB + PDP)

- **Root cause**: `<form>` wrapped the entire canvas (~2000 lines of JSX including all text inputs). Pressing Enter in any text field submitted the form → `handleSave()` → auto-save
- **Fix FPB**: Closed `</form>` after the last `<input type="hidden">` (stepConditions), BEFORE `<div className={canvasHeader}>` — canvas content now outside the form
- **Fix PDP**: Same fix applied — form closed after hidden inputs, before AppEmbedBanner
- `handleSave()` uses `fetcher.submit(formData)` with a freshly built FormData from React state; the SaveBar `<button type="submit">` still submits the (now smaller) form correctly
- Lint: 0 errors on both routes
- Files modified: `route.tsx` (FPB), `route.tsx` (PDP)

### 2026-05-15 22:00 — Completed Phase 4

- ✅ Added `categoryActiveTabs` state to FPB route for per-category tab selection
- ✅ Replaced old Category card body (step-level tabs + legacy filters section) with EB-style accordion
- ✅ Each `StepCategory` row renders: drag handle (⋮⋮), inline-editable name input, clone/delete icons, Browse Products + Browse Collections tabs with resourcePicker, product/collection lists with Remove buttons
- ✅ "Add Category" button appends `{ id: cat-${Date.now()}, name, sortOrder, products: [], collections: [] }` to `step.StepCategory`
- ✅ CSS: `.categoryAccordion`, `.categoryAccordionHeader`, `.categoryNameInput` added to `full-page-bundle-configure.module.css`
- ✅ Lint: 0 errors on FPB route
- Files modified: `route.tsx` (FPB), `full-page-bundle-configure.module.css`

### 2026-05-15 21:45 — Completed Phase 3

- ✅ `route.tsx` loader include: added `StepCategory: { orderBy: { sortOrder: 'asc' } }` alongside `StepProduct: true`
- ✅ `handlers.server.ts`: all 5 `StepProduct: true` includes updated to also include `StepCategory`
- ✅ `handlers.server.ts` step create: added `StepCategory: { create: [...] }` block — creates category rows from payload on save
- ✅ Lint: 0 errors on both files
- Files modified: `route.tsx` (FPB), `handlers.server.ts`

### 2026-05-15 21:30 — Completed Phase 1 + Phase 2

- ✅ Nav rail: `isActive ? "●" : "○"` replaces all 4 emoji icons
- ✅ Step chip: `✕` remove span block removed
- ✅ Step Setup cardHeader: added globe (disabled, conditional on shopLocales), duplicate, delete icon buttons in a flex wrapper alongside the s-checkbox
- ✅ Step Setup card: removed bottom `<s-divider>` + `Clone Step` + `Delete Step` stack
- ✅ `StepCategory` model added to `prisma/schema.prisma` with `stepId`, `name`, `sortOrder`, `products` (Json), `collections` (Json)
- ✅ `BundleStep` gained `StepCategory[]` relation
- ✅ Migration `20260515135812_add_step_category` applied to SIT DB
- Files modified: `route.tsx` (FPB), `prisma/schema.prisma`, `prisma/migrations/20260515135812_add_step_category/migration.sql`
- Lint: 0 errors on FPB route

### 2026-05-15 21:00 — Starting Phase 1 (safe UI changes)

Files to modify:
- `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/route.tsx`
- `app/styles/routes/full-page-bundle-configure.module.css` (if needed)

Changes:
1. Nav rail icons: `isActive ? "●" : "○"` for all 4 nav items
2. Step chip: remove `✕` span block
3. Step Setup cardHeader: add 3 icon buttons (globe, duplicate, delete) before checkbox
4. Step Setup card: remove bottom divider + Clone Step + Delete Step buttons block

## Related Documentation

- Issue: `docs/issues-prod/edit-bundle-ui-redesign-1.md` (parent UI redesign)
- Issue: `docs/issues-prod/savebar-wiring-audit-2.md` (save bar fixes, completed)
- Issue: `docs/issues-prod/step-category-filters-1.md` (earlier step-level filters work)
