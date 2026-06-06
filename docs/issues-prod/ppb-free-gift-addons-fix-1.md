# Issue: PPB Free Gift & Add Ons Section Not Rendering

**Issue ID:** ppb-free-gift-addons-fix-1
**Status:** Completed
**Priority:** 🔴 High
**Created:** 2026-05-18
**Last Updated:** 2026-05-18 19:15

## Overview

Clicking "Free Gift & Add Ons" in the PPB configure left sub-nav shows nothing — the main column goes blank. Root cause: the IIFE rendering the section does `if (!step) return null` when `stepsState.steps` is empty (bundle has no steps yet). No empty state was shown to guide the user.

## Progress Log

### 2026-05-18 19:15 - Completed
- Root cause: `if (!step) return null` at line 2953 — bundle has no steps yet, IIFE silently returns null
- Fix: replaced null return with an inline empty-state card: "Add at least one step in Step Setup to configure Free Gift & Add Ons settings."
- ESLint: 0 errors, 528 pre-existing warnings

## Files Changed
- Modified: `app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/route.tsx`

## Phases Checklist
- [x] Replace null return with empty state card
- [x] ESLint clean
- [x] Commit
