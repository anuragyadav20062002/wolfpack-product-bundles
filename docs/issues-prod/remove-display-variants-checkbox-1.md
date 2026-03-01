# Issue: Remove "Display variants as individual products" checkbox

**Issue ID:** remove-display-variants-checkbox-1
**Status:** Completed
**Priority:** 🟢 Low
**Created:** 2026-02-24
**Last Updated:** 2026-02-24 18:30

## Overview
Remove the "Display variants as individual products" checkbox from the admin UI for both full-page and product-page bundle configuration routes.

## Progress Log

### 2026-02-24 18:30 - Removed checkbox from both configure routes
- ✅ Removed Checkbox component from full-page bundle configure route
- ✅ Removed Checkbox component from product-page bundle configure route
- Files modified:
  - `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/route.tsx`
  - `app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/route.tsx`
- Lint: 0 errors

## Phases Checklist
- [x] Remove checkbox from full-page configure route
- [x] Remove checkbox from product-page configure route
- [x] Lint check
- [x] Commit
