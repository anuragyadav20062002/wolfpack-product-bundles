# Issue: Clear button resets step timeline to first step
**Issue ID:** clear-step-timeline-reset-1
**Status:** Completed (awaiting deploy)
**Priority:** 🟡 Medium
**Created:** 2026-06-07
**Last Updated:** 2026-06-07 23:40

## Overview

The FPB widget has two "Clear" buttons that today empty `selectedProducts` only and leave `currentStepIndex` where it was. A customer can sit on step 3 (which only became reachable because of selections on step 2) with no upstream products, then add products from step 3 — bypassing the step-unlock invariant the bundle was configured with.

Fix: when either Clear handler fires, also reset `currentStepIndex = 0` and clear the search/collection filters (`searchQuery`, `activeCollectionId`). The existing `isStepAccessible(index)` check on the next render will re-lock steps 2+, so the customer can't click into them until the step-1 selection is made again.

PPB widget has no global Clear — only per-step `step-clear-badge` icons (`clearStepSelections(stepIndex)`). Those are scoped to a single step and don't violate the step-lock invariant, so no PPB change required.

## Progress Log

### 2026-06-07 23:35 - Scope confirmed
- Two handlers to edit in `app/assets/bundle-widget-full-page.js`:
  - Mobile summary tray clear (~L1576–1580)
  - Side-panel clear (~L1827–1830)
- Reset pattern mirrors the timeline-step click handler at L2606–2609 — same three-line state-reset before `reRenderFullPage()`.
- PPB widget verified: no global Clear button; per-step clear badges + `clearStepSelections` left untouched.
- Plan: edit handlers, `node --check`, bump `WIDGET_VERSION` patch, `npm run build:widgets`, prompt user for deploy.

## Related Documentation
- Widget: `app/assets/bundle-widget-full-page.js`
- Step-unlock logic: `isStepAccessible()` + `canProceedToNextStep()` in same file
- Build process: CLAUDE.md "Widget Bundle Build Process"

### 2026-06-07 23:40 - Implementation shipped
- Both clear handlers in `app/assets/bundle-widget-full-page.js` now reset `currentStepIndex = 0`, `searchQuery = ''`, `activeCollectionId = null` after emptying `selectedProducts`.
- Bumped `WIDGET_VERSION` from 3.0.22 → 3.0.23 (PATCH — bug-fix). `npm run build:widgets` regenerated both bundles + the SDK header.
- `node --check` syntax pass: clean.
- Lint pass: 0 errors. Pre-existing warnings untouched.

## Phases Checklist
- [x] Edit mobile clear handler
- [x] Edit side-panel clear handler
- [x] Bump `WIDGET_VERSION` (PATCH)
- [x] `node --check` syntax pass
- [x] `npm run build:widgets`
- [x] Lint, commit
- [ ] **User action: SIT deploy** — see ACTION REQUIRED note in commit message
