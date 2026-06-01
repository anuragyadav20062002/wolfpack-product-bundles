# Issue: Clickable Step Timeline in Bundle Creation Wizard
**Issue ID:** wizard-clickable-steps-1
**Status:** Completed
**Priority:** 🟢 Low
**Created:** 2026-06-01
**Last Updated:** 2026-06-01 01:30

## Overview
Make the step indicators in the bundle creation wizard timeline clickable so merchants can jump back to previously completed steps without using the Back button.

## Progress Log
### 2026-06-01 01:30 - Implemented
- Added `.stepItemClickable` CSS class (button reset + cursor:pointer + hover opacity)
- Changed done step items (idx >= 1 && idx < wizardStep) from plain divs to `<button>` elements
- Clicking calls `setWizardStep(idx)` to navigate directly to that step
- Step 01 "Bundle name & Description" (idx=0) is intentionally non-clickable — it lives in the separate create route
- Future steps remain non-clickable (unsaved, not yet reached)

## Phases Checklist
- [x] Add CSS class for clickable step item
- [x] Update JSX to render done steps as clickable buttons
