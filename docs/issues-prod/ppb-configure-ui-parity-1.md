# Issue: PPB Configure Page — 100% UI/UX Parity with FPB

**Issue ID:** ppb-configure-ui-parity-1
**Status:** Completed
**Priority:** 🔴 High
**Created:** 2026-05-16
**Last Updated:** 2026-05-17 01:00

## Overview

The Product Page Bundle (PPB) configure/edit page must achieve 100% visual and interaction parity with the Full Page Bundle (FPB) configure page. A user should not be able to distinguish the two designs. FPB is the source of truth.

Scope: configure/edit page only (no dashboard, no creation wizard).

Key constraints:
- Features only in one bundle type → hidden from DOM entirely (not disabled)
- Sync Bundle button → removed from DOM
- Open in Theme Editor button → removed from DOM
- Bundle Status card → removed from DOM
- Readiness: use BundleReadinessOverlay component (same as FPB) with PPB-specific items

## PPB Readiness Items (from EB PPB reference)
1. App embed enabled (15 pts)
2. Products added to a step (20 pts)
3. Discount configured (15 pts)
4. Widget placed on product page (25 pts) — PPB-specific (checks upsellWidgetEnabled)
5. Parent product active (15 pts)

## Progress Log

### 2026-05-17 01:00 - Completed all phases
- ✅ Phase 1: Added all FPB canvas layout CSS classes to product-page-bundle-configure.module.css (editCanvas, canvasHeader, canvasTitleGroup/Row, canvasBackButton, canvasTitle, canvasActions, readinessButton*, editGrid, leftColumn, mainColumn, leftCardHeader/Title, bundleProduct* panel styles, ebSubNav*, stepNav, stepChip*, addStepBtn, card, cardHeader, stepFlowCard, slideForward/Backward animations)
- ✅ Phase 2: Removed Open in Theme Editor and Sync Bundle buttons from ui-title-bar (Dashboard breadcrumb only)
- ✅ Phase 3: Added FPB-style canvas header (← back button + "Configure Bundle Flow" + readiness score button + Preview Bundle)
- ✅ Phase 4: Reordered left column — Bundle Product card first (FPB-style panel with icon tile, name, edit button, parent product status), Bundle Setup nav second (with ebSubNav for step_setup children), Bundle Status card removed from DOM
- ✅ Phase 5: Replaced step accordion cards with step chip navigation + animated single-step content (slideKey/slideDir state + navigateToStep/handleAddNewStep + .stepNav/.stepChip/.stepChipActive/.addStepBtn)
- ✅ Phase 6: Replaced custom floating SVG gauge with BundleReadinessOverlay component (readinessOpen state + readinessItems useMemo)
- ✅ Phase 7: Updated bundleSetupItems (3 items: step_setup/discount_pricing/bundle_settings) + added stepSetupChildItems (free_gift_addons/messages)
- Files modified: app/styles/routes/product-page-bundle-configure.module.css, app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/route.tsx

## Related Documentation
- FPB route: app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/route.tsx
- FPB CSS: app/styles/routes/full-page-bundle-configure.module.css
- PPB route: app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/route.tsx
- PPB CSS: app/styles/routes/product-page-bundle-configure.module.css

## Phases Checklist
- [x] Phase 1: Update PPB CSS module — add FPB canvas layout classes
- [x] Phase 2: Remove ui-title-bar action buttons (keep only breadcrumb)
- [x] Phase 3: Add canvas header (back button + title + readiness button + preview)
- [x] Phase 4: Reorder left column (product first, setup nav second, remove status)
- [x] Phase 5: Replace step accordion cards with step chip navigation + slide animations
- [x] Phase 6: Replace floating gauge with BundleReadinessOverlay
- [x] Phase 7: Update bundleSetupItems + add stepSetupChildItems constant
