# Issue: Full-Page Bundle Sidebar Layout Not Rendering + Admin Illustration

**Issue ID:** footer-sidebar-layout-fix-1
**Status:** Completed
**Priority:** 🔴 High
**Created:** 2026-02-28
**Last Updated:** 2026-02-28 23:30

## Overview
1. "Footer at side" layout option doesn't work — footer still renders at bottom. CSS specificity issue: `.full-page-content-section { width: 100% }` overrides the sidebar flex layout, pushing the side panel off-screen.
2. Admin UI needs visual illustration in the footer position selector to help merchants understand layout options.

## Root Cause
`.full-page-content-section` (line 41-48 of CSS) sets `width: 100%` which overrides the `flex: 1 1 0%` from `.sidebar-layout-wrapper .sidebar-content`. The content element has both classes, and `width: 100%` wins, taking full width and leaving no room for the 360px side panel.

## Fix Plan
1. CSS: Override `width` in `.sidebar-layout-wrapper .sidebar-content` to `auto`
2. Admin UI: Replace plain Select dropdown with visual illustration cards for layout selection

## Progress Log

### 2026-02-28 23:30 - Starting Fix
Files to modify:
- `extensions/bundle-builder/assets/bundle-widget-full-page.css` — fix sidebar width override
- `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/route.tsx` — add layout illustrations

### 2026-02-28 23:45 - Fix Implemented
- CSS: Added `width: auto` to `.sidebar-layout-wrapper .sidebar-content` to override `.full-page-content-section { width: 100% }` that was pushing the side panel off-screen
- Admin UI: Replaced Select dropdown with two clickable visual cards containing SVG illustrations showing the layout difference (footer bar at bottom vs sidebar panel on right)
- Widget bundles rebuilt

Files modified:
- `extensions/bundle-builder/assets/bundle-widget-full-page.css` — CSS fix
- `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/route.tsx` — visual layout selector

## Phases Checklist
- [x] Fix CSS width override for sidebar layout
- [x] Add visual layout illustrations in admin UI
- [x] Build widgets
- [x] Lint modified files
- [ ] Commit
