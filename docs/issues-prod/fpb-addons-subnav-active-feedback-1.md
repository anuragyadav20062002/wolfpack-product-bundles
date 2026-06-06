# Issue: FPB Add-ons Subnav Active Feedback
**Issue ID:** fpb-addons-subnav-active-feedback-1
**Status:** In Progress
**Priority:** 🟡 Medium
**Created:** 2026-06-05
**Last Updated:** 2026-06-05 09:51

## Overview
Add visible active feedback to the `Free Gift & Add Ons` child section nav item so it behaves like the active `Step Setup` parent item with a dark gray background.

## Progress Log
### 2026-06-05 09:51 - Started
- User reported the Free Gift & Add Ons section nav needs click feedback like the gray active background on Step Setup.
- Existing route already applies `subNavItemActive` when `activeSection === child.id`, but CSS only changes color/font weight.
- Next: add focused source guard and update subnav active styling.

## Related Documentation
- `test-spec/fpb-addons-subnav-active-feedback.spec.md`

## Phases Checklist
- [ ] Phase 1: Source guard for active Free Gift & Add Ons child nav feedback
- [ ] Phase 2: CSS update for active child nav background
- [ ] Phase 3: Chrome verification
