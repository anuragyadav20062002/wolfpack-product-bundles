# Issue: Dashboard Account Manager Update & Uninstall/Step Fixes

**Issue ID:** dashboard-and-uninstall-fixes-1
**Status:** Completed
**Priority:** 🔴 High
**Created:** 2026-01-17
**Last Updated:** 2026-01-17 10:30

## Overview
Three-part fix:
1. Update "Your Account Manager" section: Replace Shrey with Parth
2. Implement complete bundle data deletion on app uninstall
3. Fix step product selection restriction when no conditions/rules are added

## Progress Log

### 2026-01-17 10:00 - Starting Implementation
- What I'm about to implement:
  - Task 1: Replace "Shrey" with "Parth" in account manager section (name + image)
  - Task 2: Add complete data cleanup on app uninstall (Shop, Subscription, DesignSettings, etc.)
  - Task 3: Fix `isStepCompleted` function to not enforce minQuantity when no conditions are set
- Files I'll modify:
  - `app/routes/app.dashboard.tsx` - Account manager update
  - `app/routes/webhooks.app.uninstalled.tsx` - Uninstall cleanup
  - `app/assets/bundle-widget-full-page.js` - Step restriction fix
  - `extensions/bundle-builder/assets/bundle-widget-*-bundled.js` - Rebuilt bundles
- Expected outcome:
  - Parth displayed as account manager
  - All app data deleted on uninstall
  - Customers can select multiple products on steps without conditions

### 2026-01-17 10:30 - Completed Implementation
- **Task 1: Account Manager Update** - DONE
  - Changed image from `/shrey_pfp.jpg` to `/Parth.jpeg`
  - Changed name from "Shrey" to "Parth"
  - Changed button text from "Chat Directly with Shrey" to "Chat Directly with Parth"
  - File modified: `app/routes/app.dashboard.tsx` (lines 1155, 1156, 1177, 1220)

- **Task 2: Uninstall Data Cleanup** - DONE
  - Added deletion for DesignSettings (Step 6)
  - Added deletion for QueuedJob (Step 6)
  - Added deletion for ComplianceRecord (Step 6)
  - Added deletion for WebhookEvent (Step 6)
  - Added deletion for Shop record (Step 7 - cascades to Subscriptions)
  - Removed "mark as uninstalled" logic since we now delete the record
  - File modified: `app/routes/webhooks.app.uninstalled.tsx`

- **Task 3: Step Selection Restriction Fix** - DONE
  - Updated `isStepCompleted()` function to check if conditions are set
  - When no conditions (conditionType, conditionOperator, conditionValue are null), only requires `totalQuantity > 0`
  - This allows customers to select any number of products when no restrictions are defined
  - File modified: `app/assets/bundle-widget-full-page.js` (lines 1437-1440)

- **Widget Bundles Rebuilt** - DONE
  - Ran `npm run build:widgets`
  - Full-page bundle: 160.2 KB
  - Product-page bundle: 114.6 KB

## Files Modified
1. `app/routes/app.dashboard.tsx` - Account manager name, image, and button text
2. `app/routes/webhooks.app.uninstalled.tsx` - Complete data cleanup on uninstall
3. `app/assets/bundle-widget-full-page.js` - isStepCompleted() fix
4. `extensions/bundle-builder/assets/bundle-widget-full-page-bundled.js` - Rebuilt
5. `extensions/bundle-builder/assets/bundle-widget-product-page-bundled.js` - Rebuilt

## Technical Analysis

### Task 1: Account Manager Update
- File: `app/routes/app.dashboard.tsx`
- Lines 1155-1178: Replace "Shrey" references with "Parth"
- Image: Change from `/shrey_pfp.jpg` to `/Parth.jpeg`

### Task 2: Uninstall Data Cleanup
Current webhook now deletes ALL shop data:
- Bundles (cascades to steps, pricing, analytics)
- Sessions
- DesignSettings
- QueuedJob
- ComplianceRecord
- WebhookEvent
- Shop record (cascades to Subscriptions)

### Task 3: Step Selection Restriction
**Root Cause:** `isStepCompleted()` in full-page widget used `step.minQuantity || 1` regardless of whether conditions are set.

**Fix:** Updated `isStepCompleted()` to check if conditions are set first:
```javascript
// If no conditions are set, any selection is valid (just need at least 1 product)
if (!step.conditionType || !step.conditionOperator || step.conditionValue === null) {
  return totalQuantity > 0;
}
// Otherwise use minQuantity for step completion
return totalQuantity >= (step.minQuantity || 1);
```

## Related Documentation
- CLAUDE.md - Build process for widgets
- prisma/schema.prisma - Database models

## Phases Checklist
- [x] Phase 1: Update account manager (Shrey -> Parth)
- [x] Phase 2: Implement complete uninstall cleanup
- [x] Phase 3: Fix step product selection restriction
- [x] Phase 4: Rebuild widget bundles
- [x] Phase 5: Test and verify
