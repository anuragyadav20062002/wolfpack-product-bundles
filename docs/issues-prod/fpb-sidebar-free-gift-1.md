# Issue: FPB Sidebar Panel Redesign + Free Gift + Default Product

**Issue ID:** fpb-sidebar-free-gift-1
**Status:** In Progress
**Priority:** 🔴 High
**Created:** 2026-03-17
**Last Updated:** 2026-03-17 18:30

## Overview
Revamp the full-page bundle widget sidebar panel to match Skai Lama's design quality. Implements:
1. Free gift step support (locked/unlocked sidebar states, "Free" badge on cards, $0.00 price)
2. Mandatory default product step (auto-selected on load, no remove button)
3. Skeleton empty slots in sidebar
4. Mobile sticky bottom bar + bottom sheet
5. Free gift step heading + product card "Free" badge

Full spec: `docs/fpb-sidebar-free-gift/` (BR, PO, Architecture, SDE plan)
Competitive analysis: `docs/skai-lama-analysis/fpb-sidebar-panel-analysis.md`

## Progress Log

### 2026-03-17 17:02 - Starting Phase 1: DB Schema + API
- Adding isFreeGift, freeGiftName, isDefault, defaultVariantId to BundleStep
- Writing tests first (TDD)
- Files to modify: prisma/schema.prisma, app/services/bundles/metafield-sync/types.ts, app/routes/api/api.bundle.$bundleId[.]json.tsx

### 2026-03-17 18:30 - Completed Phases 1–5
- ✅ Phase 1: Prisma schema + migration + API step fields (10 tests pass)
- ✅ Phase 2: Widget JS free gift unlock logic + default product init (33 tests pass)
  - Added getters: freeGiftStep, freeGiftStepIndex, paidSteps, isFreeGiftUnlocked
  - Added: canNavigateToStep, _getFreeGiftRemainingCount, _initDefaultProducts, _syncFreeGiftLock
  - Updated: areBundleConditionsMet (skip free gift steps), isStepAccessible, updateProductSelection
  - Updated: getAllSelectedProductsData (pass isDefault + isFreeGift through to sidebar items)
- ✅ Phase 3: CSS — free gift section, skeleton slots, free badge, step heading, mobile bar/sheet
  - File size: 93,876 B (under 100,000 B limit)
- ✅ Phase 4: Widget JS rendering — sidebar free gift section, skeleton slots, $0.00 price,
  free badge on cards, step heading, Next button lock guard with toast
- ✅ Phase 5: Mobile bottom bar + backdrop + slide-up bottom sheet
- All 590 tests pass, zero lint errors
- Widget version bumped 1.7.1 → 1.8.0
- Files modified: app/assets/bundle-widget-full-page.js, extensions/bundle-builder/assets/bundle-widget-full-page.css, scripts/build-widget-bundles.js

## Phases Checklist
- [x] Phase 1: DB schema migration + API return new fields
- [x] Phase 2: Widget JS — free gift unlock logic + default product init
- [x] Phase 3: Widget CSS — new component styles
- [x] Phase 4: Widget JS — sidebar + product card rendering
- [x] Phase 5: Mobile bottom bar

## Related Documentation
- `docs/fpb-sidebar-free-gift/00-BR.md`
- `docs/fpb-sidebar-free-gift/02-PO-requirements.md`
- `docs/fpb-sidebar-free-gift/03-architecture.md`
- `docs/fpb-sidebar-free-gift/04-SDE-implementation.md`
- `docs/skai-lama-analysis/fpb-sidebar-panel-analysis.md`
