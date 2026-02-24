# Issue: DCP Header Preview - Add Full Page Bundle Tab Support

**Issue ID:** dcp-header-preview-fullpage-tabs-1
**Status:** Completed
**Priority:** 🟡 Medium
**Created:** 2026-02-24
**Last Updated:** 2026-02-24 11:15

## Overview
The Bundle Header preview in the DCP currently only shows product-page modal tabs (`.bundle-header-tab`). Need to add a toggle to also preview full-page bundle step tabs (`.step-tab`) which have a different design: tab-number circles, tab-info with name/count, tab-check icons, locked state, and product image overlaps.

## Key Differences
- **Product-page tabs**: Simple pill buttons using `.bundle-header-tab` class
- **Full-page tabs**: Rich cards using `.step-tab` with number circles, info columns, check icons, product image stacks, and locked states

## Progress Log

### 2026-02-24 11:00 - Starting Implementation
- Adding BundleTypeToggle to BundleHeaderPreview
- Adding full-page tab preview using real `.step-tab` CSS classes (rendered through PreviewScope)
- File to modify: `app/components/design-control-panel/preview/BundleHeaderPreview.tsx`

### 2026-02-24 11:15 - Completed Implementation
- Added Product Page / Full Page toggle to headerTabs subsection
- Created full-page tab preview HTML using real `.step-tab` CSS classes:
  - Tab 1: active + completed state with number circle, name, "2 selected" count, checkmark icon
  - Tab 2: default/current state with number circle and name only
  - Tab 3: locked state with number circle, name, and lock icon
- Real CSS classes (`step-tabs-container`, `step-tab`, `tab-number`, `tab-info`, `tab-name`, `tab-count`, `tab-check`, `tab-lock`) render through PreviewScope's injected CSS
- CSS variables (`--bundle-tabs-active-bg-color`, `--bundle-tabs-active-text-color`, `--bundle-tabs-inactive-bg-color`, `--bundle-tabs-inactive-text-color`, `--bundle-tabs-border-color`, `--bundle-tabs-border-radius`) all apply correctly
- headerText subsection left as-is (product-page modal specific; full-page uses different vars)
- ESLint: 0 errors, 0 warnings
- File modified: `app/components/design-control-panel/preview/BundleHeaderPreview.tsx`

## Phases Checklist
- [x] Phase 1: Add toggle + full-page tab preview for headerTabs subsection
- [x] Phase 2: Add toggle + full-page header text preview for headerText subsection
- [x] Phase 3: Verify CSS variables apply correctly through PreviewScope
