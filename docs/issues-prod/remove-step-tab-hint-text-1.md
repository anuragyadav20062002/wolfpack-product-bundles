# Issue: Remove Step Tab Hint Text in Full-Page Widget

**Issue ID:** remove-step-tab-hint-text-1
**Status:** In Progress
**Priority:** 🟡 Medium
**Created:** 2026-02-22
**Last Updated:** 2026-02-22 01:45

## Overview

Remove the "Select N+" / "Choose items" helper hint text shown below the step name in the
full-page widget step timeline tabs. This text (`tab-hint` span) shows "Select 1+" (when
minQuantity is set) or "Choose items" (when no minimum). The merchant wants it removed entirely.

## File changed
- `app/assets/bundle-widget-full-page.js` (source, line ~839)
- `extensions/bundle-builder/assets/bundle-widget-full-page-bundled.js` (rebuilt)

## Phases Checklist
- [x] Phase 1: Create issue file
- [x] Phase 2: Remove tab-hint span from source JS
- [x] Phase 3: Rebuild widget bundle
- [ ] Phase 4: Lint + commit

## Progress Log

### 2026-02-22 01:45 - Starting
- tab-hint span at source line 839: `<span class="tab-hint">${step.minQuantity ? \`Select ${step.minQuantity}+\` : 'Choose items'}</span>`
- Removing the span entirely from createStepTimeline() tab rendering
