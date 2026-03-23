# Issue: Widget Audit Bug Fixes — Currency, Full-Bleed CSS, Dimmed Cards

**Issue ID:** widget-audit-bugs-fix-1
**Status:** Completed
**Priority:** 🔴 High
**Created:** 2026-03-21
**Last Updated:** 2026-03-24 00:00

## Overview

Four bugs found during a live-store audit of the PDP and FPB widgets across mobile/desktop and
multi-currency stores. Fixing three confirmed bugs (Bug 4 ruled out as false positive — CSS already
correct at 390px).

## Bugs

### Bug 1 — Currency: GBP prices shown with INR symbol (Critical)
`window.Shopify.currency.format` is not present in standard Shopify Markets. The fallback
`window.shopMoneyFormat` is the shop's base format (e.g. `₹{{amount}}`). When a UK customer
views an INR store, product prices are formatted with `₹` symbol and no exchange rate is applied.

**Fix:** Add `CurrencyManager.convertAndFormat(amount, currencyInfo)` helper that applies rate
conversion before `formatMoney`, and use the display currency symbol for the format string when
`Shopify.currency.format` is absent. Replace all `formatMoney(X, currencyInfo.display.format)`
call sites in both widgets with `convertAndFormat(X, currencyInfo)`.

### Bug 2 — FPB full-bleed CSS clips cards on left-aligned app blocks (High)
`.bundle-widget-full-page { width: 100vw !important; margin-left: calc(-50vw + 50%) !important; }`
assumes the widget container is horizontally centered. On non-centered app block placements,
the negative margin shifts the widget off-screen to the left.

**Fix:** Remove the forced `width: 100vw` and `margin-left: calc(-50vw + 50%)` rules. The widget
fills its container naturally via `width: 100%` (retained).

### Bug 3 — FPB dimmed cards not refreshed after real-time selection (Medium)
`updateProductQuantityDisplay` handles real-time card updates (quantity controls, selected overlay)
but never refreshes `.dimmed` state on sibling cards. `createFullPageProductGrid` applies dimming
on full re-render only. After a user selects a product that fills the step quota, other cards remain
un-dimmed until the next full re-render (e.g. tab switch).

**Fix:** Add `_refreshSiblingDimState(stepIndex)` method that rechecks capacity via
`ConditionValidator.canUpdateQuantity` and toggles `.dimmed` on all cards for the step. Call
it at the end of `updateProductQuantityDisplay`.

### Bug 4 — PDP mobile 4-column grid (Low) — RULED OUT
CSS already has `grid-template-columns: repeat(2, 1fr)` at `max-width: 480px` for
`.modal-body .product-grid` and at `max-width: 767px` for `.bw-bs-product-grid`. At 390px both
rules apply and 2 columns is the result. No change needed.

## Files to Modify

- `app/assets/widgets/shared/currency-manager.js`
- `app/assets/bundle-widget-product-page.js`
- `app/assets/bundle-widget-full-page.js`
- `extensions/bundle-builder/assets/bundle-widget-full-page.css`
- `extensions/bundle-builder/assets/bundle-widget-product-page-bundled.js` (build output)
- `extensions/bundle-builder/assets/bundle-widget-full-page-bundled.js` (build output)

## Progress Log

### 2026-03-24 - Implemented all fixes

- Bug 1: Added `CurrencyManager.convertAndFormat(amount, currencyInfo)` — applies rate conversion
  before `formatMoney` and uses display-currency symbol format when `Shopify.currency.format` absent.
  Replaced all 16 call sites across both widgets (PDP: 7, FPB: 9).
- Bug 2: Removed `width: 100vw !important` and `margin-left: calc(-50vw + 50%) !important` from
  `.bundle-widget-full-page` in `bundle-widget-full-page.css`. Widget now fills container via
  `width: 100%` and `box-sizing: border-box`.
- Bug 3: Added `_refreshSiblingDimState(stepIndex)` method to FPB widget. Calls
  `ConditionValidator.canUpdateQuantity` to check step capacity and toggles `.dimmed` on all
  product cards in the current grid. Wired into end of `updateProductQuantityDisplay`.
- Bug 4 (ruled out): CSS at `max-width: 480px` already shows `repeat(2, 1fr)` — no change needed.
- Bumped WIDGET_VERSION: 2.3.1 → 2.3.2
- Built both bundles: FPB 249.5 KB, PDP 151.8 KB. CSS within 100KB limit (96 KB).

Files changed:
- `app/assets/widgets/shared/currency-manager.js`
- `app/assets/bundle-widget-product-page.js`
- `app/assets/bundle-widget-full-page.js`
- `extensions/bundle-builder/assets/bundle-widget-full-page.css`
- `extensions/bundle-builder/assets/bundle-widget-full-page-bundled.js`
- `extensions/bundle-builder/assets/bundle-widget-product-page-bundled.js`
- `scripts/build-widget-bundles.js`

## Phases Checklist
- [x] Bug 1: Add `convertAndFormat` to CurrencyManager + fix display.format
- [x] Bug 1: Update all formatMoney call sites in PDP widget
- [x] Bug 1: Update all formatMoney call sites in FPB widget
- [x] Bug 2: Remove forced full-bleed CSS from bundle-widget-full-page.css
- [x] Bug 3: Add `_refreshSiblingDimState` + wire into `updateProductQuantityDisplay`
- [x] Build both widget bundles
- [ ] Validate on live stores after deploy
