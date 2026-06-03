# Issue: Upgrade Banner View Plans Layout
**Issue ID:** upgrade-banner-view-plans-layout-1
**Status:** Completed
**Priority:** 🟡 Medium
**Created:** 2026-06-04
**Last Updated:** 2026-06-04 00:34

## Overview
Move the "View Plans" action in the usage/upgrade banner to the far right of the banner while keeping the icon and message aligned on the left.

## Progress Log
### 2026-06-04 00:28 - Started layout fix
- User provided a screenshot showing the "View Plans" button placed next to the info icon instead of at the far right edge.
- Next: locate the banner component/styles, patch the layout, and verify with focused lint/build.

### 2026-06-04 00:34 - Completed right-aligned action layout
- Added a focused layout contract spec and unit test for `UpgradePromptBanner`.
- Replaced the free-plan prompt `s-banner` rendering with a custom Polaris-web-component-backed banner layout so the icon/message stay left and the action uses an auto-left margin at the far right.
- Verification passed: focused Jest, modified-file ESLint with 0 errors, `npm run build`, graphify rebuild, and `git diff --check`.

## Related Documentation
- docs/app-nav-map/APP_NAVIGATION_MAP.md

## Phases Checklist
- [x] Phase 1: Locate banner implementation
- [x] Phase 2: Move action to far right
- [x] Phase 3: Verify lint/build
