# Issue: EB Step Setup + Readiness Score Parity — FPB & PPB

**Issue ID:** eb-step-setup-readiness-parity-1
**Status:** Completed
**Priority:** 🔴 High
**Created:** 2026-05-17
**Last Updated:** 2026-05-17 14:00

## Overview

Full parity of the Step Setup section (FPB + PPB configure pages) and Bundle Readiness Score overlay against Easy Bundles (EB) competitor, based on a live Chrome DevTools audit.

Architecture doc: `docs/eb-step-setup-readiness-parity/02-architecture.md`

## Phases Checklist

- [x] Phase 1-A: BundleReadinessOverlay — collapsed bar subtitle
- [x] Phase 1-B: constants/bundle.ts — add Weight to condition type options
- [x] Phase 1-C: FPB route — step chips chevron + s-switch toggle
- [x] Phase 1-D: PPB route Phase 1 — header tooltip, chips chevron, rules restructure, step config
- [x] Phase 2: PPB route Phase 2 — multi-category loader + action + UI

## Progress Log

### 2026-05-17 12:00 - Completed Phase 1 (A–D)
- ✅ BundleReadinessOverlay.tsx: collapsed bar subtitle → "Complete all steps to maximise your bundle's success." + removed unused `doneCount` variable
- ✅ app/constants/bundle.ts: added `{ label: "Weight", value: "weight" }` to STEP_CONDITION_TYPE_OPTIONS
- ✅ FPB route: step chips get `›` chevron suffix via `.stepChipChevron` span; Step Setup `s-checkbox` → `s-switch`
- ✅ FPB CSS: added `.stepChipChevron` class
- ✅ PPB route: Step Flow header gets `s-button icon="info"` + "How to setup?" link; step chips get `›` chevron; "Conditions" section restructured to EB-style "Rules Configuration" (radio group + Rule #N cards + autoNext checkbox); "Step Config" card added (image upload + Step Title field)
- ✅ PPB CSS: added `.stepChipChevron` and `.headingWithHelp` classes
- Files changed: BundleReadinessOverlay.tsx, constants/bundle.ts, FPB route.tsx, FPB configure.module.css, PPB route.tsx, PPB configure.module.css
- Next: Phase 2 — PPB multi-category system (StepCategory loader + action + UI)

### 2026-05-17 13:00 - Completed Phase 2: PPB multi-category system
- ✅ PPB loader: added `StepCategory: { orderBy: { sortOrder: "asc" } }` to Prisma include
- ✅ PPB handler: added StepCategory create block in step upsert (same pattern as FPB)
- ✅ PPB handler: updated `hasConfiguredSteps` validation to also count StepCategory products/collections
- ✅ PPB handler: updated post-save Prisma include to return StepCategory
- ✅ PPB handler: added `categories` field to `buildBundleBaseConfig` metafield output
- ✅ PPB route: added category accordion state (categoryOpen, categoryActiveTabs, draggedCatKey, dragOverCatKey)
- ✅ PPB route: added drag-and-drop handlers (handleCatDragStart, handleCatDragEnd, handleCatDrop)
- ✅ PPB route: replaced flat Products/Collections tabs with EB-style multi-category accordion (no "Display variants as individual products" checkbox per EB PPB spec)
- ✅ PPB CSS: added full set of category accordion classes (categoryAccordion, categoryAccordionHeader, categoryAccordionBody, tab/tabActive/tabBadge, catNameRow, categoryNameInput, productActions, ebCategoryDrag/Name/Actions, categoryDragOver, categoryChevron)
- Files changed: PPB route.tsx, PPB handlers.server.ts, PPB configure.module.css, issue file
- Breaking change note: existing PPB StepProduct records will not appear in new category UI — merchants must re-add products. Sync prompt banner can be added as a follow-on.

### 2026-05-17 14:00 - Fixed minor gap: Categories heading "How to setup?" link
- ✅ PPB route: added "How to setup?" link button to the right of the Categories heading (EB PPB has this inline; was missing from WPB PPB)
- Files changed: PPB route.tsx, issue file

### 2026-05-17 13:30 - Added legacy products migration banner
- ✅ PPB route: added `s-banner tone="warning"` above the Categories section for steps where `StepProduct.length > 0` AND `StepCategory.length === 0` — prompts merchants to re-add products via the new category system
- Files changed: PPB route.tsx, issue file

## Related Documentation
- Architecture: `docs/eb-step-setup-readiness-parity/02-architecture.md`
- Audit screenshots: `docs/app-nav-map/screenshots/` (eb-full-step-setup-*, eb-dashboard-*, etc.)
