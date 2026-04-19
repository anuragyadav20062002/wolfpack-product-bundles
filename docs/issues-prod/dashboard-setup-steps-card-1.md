# Issue: Replace Cart Lines Property Fix Card with Bundle Setup Steps Card

**Issue ID:** dashboard-setup-steps-card-1
**Status:** In Progress
**Priority:** 🟡 Medium
**Created:** 2026-04-09
**Last Updated:** 2026-04-09 09:00

## Overview
The dashboard screen currently shows a "Cart Lines Property Fix" card. This needs to be replaced
with a "Bundle Setup Steps" card that guides merchants through the bundle setup process.

## Progress Log

### 2026-04-09 09:00 - Starting Phase 1
- Investigating current dashboard layout and cart property fix card
- Identifying files to modify

## Phases Checklist
- [x] Phase 1: Locate and understand current cart lines property fix card
- [x] Phase 2: Replace with BundleSetupInstructions (bundlesExist=true) ✅
- [x] Phase 3: Remove CartPropertyFixContent import, verify no new lint errors ✅
- [x] Phase 4: Verified via Chrome DevTools — all 6 steps show green ✅
