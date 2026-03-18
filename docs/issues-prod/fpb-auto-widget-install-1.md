# Issue: FPB Auto Widget Install + Floating Footer Fix

**Issue ID:** fpb-auto-widget-install-1
**Status:** Completed
**Priority:** 🔴 High
**Created:** 2026-03-18
**Last Updated:** 2026-03-18 01:00

## Overview

Two changes:
1. Automate the FPB "Add to storefront" flow — programmatically install the widget via Theme API instead of opening the Theme Editor
2. Fix the floating footer to be an actual floating card (matching reference design) instead of a full-width sticky bar

## Phases Checklist

- [x] Phase 1: Auto widget install API route + route.tsx ✅
- [x] Phase 2: Floating footer card CSS/JS + rename beco → floating-card ✅

## Progress Log

### 2026-03-18 01:00 - All Phases Completed

**Phase 1 — Auto Install:**
- ✅ `app/routes/api/api.install-fpb-widget.tsx` — new POST route calling `ensureBundlePageTemplate`
- ✅ `route.tsx handlePageSelection` — rewritten: FPB pages call auto-install API (no theme editor), product templates keep existing flow
- ✅ Modal title: "Place Widget" → "Add to Storefront"; subtitle updated to "no Theme Editor needed"
- ✅ Select button shows loading/disabled state with "Installing…" text during API call
- ✅ Graceful fallback: on API error, opens theme editor with correct previewPath

**Phase 2 — Floating Footer:**
- ✅ CSS: `.full-page-footer.floating-card` container changed from full-width flush sticky to `bottom:24px; left:50%; transform:translateX(-50%); max-width:800px; border-radius:16px; overflow:hidden; box-shadow`
- ✅ CSS: Panel simplified (no border-radius/shadow — card handles it); bar simplified (no border-top/shadow)
- ✅ CSS: Backdrop z-index -1 → 999 (correct stacking: backdrop below card above page)
- ✅ JS: Callout banner moved from inside panel to top of card (always visible when discount active)
- ✅ JS: `_createBecoPanel` → `_createFooterPanel`; `_createBecoBar` → `_createFooterBar`
- ✅ CSS: All "beco" and "skai-lama" references removed from class names and comments
- ✅ WIDGET_VERSION 1.8.0 → 1.8.1; bundle rebuilt (244.3 KB)
- ✅ Zero ESLint errors

**Files Modified:**
- `app/routes/api/api.install-fpb-widget.tsx` (created)
- `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/route.tsx`
- `app/assets/bundle-widget-full-page.js`
- `extensions/bundle-builder/assets/bundle-widget-full-page.css`
- `extensions/bundle-builder/assets/bundle-widget-full-page-bundled.js` (rebuilt)
- `scripts/build-widget-bundles.js`
- `docs/fpb-auto-widget-install/00-BR.md` (created)
- `docs/fpb-auto-widget-install/02-PO-requirements.md` (created)
- `docs/fpb-auto-widget-install/03-architecture.md` (created)
