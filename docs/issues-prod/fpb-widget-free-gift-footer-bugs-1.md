# Issue: FPB Widget — Free Gift Footer Counter and Currency Bugs

**Issue ID:** fpb-widget-free-gift-footer-bugs-1
**Status:** Completed
**Priority:** 🟡 Medium
**Created:** 2026-04-02
**Last Updated:** 2026-04-02 14:30

## Overview
SIT QA session on `test-bundle-store123.myshopify.com/pages/preview-564` surfaced four bugs
related to the free gift step and the footer counter in the Full Page Bundle widget.

## Bugs

### Bug 1: Footer counter shown when no step conditions are configured
The `N/M Steps` counter in the footer bar is always rendered, even when no step has
`conditionType`, `conditionOperator`, or `conditionValue` configured. With no conditions,
the counter is meaningless — the merchant hasn't set any quantity requirements. It should
only appear when at least one non-free-gift step has explicit conditions.

**Location:** `_createFooterBar()` — line ~2234

### Bug 2: Footer counter label says "Products" instead of "Steps"
The denominator `M` in the `N/M` counter equals the number of steps (each defaulting to 1
when `conditionValue` is absent). Calling it "Products" is semantically incorrect — it is
tracking step progress, not a product count limit.

**Location:** `_createFooterBar()` — line ~2234

### Bug 3: `totalRequired` denominator includes free gift steps
`renderFullPageFooter()` computes `totalRequired` by summing all steps including
`isFreeGift` and `isDefault` steps. This inflates the denominator. Free gift and default
steps should be excluded so the counter only reflects merchantconfigured paid-step requirements.

**Location:** `renderFullPageFooter()` — line ~2113

### Bug 4: Free gift price renders `$0.00` (hardcoded USD symbol)
Two locations hardcode the dollar sign instead of using `CurrencyManager.convertAndFormat()`:
- Product card overlay: line ~1964 — `priceEl.innerHTML = \`$0.00 ...\``
- Side panel row: line ~1119 — `$0.00` string literal

**Location:** `bundle-widget-full-page.js` lines ~1119 and ~1964

## Progress Log

### 2026-04-02 14:30 - Completed all four fixes
- ✅ Bug 1 + 2: `_createFooterBar()` — counter hidden when `bundleHasNoConditions()` is true; label renamed "Products" → "Steps"
- ✅ Bug 3: `renderFullPageFooter()` — `totalRequired` now skips `isFreeGift` and `isDefault` steps
- ✅ Bug 4: Product card (line ~1964) — replaced hardcoded `$0.00` with `CurrencyManager.convertAndFormat(0, _ci)`
- ✅ Bug 4: Side panel row (line ~1119) — replaced hardcoded `$0.00` with `CurrencyManager.convertAndFormat(0, currencyInfo)`
- ✅ Built: `npm run build:widgets:full-page` → 254.1 KB, 0 errors
- ✅ Lint: 0 ESLint errors

### 2026-04-02 14:00 - Starting fix
- Identified all four bugs during SIT QA session
- Files to change: `app/assets/bundle-widget-full-page.js`
- After code fix: run `npm run build:widgets`, lint, commit

## Files to Change
- `app/assets/bundle-widget-full-page.js`
- `extensions/bundle-builder/assets/bundle-widget-full-page-bundled.js` (built output)

## Phases Checklist
- [x] Fix Bug 1 + 2: Hide counter when conditionless; rename label to "Steps"
- [x] Fix Bug 3: Exclude isFreeGift/isDefault from totalRequired
- [x] Fix Bug 4: Replace hardcoded `$0.00` with CurrencyManager in both locations
- [x] Build widgets: `npm run build:widgets:full-page` → 254.1 KB
- [x] Lint modified files (0 errors)
- [x] Commit
