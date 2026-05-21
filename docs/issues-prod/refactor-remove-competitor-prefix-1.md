# Issue: Remove Competitor Prefixes from Codebase

**Issue ID:** refactor-remove-competitor-prefix-1
**Status:** Completed
**Priority:** 🟡 Medium
**Created:** 2026-05-20
**Last Updated:** 2026-05-20 14:15

## Overview

Remove all competitor brand references from source code. References are allowed in documentation files but must not appear in code (CSS class names, JS/TS identifiers, Liquid variables, comments).

Competitors in scope: `eb` (Easy Bundles), `skai`, `skailama`, `easybundles`.

## Progress Log

### 2026-05-20 14:15 - Renamed all eb-prefixed CSS class names

- Scanned all `.tsx`, `.ts`, `.css`, `.js`, `.liquid` files under `app/` and `extensions/`
- Found 20 `eb`-prefixed CSS class names across 4 files — no `skai`/`skailama`/`easybundles` occurrences
- Renamed via perl one-liner (replace_all):
  - `ebCategoryActions` → `categoryActions`
  - `ebCategoryDrag` → `categoryDrag`
  - `ebCategoryItem` → `categoryItem`
  - `ebCategoryList` → `categoryList`
  - `ebCategoryName` → `categoryName`
  - `ebLinkButton` → `linkButton`
  - `ebMediaFieldGrid` → `mediaFieldGrid`
  - `ebMessageNote` → `messageNote`
  - `ebMessagePreview` → `messagePreview`
  - `ebMessagePreviewIcon` → `messagePreviewIcon`
  - `ebMessagePreviewTitle` → `messagePreviewTitle`
  - `ebPanelDescription` → `panelDescription`
  - `ebPanelHeader` → `panelHeader`
  - `ebPanelTitle` → `panelTitle`
  - `ebRuleCard` → `ruleCard`
  - `ebRuleFields` → `ruleFields`
  - `ebRuleHeader` → `ruleHeader`
  - `ebSubNav` → `subNav`
  - `ebSubNavItem` → `subNavItem`
  - `ebSubNavItemActive` → `subNavItemActive`
- ESLint: 0 errors on modified files
- Added rule to CLAUDE.md prohibiting competitor references in code

## Files Changed

- `app/styles/routes/full-page-bundle-configure.module.css`
- `app/styles/routes/product-page-bundle-configure.module.css`
- `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/route.tsx`
- `app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/route.tsx`
- `CLAUDE.md`

## Phases Checklist

- [x] Scan for all competitor prefixes in code files
- [x] Rename eb-prefixed CSS class names and JS identifiers
- [x] Verify no remaining occurrences
- [x] ESLint 0 errors
- [x] Update CLAUDE.md with the no-competitor-reference rule
