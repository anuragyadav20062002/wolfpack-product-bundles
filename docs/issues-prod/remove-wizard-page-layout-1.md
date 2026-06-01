# Issue: Remove Page Layout from Create Bundle Wizard
**Issue ID:** remove-wizard-page-layout-1
**Status:** Completed
**Priority:** 🟡 Medium
**Created:** 2026-06-01
**Last Updated:** 2026-06-01 03:00

## Overview
Remove the "Page Layout" selection section from Step 01 of the bundle creation wizard.
Layout is now handled through Select Template in the edit/configure flow.

## Progress Log
### 2026-06-01 02:00 - Removing Page Layout section
- Remove fullPageLayout state and UI section from create route
- Remove fullPageLayout from formData read in handleCreateBundle (default to FOOTER_BOTTOM)
- Update create-bundle-wizard test to not send/assert fullPageLayout

### 2026-06-01 03:00 - Completed
- Removed FullPageLayout import, fullPageLayout state, Page Layout UI section, and hidden input from create route
- handleCreateBundle now hardcodes FullPageLayout.FOOTER_BOTTOM for FPB bundles
- Updated create-bundle-wizard test (removed fullPageLayout field/assertion)
- Fixed fpb-save-bundle test broken by prior pricing tiers removal (showStepTimeline now saves directly)
- All 42 affected tests passing; linter shows 0 errors

## Phases Checklist
- [x] Remove Page Layout UI from create route
- [x] Update handleCreateBundle to hardcode default layout
- [x] Update test
