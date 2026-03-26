# Issue: FPB Sidebar Step Tabs Position + Tier Pills Not Showing in DCP Preview

**Issue ID:** fpb-sidebar-tabs-tier-pills-1
**Status:** Completed
**Priority:** 🔴 High
**Created:** 2026-03-27
**Last Updated:** 2026-03-27 11:30

## Overview

Two DCP preview bugs:

1. **Step tabs wrong position in sidebar layout**: The live widget and preview both render
   step tabs as a 240px left-column inside `.sidebar-layout-wrapper`. The intended design
   has step tabs ABOVE the product grid (outside `.sidebar-layout-wrapper`), matching how
   the floating footer layout renders them.

2. **Tier pills never visible**: The DCP_SECTION_CHANGE handler tries to show tier pills
   by setting `tierBar.style.display = ''` (empty string), but the preview CSS already has
   `.bundle-tier-pill-bar { display: none }` as a stylesheet rule. Clearing the inline style
   just exposes the CSS `none` again. Fix: use `display: 'flex'` explicitly.

## Root Causes

**Bug 1**:
- `renderFullPageLayoutWithSidebar()`: `createStepTimeline()` appended to `twoColWrapper`
  as first flex child → left column
- Fix: append to `stepsContainer` BEFORE `twoColWrapper`
- CSS: remove `.sidebar-layout-wrapper .step-tabs-container` vertical-column rules (desktop
  and mobile override) — tabs are no longer inside that wrapper

**Bug 2**:
- `DCP_SECTION_CHANGE` handler line: `tierBar.style.display = section === 'tierPills' ? '' : 'none'`
- `''` clears inline style → CSS `.bundle-tier-pill-bar { display: none }` takes over
- Fix: `'flex'` instead of `''`

## Phases Checklist

- [x] Phase 1: Fix tier pills display in DCP_SECTION_CHANGE handler
- [x] Phase 2: Fix step tabs position in live widget JS
- [x] Phase 3: Fix preview HTML to match new structure
- [x] Phase 4: Remove obsolete CSS rules for sidebar left-column tabs
- [x] Phase 5: Rebuild widget bundles

## Progress Log

### 2026-03-27 11:00 - Starting implementation
- Files: `app/routes/api/api.preview.$type.tsx`, `app/assets/bundle-widget-full-page.js`,
  `extensions/bundle-builder/assets/bundle-widget-full-page.css`

### 2026-03-27 11:30 - Completed all phases
- ✅ Tier pills: `DCP_SECTION_CHANGE` handler changed from `''` → `'flex'` for the tierPills
  show case; step tabs changed from `''` → `'flex'` for the non-tierPills case. The CSS
  stylesheet rule `.bundle-tier-pill-bar { display: none }` was overriding the empty-string
  inline style clear, so pills never appeared.
- ✅ Step tabs position (live widget): `createStepTimeline()` now appended to
  `stepsContainer` BEFORE `twoColWrapper` instead of inside it. Comment updated from
  "three-column" to "two-column" wrapper.
- ✅ Step tabs position (preview HTML): `.step-tabs-container` block moved above
  `.sidebar-layout-wrapper` in `fpbSidebarHtml`.
- ✅ CSS cleanup: removed `.sidebar-layout-wrapper .step-tabs-container` vertical-column
  rules (desktop: flex-direction column, 240px width; mobile: full-width horizontal
  override). Also removed `.sidebar-layout-wrapper .step-tab` scoped rules. ~1.4KB saved.
- Files changed: `app/routes/api/api.preview.$type.tsx`,
  `app/assets/bundle-widget-full-page.js`,
  `extensions/bundle-builder/assets/bundle-widget-full-page.css`,
  `extensions/bundle-builder/assets/bundle-widget-full-page-bundled.js`
