# Issue: DCP Audit Fixes — Preview + Default Colors + Section Labels

**Issue ID:** dcp-audit-fixes-1
**Status:** Completed
**Priority:** 🔴 High
**Created:** 2026-03-27
**Last Updated:** 2026-03-27 02:35

## Overview

Fixing issues identified in the DCP audit (`docs/dcp-audit/DCP_AUDIT_FPB_2026-03-27.md`).

Covers:
1. Remove blank space at bottom of FPB sidebar layout preview (`min-height: 100vh` → `unset`)
2. Replace test color `#7132FF` defaults in 5 settings + `#0080ff` card BG
3. Rename "Header Text" subsection → "Conditions & Discount Text"

## Phases Checklist

- [x] Phase 1: Remove `min-height: 100vh` from preview CSS
- [x] Phase 2: Fix default colors (5 utility settings)
- [x] Phase 3: Rename "Header Text" section

## Progress Log

### 2026-03-27 02:35 - Completed all phases
- ✅ Phase 1: `api.preview.$type.tsx` — `.bundle-widget-full-page { min-height: 100vh }` → `min-height: unset`; removes blank space below content in FPB sidebar preview
- ✅ Phase 2: `defaultSettings.ts` — replaced `#7132FF` with `#111111` in 4 utility settings (`addToCartButtonBgColor`, `toastBgColor`, `searchInputFocusBorderColor`, `tileQuantityBadgeBgColor`); replaced with `#000000` in `focusOutlineColor`. Left intentional brand-accent purples (tabs active, footer Next button, step bar, etc.) untouched per comment "vibrant, branded design with purple accents".
- ✅ Phase 3: `fpb.config.ts` — renamed nav label `'Header Text'` → `'Conditions & Discount Text'`; `HeaderTextSettings.tsx` — updated panel heading to match
- Files changed: `app/routes/api/api.preview.$type.tsx`, `app/components/design-control-panel/config/defaultSettings.ts`, `app/lib/dcp-config/fpb.config.ts`, `app/components/design-control-panel/settings/HeaderTextSettings.tsx`
