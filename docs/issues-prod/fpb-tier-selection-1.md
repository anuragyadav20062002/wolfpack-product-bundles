# Issue: Beco-Style Pricing Tier Selection for Full-Page Bundle Widget

**Issue ID:** fpb-tier-selection-1
**Status:** In Progress
**Priority:** 🟡 Medium
**Created:** 2026-03-17
**Last Updated:** 2026-03-17 23:59

## Overview

Add a tier pill selector to the full-page bundle widget so merchants can surface 2–4 pricing
tiers (each backed by an existing Bundle record) on a single bundle page. Follows the Beco
BYOB reference design.

## Related Documentation
- docs/fpb-tier-selection/00-BR.md
- docs/fpb-tier-selection/02-PO-requirements.md
- docs/fpb-tier-selection/03-architecture.md
- docs/fpb-tier-selection/04-SDE-implementation.md

## Phases Checklist

- [x] Phase 1: Tests for pure helpers ✅
- [x] Phase 2: Liquid block settings ✅
- [x] Phase 3: Widget JS (parseTierConfig, initTierPills, switchTier) ✅
- [x] Phase 4: Widget CSS ✅
- [x] Phase 5: Build, lint, commit ✅

## Progress Log

### 2026-03-17 23:59 - All Phases Completed

**Tests:** 16/16 pass (`tests/unit/assets/fpb-tier-selection.test.ts`)
**Build:** `npm run build:widgets` success (full-page: 227.2 KB, product-page: 139.8 KB)
**ESLint:** 0 errors

#### Phase 1 — Tests ✅
- `tests/unit/assets/fpb-tier-selection.test.ts` (16 tests, all pass)
- Covers: `parseTierConfig` (11), `isTierActive` (4), `buildTierPillsAriaLabel` (1)

#### Phase 2 — Liquid Block ✅
- `extensions/bundle-builder/blocks/bundle-full-page.liquid`
  - 8 new schema settings: `tier_N_label` + `tier_N_bundle_id` (N=1–4)
  - Liquid loop builds JSON array → emitted as `data-tier-config` attribute on widget div

#### Phase 3 — Widget JS ✅
- `app/assets/bundle-widget-full-page.js`
  - `parseTierConfig()` — pure helper, validates + filters + slices to max 4
  - `isTierActive()` — pure comparison helper
  - `initTierPills()` — inserts pill bar as first child of container (no-op if < 2 tiers)
  - `switchTier()` — resets state, fetches new bundle, re-renders, updates pill active states
  - `updatePillActiveStates()` — syncs aria-pressed + CSS class
  - `attachEventListeners()` — click + keydown (Enter/Space) delegation on pill bar
  - `parseConfiguration()` — reads `dataset.tierConfig` into `this.tierConfig`
  - `init()` — calls `initTierPills(this.tierConfig)` before loading overlay

#### Phase 4 — CSS ✅
- `extensions/bundle-builder/assets/bundle-widget-full-page.css`
  - `.bundle-tier-pill-bar`, `.bundle-tier-pill`, `--active`, `--disabled`, `--loading`
  - Mobile: `overflow-x: auto; flex: 0 0 auto` (horizontal scroll)
  - Active pill color uses `--bundle-global-primary-button` fallback for DCP integration

#### Key achievements:
- ✅ Zero schema changes — uses existing Bundle records as tiers
- ✅ Backward compatible — pill bar hidden when < 2 tiers configured
- ✅ Accessible — `role=group`, `aria-pressed`, keyboard (Enter/Space) support
- ✅ Active pill defaults to `--bundle-global-primary-button` (DCP-aware)

**Status:** Ready for deploy
