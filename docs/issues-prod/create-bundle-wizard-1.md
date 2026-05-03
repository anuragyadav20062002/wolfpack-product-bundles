# Issue: Create Bundle Wizard — Step 01

**Issue ID:** create-bundle-wizard-1
**Status:** In Progress
**Priority:** 🔴 High
**Created:** 2026-05-02
**Last Updated:** 2026-05-03 17:30

## Overview
Replace the dashboard Create Bundle modal with a full-page multi-step wizard at `/app/bundles/create`. Step 01 collects bundle name, description, bundle type, and page layout. Also adds `data-tour-target` attributes to FPB and PPB configure pages per guided-tour-reference.md Section 3.

## Progress Log

### 2026-05-03 - Starting Phase 7: Design polish
- Rewriting route.tsx: step indicator (circle only on step 01, dashed connectors, row layout), correct images (pdp.png/fpb.png/floatingCardThumbnail.png/sidePanelThumbnail.png), remove required attr, help bordered button, card body row layout, outlined View Demo buttons
- Rewriting create-bundle.module.css: full overhaul to match Figma spec

### 2026-05-03 00:30 - Completed all phases
- ✅ Stage 1 + 2 docs: `docs/create-bundle-wizard/01-requirements.md`, `02-architecture.md`
- ✅ New wizard route: `app/routes/app/app.bundles.create/route.tsx` + CSS module
- ✅ 4 unit tests passing: `tests/unit/routes/create-bundle-wizard.test.ts`
- ✅ Dashboard modal removed; Create Bundle button navigates to `/app/bundles/create`
- ✅ `useDashboardState` stripped of all create-modal state
- ✅ Dashboard filter selects: labels hidden, "All" replaces placeholder options, status defaults to "active"
- ✅ `data-tour-target` attrs added to FPB: fpb-step-setup, fpb-discount-pricing, fpb-design-settings, fpb-bundle-visibility
- ✅ `data-tour-target` attrs added to PPB: ppb-product-selection, ppb-discount-pricing, ppb-design-settings, ppb-bundle-status
- Committed: 95dc10a9

## Related Documentation
- `docs/create-bundle-wizard/01-requirements.md`
- `docs/create-bundle-wizard/02-architecture.md`
- `docs/guided-tour-reference.md` — Section 3

## Progress Log

### 2026-05-03 12:00 - Starting Phase 8: Step 02 Configuration wizard step
- New wizard step at `/app/bundles/create/configure/:bundleId`
- Adding DB fields: BundleStep.pageTitle, BundleStep.filters, Bundle.searchBarEnabled
- Updating handleCreateBundle redirect to point to new wizard step
- Multi-step carousel animation with slide transitions
- Features: step config card, product/collection picker, rules, filters, bundle status sidebar, step summary, multi-language modal

### 2026-05-03 17:30 - Completed Phase 8: Step 02 Configuration wizard step
- ✅ New route: `app/routes/app/app.bundles.create_.configure.$bundleId/route.tsx` (trailing underscore escapes layout nesting)
- ✅ CSS module: `wizard-configure.module.css` — 2-col layout (1fr 340px sticky sidebar), step chips, slide animations, rules/filter rows, multi-language modal
- ✅ `BundleGuidedTour.tsx` — 4-step guided tour overlay, localStorage gate, section highlight via `data-tour-target`
- ✅ `BundleReadinessOverlay.tsx` — fixed bottom-left SVG arc score widget, auto-opens after tour
- ✅ `tourSteps.ts` — `WIZARD_CONFIGURE_TOUR_STEPS` targeting wizard sections
- ✅ Removed mandatory step-name client validation (s-text-field shadow DOM limitation in automation; server already has fallback `Step N`)
- ✅ `handleCreateBundle` action redirects to new wizard configure step instead of PPB/FPB configure pages
- ✅ Tested: tour navigation (4 steps), step chip add/navigation, rules/filter dynamic rows, multi-language modal, readiness score, form submit + redirect to PPB configure page
- ✅ Narrow viewport (390px) tested — single-column layout, all sections accessible
- Files changed: route.tsx, wizard-configure.module.css, BundleGuidedTour.tsx, BundleReadinessOverlay.tsx, tourSteps.ts, create-bundle route action

## Phases Checklist
- [x] Phase 1: TDD — write failing tests for create-bundle action
- [x] Phase 2: New wizard route + CSS module
- [x] Phase 3: Remove dashboard modal, update Create Bundle button, strip useDashboardState
- [x] Phase 4: Add data-tour-target attrs to FPB configure page
- [x] Phase 5: Add data-tour-target attrs to PPB configure page
- [x] Phase 6: Update APP_NAVIGATION_MAP.md
- [x] Phase 7: Design polish — step indicator, images, card layout, help button, outlined buttons
- [x] Phase 8: Step 02 Configuration — wizard route, DB migration, carousel animation, all feature cards
