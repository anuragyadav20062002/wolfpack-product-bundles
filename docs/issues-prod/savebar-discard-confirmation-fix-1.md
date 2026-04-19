# Issue: SaveBar discardConfirmation invalid prop

**Issue ID:** savebar-discard-confirmation-fix-1
**Status:** Completed
**Priority:** 🟡 Medium
**Created:** 2026-04-01
**Last Updated:** 2026-04-01

## Overview
Both PDP and FPB configure routes pass `discardConfirmation={true}` to the App Bridge
`<SaveBar>` web component. This is not a valid prop and causes a console error:
`Unexpected value for attribute "discardconfirmation" on <ui-save-bar>`.

The error fires twice per page load (once per `SaveBar` instance in each route).

## Progress Log

### 2026-04-01 - Identified root cause
- Diagnosed via Chrome DevTools console: `Unexpected value for attribute "discardconfirmation"`
- Found in two files:
  - `app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/route.tsx:1301`
  - `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/route.tsx:1354`
- `discardConfirmation` is not a valid attribute on the `<ui-save-bar>` web component
- Fix: remove the invalid prop from both `<SaveBar>` usages

## Files Changed
- `app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/route.tsx`
- `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/route.tsx`

## Phases Checklist
- [x] Identify root cause
- [x] Remove invalid prop from PDP configure route
- [x] Remove invalid prop from FPB configure route
- [x] Verify no console errors remain (0 ESLint errors)
