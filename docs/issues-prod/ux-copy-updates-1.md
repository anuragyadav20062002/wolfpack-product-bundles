# Issue: UX Copy Updates from Piddie Feedback

**Issue ID:** ux-copy-updates-1
**Status:** In Progress
**Priority:** 🟡 Medium
**Created:** 2026-02-23
**Last Updated:** 2026-02-23 00:10

## Overview
Applying UX copy changes based on Piddie feedback document. Updates span the home/onboarding screen and the dashboard — covering headlines, subtitles, CTA button text, account manager section, step instructions, and inventory sync message.

## Progress Log

### 2026-02-23 00:00 - Phase 1: All Copy Changes Started
- ⏳ Applying all text changes from Piddie UX Copy Feedback PDF
- Will modify:
  - `app/routes/app/app._index.tsx`
  - `app/routes/app/app.dashboard/route.tsx`
- Changes:
  1. Home heading: "Welcome to Wolfpack: Product Bundles" → "Welcome to Wolfpack Bundle Builder"
  2. Home subtitle: updated to "Create impactful bundle builders..."
  3. Home CTA button: "Start My Bundling Journey" → "Create My Bundles Now"
  4. Home sub-text: remove "Set up your first bundle in just a few minutes"
  5. Dashboard title: "Welcome to Wolfpack: Product Bundles" → "Dashboard: Wolfpack Bundle Builder"
  6. Dashboard subtitle: "Upgrade your store..." → "Access your bundles, customer support & more."
  7. Step 3 title: 'Click "Create Bundle" in the popup' → 'Click "Bundle Settings"'
  8. Step 3 description: updated to "This will take you to your bundle set up page."
  9. Account manager header: "Your Account Manager" → "Need Help? Speak to Parth!"
  10. Account manager button: "Chat Directly with Parth" → "Chat with Parth"
  11. Inventory sync message: updated to "Bundles appear as separate products but your inventory syncs automatically..."

### 2026-02-23 00:10 - Phase 1: All Copy Changes Completed
- ✅ Files Modified:
  - `app/routes/app/app._index.tsx` (lines 130-151)
  - `app/routes/app/app.dashboard/route.tsx` (lines 533-534, 621-624, 672-673, 737-738, 752-753)
- ✅ Home heading updated
- ✅ Home subtitle updated
- ✅ Home CTA button text updated
- ✅ Home sub-text removed
- ✅ Dashboard title updated
- ✅ Dashboard subtitle updated
- ✅ Step 3 title + description updated
- ✅ Account manager header updated
- ✅ Account manager button text updated
- ✅ Inventory sync message updated
- Result: All UX copy changes from Piddie feedback applied
- Next: Commit

## Phases Checklist
- [x] Phase 1: Apply all copy changes ✅ Completed
