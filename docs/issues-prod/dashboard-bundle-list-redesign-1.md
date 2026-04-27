# Issue: Dashboard Bundle List Redesign (EB Parity)

**Issue ID:** dashboard-bundle-list-redesign-1
**Status:** In Progress
**Priority:** 🟡 Medium
**Created:** 2026-04-27
**Last Updated:** 2026-04-27 12:00

## Overview

Redesign the dashboard bundle list to match EB's cleaner table layout:
- Bundle type + Status filter dropdowns on the left of the toolbar
- Search hidden behind a magnifying glass icon (revealed on click)
- Pagination at the bottom (Page X of Y, prev/next, bundles per page selector)
- Clean action buttons: Edit (pencil), Preview (eye), More (...) per row

## Related Documentation
- Screenshot provided by user (EB reference)

## Phases Checklist

- [x] Phase 1 — Add filter + search toolbar (type, status, search toggle)
- [x] Phase 2 — Implement client-side filtering (type, status, search term)
- [x] Phase 3 — Add pagination (page X of Y, prev/next, per-page selector)
- [x] Phase 4 — Redesign action buttons column (Edit | Preview | More popover)
- [ ] Phase 5 — Test locally (requires interactive dev server)

## Progress Log

### 2026-04-27 00:00 - Starting implementation
- Issue file created
- Reading current dashboard bundle list structure

### 2026-04-27 12:00 - Implemented all phases (1–4)
- Replaced always-visible TextField search with magnifying glass icon toggle
- Added Bundle type + Status filter dropdowns (client-side, left of toolbar)
- Added pagination: Page X of Y, prev/next buttons, bundles-per-page selector (10/20/50)
- Refactored BundleActionsButtons: Edit (pencil) | Preview (eye) | More (...) popover
- More popover contains Clone and Delete (destructive) as ActionList items
- filteredBundles → pagedBundles pipeline: type filter → status filter → search filter → slice
- Page resets to 1 when any filter or search changes
- effectivePage = min(currentPage, totalPages) prevents out-of-range page state
- Files changed: app/routes/app/app.dashboard/route.tsx, types.ts
- Zero TypeScript errors, zero ESLint errors on modified files
- Next: Deploy to SIT for visual verification
