# Issue: Full-Page Widget Bug Fixes

**Issue ID:** fullpage-widget-bug-fixes-1
**Status:** Completed
**Priority:** 🔴 High
**Created:** 2026-03-10
**Last Updated:** 2026-03-10 00:00

## Overview
Fix critical and high-severity bugs in the full-page bundle widget discovered by agent audit:
1. `activeCollectionId` not reset when navigating between steps
2. Back navigation blocked by `validateStep` in `navigateModal()`
3. Collection filter uses partial `includes()` match causing false positives
4. `updateProductQuantityDisplay` uses unscoped `document.querySelector`
5. `searchQuery` not reset in footer_bottom layout on step navigation

## Progress Log

### 2026-03-10 00:00 - Completed all bug fixes
- ✅ Removed validateStep gate from back-navigation in navigateModal (user can now go back freely)
- ✅ Reset activeCollectionId + searchQuery on all step transitions: sidebar next/back/click, footer next/back
- ✅ Fixed collection filter to use exact numeric ID comparison via extractId() (eliminates partial match false positives)
- ✅ Scoped updateProductQuantityDisplay querySelector to this.container
- ✅ Built widgets at v1.2.1
- Files modified: app/assets/bundle-widget-full-page.js, scripts/build-widget-bundles.js, extensions/bundle-builder/assets/bundle-widget-full-page-bundled.js

## Phases Checklist
- [x] Fix back navigation (navigateModal validateStep)
- [x] Fix activeCollectionId reset on step change
- [x] Fix collection filter exact match
- [x] Fix updateProductQuantityDisplay querySelector scope
- [x] Build widgets
- [x] Commit
