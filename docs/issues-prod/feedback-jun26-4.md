# Issue: Discount Rule Dropdowns Side-by-Side (Gray Box)

**Issue ID:** feedback-jun26-4
**Status:** In Progress
**Priority:** 🟡 Medium
**Created:** 2026-05-29
**Last Updated:** 2026-05-29

## Overview

From `wolpack issues.docx` issue 2: in the bundle edit pages (FPB + PPB) under Discount & Pricing, the gray rule box currently lays its three dropdowns vertically when it should lay them horizontally (matching EB). Affects Percentage Discount, Fixed Bundle Price, and Fixed Amount discount types.

Code currently uses `<s-stack direction="inline" gap="small-100">` which collapses to stacked under the sidebar layout's narrow main column (`max-width: 994px` in `editCanvas`). Switch to an explicit CSS grid container.

## Approach

Add two grid classes to shared CSS:
- `.discountFieldsRow` — 3-column grid (`1fr 1fr 1fr`, 8px gap, align-items: end) for Percentage / Fixed Amount.
- `.discountFieldsRowPair` — 2-column grid (`1fr 1fr`) for Fixed Bundle Price.

Replace the two `<s-stack direction="inline">` wrappers in FPB and PPB discount sections with `<div className={…discountFieldsRow|RowPair}>`. Same change in the CREATE wizard for parity.

Responsive collapse at `< 700px` to single column.

## Files Changed

- `app/styles/routes/bundle-configure-shared.module.css` — add `.discountFieldsRow` + `.discountFieldsRowPair`.
- `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/route.tsx` — swap `s-stack` for grid div in discount rule body (FIXED_BUNDLE_PRICE + PERCENTAGE_OFF/FIXED_AMOUNT_OFF branches).
- `app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/route.tsx` — same swap.

## Tests

- `tests/unit/routes/discount-rule-row-ui-contract.test.ts` — assert CSS class exists with 3-col grid, route source references the new class in both FPB and PPB inside the relevant branches.

## Phases Checklist

- [x] Phase 1: Failing test for grid CSS + JSX class usage
- [x] Phase 2: Add CSS classes (shared + composes bridges in FPB/PPB modules)
- [x] Phase 3: Swap s-stack for div in FPB + PPB
- [x] Phase 4: Tests + lint green
- [x] Phase 5: Commit

**Status:** Completed

## Progress Log

### 2026-05-29 — Implementation complete
- Added `.discountFieldsRow` (3-col grid, 8px gap, align-items: end) and `.discountFieldsRowPair` (2-col grid) to `bundle-configure-shared.module.css`, plus a `@media (max-width: 700px)` collapse to single column.
- Added `composes:` bridges in `full-page-bundle-configure.module.css` and `product-page-bundle-configure.module.css` so the JSX can reference `fullPageBundleStyles.discountFieldsRow` / `productPageBundleStyles.discountFieldsRow`.
- Swapped `<s-stack direction="inline" gap="small-100">` → `<div className={...discountFieldsRow|RowPair}>` in both FPB (lines 4112+) and PPB (lines 3238+) for the two ternary branches: FIXED_BUNDLE_PRICE uses the 2-col pair; PERCENTAGE_OFF / FIXED_AMOUNT_OFF uses the 3-col row.
- 11/11 UI contract tests pass (CSS contract + JSX usage in both FPB and PPB).

### 2026-05-29 — Starting implementation
- Created issue file. Helper CSS-contract test next.
