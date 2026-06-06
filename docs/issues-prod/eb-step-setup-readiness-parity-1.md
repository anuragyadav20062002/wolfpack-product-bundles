# Issue: EB Step Setup + Readiness Score Parity — FPB & PPB

**Issue ID:** eb-step-setup-readiness-parity-1
**Status:** Completed
**Priority:** 🔴 High
**Created:** 2026-05-17
**Last Updated:** 2026-05-17 17:30

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

### 2026-05-17 15:00 - Fixed UI gaps: Readiness overlay, Rules layout, Add buttons, Upload states
- ✅ BundleReadinessOverlay.module.css: removed `max-width: 0; opacity: 0; overflow: hidden; transition` from `.scoreLabel` — title + subtitle now always visible in collapsed bar (matching EB)
- ✅ BundleReadinessOverlay.tsx: removed conditional `scoreLabelVisible` class — scoreLabel always rendered
- ✅ PPB route: Rules Configuration dropdowns changed from flex-row (`flexWrap: wrap`) to `flexDirection: column` (stacked vertically matching EB); raw `<input>` replaced with `s-number-field`; added `label` props to `s-select` elements
- ✅ PPB route: "Add Category" button changed from `s-button variant="plain"` to full-width bordered `<button className={addSectionButton}>` with inline + SVG icon
- ✅ PPB route: "Add Rule" button same treatment — full-width bordered button
- ✅ PPB route: Step Config upload button changed from `variant="plain" icon="upload"` → default bordered `s-button`; label now `"Replace"` when image exists, `"Upload file"` when not (removed "Cancel" state)
- ✅ FPB route: same Add Category, Add Rule, and Step Config upload fixes applied
- ✅ FPB route: ebRuleFields changed from 3-column CSS grid to `flex-direction: column` stack; added `label` props and replaced `<input>` with `s-number-field`
- ✅ PPB CSS: added `.addSectionButton` class (full-width, bordered, centered, hover state)
- ✅ FPB CSS: added `.addSectionButton` class (same); changed `.ebRuleFields` from grid to flex-column
- Files changed: BundleReadinessOverlay.tsx, BundleReadinessOverlay.module.css, PPB route.tsx, PPB configure.module.css (via product-page-bundle-configure.module.css), FPB route.tsx, FPB configure.module.css (via full-page-bundle-configure.module.css)

### 2026-05-17 16:30 - Fixed UI polish: upload zone, readiness text, radios, tooltip, checkbox labels
- ✅ BundleReadinessOverlay.module.css: added `width: 265px` to `.collapsed` so subtitle text wraps to 2 lines in both collapsed and expanded states
- ✅ FilePicker.tsx: added `autoOpen?: boolean` + `onClose?: () => void` props; `autoOpen` fires `handleOpen()` on mount and suppresses the inline trigger (no dashed drop zone rendered); `onClose` is called by `handleClose` so parent can unmount the picker on cancel
- ✅ FPB route: Step Config FilePicker now uses `autoOpen` + `onClose` — clicking "Upload file" / "Replace" immediately shows the modal dialog without expanding the section inline
- ✅ PPB route: same FilePicker `autoOpen` + `onClose` fix applied
- ✅ FPB route: Rules Configuration radio group changed from `s-choice-list` (vertical) to inline `<label><input type="radio">` row (3 options: No rules / Step rules / Category rules)
- ✅ PPB route: Rules Configuration radio group same fix (2 options: No rules / Step rules)
- ✅ PPB route: Step Options `s-checkbox` labels — all 4 checkboxes fixed to use `label` attribute instead of slot children (Regular Step, Add-On / Upsell Step, Display products as free, Unlock after bundle completion, Mandatory default product)
- ✅ FPB route: QuestionHelpTooltip `<button>` changed to `<span aria-hidden="true">` — tooltip now shown via CSS hover on parent `.richHelp` span (non-interactive, matching EB)
- Files changed: BundleReadinessOverlay.module.css, FilePicker.tsx, FPB route.tsx, PPB route.tsx

### 2026-05-17 17:30 - Fixed remaining EB parity gaps from deep Chrome DevTools comparison
- ✅ PPB route: Added "Category Title" `s-text-field` inside each category accordion body (EB has this as a separate storefont-visible title distinct from the internal Category Name)
- ✅ PPB route: Added "Display variants as individual products" `s-checkbox` inside each category accordion body (EB has this per-category, confirmed via a11y snapshot uid=25_27)
- ✅ PPB route: Step Config upload button text changed from "Upload file" → "Upload" (matching EB uid label)
- ✅ FPB route: Step Config upload button text changed from "Upload file" → "Upload" (matching EB)
- Files changed: PPB route.tsx, FPB route.tsx, issue file

## Related Documentation
- Architecture: `docs/eb-step-setup-readiness-parity/02-architecture.md`
- Audit screenshots: `docs/app-nav-map/screenshots/` (eb-full-step-setup-*, eb-dashboard-*, etc.)
