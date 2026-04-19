# Issue: PDP Empty State Card Default Background — Transparent

**Issue ID:** pdp-empty-state-transparent-bg-1
**Status:** Completed
**Priority:** 🟢 Low
**Created:** 2026-04-10
**Last Updated:** 2026-04-10 19:20

## Overview

The PDP widget empty state card background defaulted to `#FFFFFF` (white), making the cards
visually stand out against merchants' store themes. Changed the default to `transparent` so
the cards blend naturally with any theme background. Merchants can still override via the
DCP Widget Style → Empty State Cards → Card Background setting.

## Phases Checklist

- [x] Phase 1: Change `PRODUCT_PAGE_DEFAULTS.emptyStateCardBgColor` to `"transparent"` ✅

## Progress Log

### 2026-04-10 19:20 - Phase 1 Completed
- ✅ `app/components/design-control-panel/config/defaultSettings.ts` (line 139): `"#FFFFFF"` → `"transparent"` in `PRODUCT_PAGE_DEFAULTS`
- CSS generator fallback (`css-variables-generator.ts`) left as `#FFFFFF` — only fires for null/undefined, not for explicit values; FPB default (`#F9FAFB`) remains unaffected
- Commit: (pending)
