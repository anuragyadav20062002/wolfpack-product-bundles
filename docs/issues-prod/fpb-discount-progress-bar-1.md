# Issue: FPB Discount Progress Bar

**Issue ID:** fpb-discount-progress-bar-1
**Status:** Completed
**Priority:** 🟡 Medium
**Created:** 2026-05-11
**Last Updated:** 2026-05-11 12:00

## Overview

Add a visual discount progress bar to the Full-Page Bundle widget for both the floating
(footer_bottom) and sidebar (footer_side) subtypes. The bar shows shoppers how close they
are to the next discount tier, updating in real-time as products are selected.

An admin toggle "Progress bar" is added to the Discount Display Options card in the
Discount & Pricing section of the FPB configure page.

The `showProgressBar` DB column already exists (re-added by migration 20260504194551 with
default true). This issue re-wires the TypeScript types, hook, handler, metafield sync,
and widget JS/CSS. A new migration resets existing rows to false and changes the default.

## Phases Checklist

- [x] Phase 1 — Issue file + failing tests (TDD Red)
- [x] Phase 2 — Prisma schema default false + migration
- [x] Phase 3 — TypeScript types (pricing.ts, state.types.ts, FPB types.ts)
- [x] Phase 4 — Hooks (useBundlePricing, useBundleConfigurationState)
- [x] Phase 5 — Handler (handlers.server.ts Prisma upsert)
- [x] Phase 6 — Metafield sync (BundleUiMessaging + bundle-product.server.ts)
- [x] Phase 7 — route.tsx (toggle UI, hidden input, formData, dep array)
- [x] Phase 8 — Widget JS (_renderDiscountProgress, renderSidePanel, renderFullPageFooter)
- [x] Phase 9 — Widget CSS (new .fpb-dp-* rules, mobile hide rule)
- [x] Phase 10 — Build widgets (bundle-widget-full-page-bundled.js 235.5 KB), lint (0 errors), all 10 tests pass

## Related Documentation

- Requirements: docs/fpb-discount-progress-bar/01-requirements.md
- Architecture: docs/fpb-discount-progress-bar/02-architecture.md
- Previous removal: docs/issues-prod/remove-show-progress-bar-1.md

## Progress Log

### 2026-05-11 12:00 — Implementation complete
- All 10 phases complete end-to-end
- Prisma migration: reset showProgressBar to false, change default to false
- TypeScript types wired: PricingDisplay.showDiscountProgressBar, PricingSettings, BundlePricing
- Hooks: useBundlePricing + useBundleConfigurationState expose showDiscountProgressBar state
- Handler: reads showDiscountProgressBar from form, writes showProgressBar to Prisma
- Metafield sync: BundleUiMessaging.showDiscountProgressBar written to bundle_ui_config
- route.tsx: Discount Display Options card with showFooter + Progress bar checkboxes
- Widget JS: new _renderDiscountProgress() creates fill-bar (.fpb-discount-progress)
  - Floating footer: shown behind config.showDiscountProgressBar flag
  - Sidebar panel: shown behind same flag, with .fpb-dp-sidebar class
  - Old _renderDiscountProgressBanner retained for product-page footer (unchanged)
- Widget CSS: new .fpb-dp-* rules, mobile hide rule for floating footer
- Build: bundle-widget-full-page-bundled.js 235.5 KB, CSS 86.9 KB
- Tests: 10/10 pass (fixed mock argument order + Map return type)

### 2026-05-11 00:00 — Starting implementation
- Feature pipeline stages 1 (requirements) and 2 (architecture) complete
- showProgressBar DB column exists (migration 20260504194551, default true)
- New migration needed to reset existing rows to false + change default
- Files to modify per architecture doc: 11 source files + 2 test files
