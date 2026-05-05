# Issue: Create Bundle Wizard — Step 01

**Issue ID:** create-bundle-wizard-1
**Status:** Completed
**Priority:** 🔴 High
**Created:** 2026-05-02
**Last Updated:** 2026-05-05 16:00

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

### 2026-05-04 10:00 - Completed Phase 9: Migrate all admin UI elements to Polaris web components
- ✅ Replaced 14 plain HTML elements with Polaris `s-*` components
- ✅ `s-button` for: back arrow, Multi Language, Upload Icon, Add Product, Add Rule, Add Filter, Remove rule/filter, Preview
- ✅ `s-badge tone="success"` + `s-clickable` for "N Selected" interactive badge
- ✅ `s-checkbox` for pre-select all
- ✅ `s-heading` for all card/section titles (h2/h3)
- ✅ `s-text color="subdued"` for all helper/subtitle text
- ✅ `s-icon type="..."` for Step Summary row icons (product, note, filter, search, edit)
- ✅ `s-banner tone="info"` for Pro Tip card
- ✅ CSS module cleaned: removed 18 now-unused classes (backBtn, cardTitle, cardSubtitle, multiLangBtn, uploadIconBtn, helperText, tabHelperText, addProductBtn, selectedBadge, preSelectRow, preSelectLabel, removeBtn, addRuleBtn, sideCardTitle, summaryHelperText, summaryIcon, previewBtn, proTipCard/Header/Text)
- ✅ CLAUDE.md updated with Polaris web components first rule
- Custom HTML kept only for: tab navigation, step chip pills, animations, modal backdrop (no Polaris equivalent)

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

### 2026-05-05 12:00 - Completed Phase 10: Step 03 Pricing wizard step
- ✅ Prisma migration: added `showProgressBar Boolean @default(true)` to `BundlePricing`
- ✅ Wizard step state (`wizardStep`) added — step indicator is now dynamic (done/active/future)
- ✅ Step 02 "Next" uses `useFetcher` (`saveConfig` intent) → saves config without redirect → advances to Step 03
- ✅ Step 03 Pricing content: Bundle pricing & Discounts card (toggle, tip banner, discount type select, rule editor with 4-column grid, Add Rule button)
- ✅ Discount Display Options card: Progress bar toggle (`showProgressBar`) + Discount Messaging toggle (`showFooter`) + message template fields when messaging ON
- ✅ Discount Display Options card grays out (`cardDisabled`) when main pricing toggle is OFF
- ✅ Step 03 "Next" uses `useFetcher` (`savePricing` intent) → upserts `BundlePricing` → navigates to full configure page
- ✅ Pricing Summary sidebar showing Discounts/Type/Rules/Progress bar/Messaging states
- ✅ Filters card removed from Step 02 UI; filter state preserved in `WizardStepState` for Step 04
- ✅ Page title + breadcrumb update dynamically per wizard step
- ✅ Back button on Step 03 returns to Step 02 (no network request), scrolls to top
- Files changed: route.tsx, wizard-configure.module.css, schema.prisma, migration SQL

### 2026-05-05 16:00 - Completed Phase 11: Step 04 Assets wizard step + guided tour backdrop
- ✅ Prisma migration: added `BundleCustomField` model (label, fieldType, required, position, options) with relation to Bundle
- ✅ `saveAssets` action intent: updates bundle promo/gif/searchBar, saves per-step filters, recreates custom fields
- ✅ `savePricing` no longer redirects — now advances wizard to step 3 (Assets)
- ✅ Step 04 UI: Media Assets card (Promo Banner + Loading GIF side-by-side with FilePicker + full crop editor), Filters row + drawer modal (step-picker + per-step filter CRUD), Search Bar toggle, Custom Fields row + modal (label/type/required/options), Finish Setup footer
- ✅ Search Bar row removed from Step 02 sidebar (Step 04 is now the authoritative toggle)
- ✅ `assetsFetcher` navigates to full configure page after save
- ✅ BundleGuidedTour: added full-page backdrop (rgba 0.45, z-580), highlighted element raised to z-595 so it appears above the dim; tour card stays at z-600
- ✅ FILTER_TYPE_OPTIONS and CUSTOM_FIELD_TYPE_OPTIONS constants added
- Files changed: route.tsx, wizard-configure.module.css, BundleGuidedTour.tsx, BundleGuidedTour.module.css, schema.prisma, migration SQL

## Phases Checklist
- [x] Phase 1: TDD — write failing tests for create-bundle action
- [x] Phase 2: New wizard route + CSS module
- [x] Phase 3: Remove dashboard modal, update Create Bundle button, strip useDashboardState
- [x] Phase 4: Add data-tour-target attrs to FPB configure page
- [x] Phase 5: Add data-tour-target attrs to PPB configure page
- [x] Phase 6: Update APP_NAVIGATION_MAP.md
- [x] Phase 7: Design polish — step indicator, images, card layout, help button, outlined buttons
- [x] Phase 8: Step 02 Configuration — wizard route, DB migration, carousel animation, all feature cards
- [x] Phase 10: Step 03 Pricing — DB migration, dynamic wizard step, pricing cards, sidebar, fetcher-based save
- [x] Phase 11: Step 04 Assets — DB migration (BundleCustomField), media assets, filters drawer, search bar, custom fields modal, guided tour backdrop
