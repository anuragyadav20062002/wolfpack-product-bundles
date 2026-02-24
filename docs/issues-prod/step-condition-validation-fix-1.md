# Issue: Step Condition Validation Not Working

**Issue ID:** step-condition-validation-fix-1
**Status:** Completed
**Priority:** 🔴 High
**Created:** 2026-02-24
**Last Updated:** 2026-02-24 14:00

## Overview
Two critical regressions in step condition validation:

### Bug 1: Full-page bundles — conditions not working at all
`updateProductSelection()` calls `updateModalNavigation()` unconditionally. In full-page mode, the modal's `.prev-button`/`.next-button` don't exist (modal is hidden). Accessing `.disabled` on `null` throws a `TypeError` that silently aborts the function before `renderFullPageFooter()` runs. The footer's Next button never updates its disabled state after initial render.

### Bug 2: Product-page bundles — conditions appear global instead of per-step
The tab click handler in `renderModalTabs()` captures `isAccessible` in a stale closure at render time. `isStepAccessible()` only checks previous steps' completion, not the current step. Users can click forward to a step tab (bypassing `navigateModal()`'s condition guard) without satisfying the current step's condition. This makes conditions appear to apply to total selections across all steps rather than per-step.

### Additional: Duplicate `isStepAccessible` definitions in full-page widget
Two definitions of `isStepAccessible` existed (lines 1929 and 2956). The second overwrites the first at runtime. Consolidated to a single definition for maintainability.

## Progress Log

### 2026-02-24 14:00 - Implemented Fixes

**Full-page widget (`app/assets/bundle-widget-full-page.js`):**
- Added null-guard in `updateModalNavigation()`: returns early when modal buttons don't exist, allowing `renderFullPageFooter()` to execute
- Added null-guard in `renderModalTabs()`: returns early when modal tabs container doesn't exist
- Added guard in `updateModalFooterMessaging()`: skips when modal is hidden
- Added forward-navigation guard in `createStepTimeline()` tab click handler: re-checks `isStepAccessible()` live and blocks forward jumps if current step condition not met
- Removed duplicate `isStepAccessible()` definition (kept the one near `validateStep()`)

**Product-page widget (`app/assets/bundle-widget-product-page.js`):**
- Fixed tab click handler in `renderModalTabs()`: replaced stale closure `isAccessible` check with live `this.isStepAccessible(index)` call
- Added forward-navigation guard: blocks tab clicks to later steps if `this.validateStep(this.currentStepIndex)` fails
- Added null-guard in `updateModalNavigation()` for defensive safety

**Both widgets rebuilt:** `npm run build:widgets`

Files modified:
- `app/assets/bundle-widget-full-page.js`
- `app/assets/bundle-widget-product-page.js`
- `extensions/bundle-builder/assets/bundle-widget-full-page-bundled.js`
- `extensions/bundle-builder/assets/bundle-widget-product-page-bundled.js`

## Phases Checklist
- [x] Phase 1: Investigate root causes in both widgets
- [x] Phase 2: Fix full-page widget — null-guards for modal methods + tab navigation guard
- [x] Phase 3: Fix product-page widget — live accessibility check + forward-navigation guard
- [x] Phase 4: Remove duplicate method definitions
- [x] Phase 5: Build widgets and lint
