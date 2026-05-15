# Issue: Step Setup + Category UI/UX Parity with Easy Bundles

**Issue ID:** step-category-ui-parity-1
**Status:** In Progress
**Priority:** 🔴 High
**Created:** 2026-05-15
**Last Updated:** 2026-05-15 21:45

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
- [ ] Render EB-style expandable category rows (name textbox, Products tab, Collections tab)
- [ ] Per-category: Browse Products browser + Browse Collections browser
- [ ] Add Category / Delete Category buttons
- [ ] Wire all category changes through `markAsDirty()` and `handleDiscard`

### Phase 5 — Metafield builders + widget
- [ ] Update `bundle-product.server.ts` to read `StepCategory[]` for metafield config
- [ ] Update `component-product.server.ts` for variant GID resolution
- [ ] Update `handlers.server.ts` buildFpbBaseConfig / buildFullPageBundleMetafieldSteps
- [ ] If metafield JSON shape changes: rebuild widget (`npm run build:widgets`)

### Phase 6 — Create wizard parity
- [ ] Update `app.bundles.create_.configure.$bundleId/route.tsx` for same Category UI

### Phase 7 — Lint + Chrome DevTools verification
- [ ] 0 ESLint errors on all modified files
- [ ] Chrome DevTools screenshot comparison: WPB vs EB Step Setup + Category section

## Progress Log

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
