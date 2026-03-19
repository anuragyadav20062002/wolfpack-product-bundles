# Issue: FPB Theme Editor Opens Wrong Preview Page

**Issue ID:** fpb-theme-editor-wrong-preview-page-1
**Status:** Completed
**Priority:** 🔴 High
**Created:** 2026-03-18
**Last Updated:** 2026-03-18 00:00

## Overview

When a merchant clicks "Place Widget Now" on the FPB configure page and selects their bundle page,
the theme editor opens with the `page.full-page-bundle` template but previews the wrong page
(whatever the store's default page happens to use that template suffix), instead of the
bundle's actual page. This causes "Bundle not found" / 404 errors in the widget preview.

## Root Cause

`handlePageSelection` in `route.tsx` builds the theme editor deep link with `template=page.full-page-bundle`
but omits the `previewPath` query parameter. Without `previewPath`, Shopify's theme editor defaults
to the first page it finds with that template suffix — not the bundle's page.

Fix: append `&previewPath=/pages/${template.handle}` to `themeEditorUrl` when `template.isPage` is true.

## Phases Checklist

- [ ] Phase 1: Fix theme editor deep link previewPath ✅

## Progress Log

### 2026-03-18 00:05 - Phase 1 Completed
- ✅ `route.tsx` — computed `previewPath = encodeURIComponent(/pages/${template.handle})` when `template.isPage`
- ✅ Appended `&previewPath=${previewPath}` to `themeEditorUrl`
- ✅ Zero ESLint errors

**Files Modified:**
- `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/route.tsx`
