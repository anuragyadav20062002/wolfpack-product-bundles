# Issue: Full-Page Layout Selection (Footer Bottom / Footer Side)

**Issue ID:** full-page-layout-selection-1
**Status:** In Progress
**Priority:** 🟡 Medium
**Created:** 2026-02-24
**Last Updated:** 2026-02-24 18:00

## Overview
Add two layout options for full-page bundles: "Footer at Bottom" (existing default) and "Footer at Side" (new sidebar panel layout). Includes onboarding flow with card-based layout selection during bundle creation and a layout dropdown in the configure page.

## Feature Pipeline Documents
- BR: `docs/full-page-layout-selection/00-BR.md`
- PO: `docs/full-page-layout-selection/02-PO-requirements.md`
- Architecture: `docs/full-page-layout-selection/03-architecture.md`

## Progress Log

### 2026-02-24 18:00 - SDE Implementation (Phases 1-7)
- ✅ Phase 1: Database — Added `FullPageLayout` enum + field to Prisma schema, ran migration
- ✅ Phase 2: API — Added `fullPageLayout` to bundle JSON endpoint
- ✅ Phase 3: Create flow — Layout cards with storefront illustrations in dashboard modal
- ✅ Phase 4: Configure flow — Select dropdown, formData, server handler, state hooks
- ✅ Phase 5: Widget JS — `renderFullPageLayoutWithSidebar()`, `renderSidePanel()`, branch in `updateProductSelection()`
- ✅ Phase 6: Widget CSS — Sidebar panel styles, responsive collapse at 768px
- ✅ Phase 7: Build widgets, lint (0 errors), commit

### Files changed:
- `prisma/schema.prisma` — FullPageLayout enum + field
- `prisma/migrations/20260224134520_add_full_page_layout/`
- `app/routes/api/api.bundle.$bundleId[.]json.tsx` — API response
- `app/hooks/useDashboardState.ts` — fullPageLayout state
- `app/routes/app/app.dashboard/route.tsx` — Layout cards UI
- `app/routes/app/app.dashboard/dashboard.module.css` — Layout illustration styles
- `app/routes/app/app.dashboard/handlers/handlers.server.ts` — Persist on create
- `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/types.ts` — BundleData type
- `app/hooks/useBundleForm.ts` — fullPageLayout field
- `app/hooks/useBundleConfigurationState.ts` — State, discard, save
- `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/route.tsx` — Select dropdown + formData
- `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/handlers/handlers.server.ts` — Extract + persist
- `app/assets/bundle-widget-full-page.js` — Sidebar layout rendering
- `extensions/bundle-builder/assets/bundle-widget-full-page.css` — Sidebar CSS
- `extensions/bundle-builder/assets/bundle-widget-full-page-bundled.js` — Built output

## Phases Checklist
- [x] Phase 1: Database schema
- [x] Phase 2: API endpoint
- [x] Phase 3: Create flow (dashboard)
- [x] Phase 4: Configure flow
- [x] Phase 5: Widget JS
- [x] Phase 6: Widget CSS
- [x] Phase 7: Build, lint, commit
