# Issue: DCP Modal Bugs & Dead Code Cleanup

**Issue ID:** dcp-bugs-audit-1
**Status:** Completed
**Priority:** 🔴 High
**Created:** 2026-03-20
**Last Updated:** 2026-03-20 02:00

## Overview
Fix all 8 bugs documented in `docs/dcp-settings-segregation/01-bugs-audit.md`.
Starting with dead code pruning, then working through the data-loss and visual bugs.

## Progress Log

### 2026-03-20 01:00 - Completed all phases
- ✅ Phase 1: Dead code pruned
  - Removed StepBarPreview import + unreachable branch from PreviewPanel.tsx
  - Removed 4 dead exports from settings/index.ts
  - Removed 11 dead step bar setters from useDesignControlPanelState.ts
  - Removed BUNDLE STEP BAR CSS variable block from css-variables-generator.ts
  - Deleted: StepBarPreview.tsx, CompletedStepSettings.tsx, IncompleteStepSettings.tsx, StepBarProgressBarSettings.tsx, StepBarTabsSettings.tsx
- ✅ BUG-03: BASE_GROUP_COUNT 5→4 so FPB divider appears before bundleHeader (index 4) not promoBanner
- ✅ BUG-01: productTitleVisibility added to handler, Prisma schema, CSS generator
- ✅ BUG-02: variantSelector{BgColor,TextColor,BorderRadius} added to handler and Prisma schema
- ✅ BUG-06: generateFullPageVariables() guarded to only run for full_page bundles in index.ts
- ✅ BUG-05: Confirmed ProductCardPreview already handles widgetStyle — no fix needed
- ✅ Migration: 20260320020000_add_designsettings_product_title_and_variant_selector created + applied on SIT

### 2026-03-20 02:00 - Completed preview audit fixes (PREV-01/02/03)
- ✅ PREV-01: Removed dead `customCss` null guard from PreviewPanel (customCss not routable via DCP config)
- ✅ PREV-02: productCardTypography now highlights all three cards in ProductCardPreview (was active={false})
- ✅ PREV-03: bundleType made required in PreviewPanelProps — both callers already passed it

## Phases Checklist
- [x] Phase 1: Dead code pruning + BUG-03/04
- [x] Phase 2: BUG-01 (productTitleVisibility not saved + no CSS var)
- [x] Phase 3: BUG-02 (variantSelector* fields not saved)
- [x] Phase 4: BUG-05 (widgetStyle wrong preview — confirmed no fix needed)
- [x] Phase 5: BUG-06 (generateFullPageVariables guard for full_page only)

## Related Documentation
- `docs/dcp-settings-segregation/01-bugs-audit.md`
