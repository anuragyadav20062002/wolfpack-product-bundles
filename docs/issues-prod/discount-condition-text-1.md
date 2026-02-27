# Issue: Discount Condition Text Ignores Operator

**Issue ID:** discount-condition-text-1
**Status:** Completed
**Priority:** 🔴 High
**Created:** 2026-02-28
**Last Updated:** 2026-02-28 23:00

## Overview
Discount condition text in the storefront widget ignores the operator (gt, gte, eq, lt, lte) and always displays the target value as a flat number (e.g., "Add 3 items to get 50% off" instead of "Add more than 3 items to get 50% off" when operator is `greater_than`).

## Root Causes
1. `TemplateManager.calculateConditionData()` does not receive or use the operator — always generates "N items" text
2. `TemplateManager.createDiscountVariables()` extracts `condition.type` and `condition.value` but not `condition.operator`
3. `bundle-widget-full-page.js` promo banner (lines 1317-1329) hardcodes "Add ${targetQty} items" without checking operator

## Fix Plan
1. Add operator param to `calculateConditionData()` and generate operator-aware text
2. Update `createDiscountVariables()` to pass operator
3. Fix hardcoded promo banner text in `bundle-widget-full-page.js`
4. Run `npm run build:widgets` to rebuild bundles

## Progress Log

### 2026-02-28 23:00 - Starting Fix
Files to modify:
- `app/assets/widgets/shared/template-manager.js` — add operator to calculateConditionData
- `app/assets/bundle-widget-full-page.js` — fix hardcoded promo banner text

### 2026-02-28 23:15 - Fix Implemented
- Added `formatOperatorText()` static method to TemplateManager for operator-aware text
- Updated `createDiscountVariables()` to extract `condition.operator` and pass it to `calculateConditionData()`
- Updated `calculateConditionData()` to accept operator and generate operator-aware conditionText
- Fixed `bundle-widget-full-page.js` promo banner to use `TemplateManager.formatOperatorText()` instead of hardcoded qty text
- Product-page widget uses TemplateManager (no separate fix needed)
- Modal discount bar shows "N more items" (progress delta), not threshold — no fix needed
- Built widget bundles successfully

Files modified:
- `app/assets/widgets/shared/template-manager.js`
- `app/assets/bundle-widget-full-page.js`
- `extensions/bundle-builder/assets/bundle-widget-full-page-bundled.js` (rebuilt)
- `extensions/bundle-builder/assets/bundle-widget-product-page-bundled.js` (rebuilt)

Operator text mapping:
- `greater_than` → "more than N items"
- `less_than` → "fewer than N items"
- `less_than_or_equal_to` → "N or fewer items"
- `equal_to` / `greater_than_or_equal_to` / default → "N items" (natural threshold text)

## Phases Checklist
- [x] Fix TemplateManager.calculateConditionData with operator support
- [x] Fix full-page widget promo banner text
- [x] Build widgets
- [x] Lint modified files
- [ ] Commit
