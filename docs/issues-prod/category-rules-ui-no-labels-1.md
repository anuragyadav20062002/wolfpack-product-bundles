# Issue: Remove Type/Condition/Value Labels from Category Rule Dropdowns — EB Parity
**Issue ID:** category-rules-ui-no-labels-1
**Status:** Completed
**Priority:** 🟡 Medium
**Created:** 2026-06-01
**Last Updated:** 2026-06-01 00:00

## Overview
Remove "Type", "Condition", "Value" labels from the category rules dropdowns in both PPB and FPB configure pages. Replace Polaris `s-select` / `s-number-field` (which always render a label) with plain native `<select>` / `<input type="number">` styled to match EB exactly: three compact unlabelled inline fields in a row.

## EB Reference (live observation 2026-06-01)
From a11y tree of the expanded Category 1 rule in EB PPB:
- `combobox` value="Quantity" | options: Quantity, Amount
- `combobox` value="is greater than or equal to" | options: is less/greater/equal to
- `spinbutton` value="1"
No labels. Native selects in a horizontal row. Compact height (~32px).

## Files to Change
- `app/styles/routes/bundle-configure-shared.module.css` — add `.categoryRuleFields`, `.ruleInlineSelect`, `.ruleInlineNumber`
- `app/styles/routes/full-page-bundle-configure.module.css` — add `.categoryRuleFields` compose
- `app/styles/routes/product-page-bundle-configure.module.css` — add `.categoryRuleFields` compose
- `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/route.tsx` — swap Polaris → native in category rule block
- `app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/route.tsx` — same

## Progress Log
### 2026-06-01 00:00 - Implementation complete
- Added `.categoryRuleFields`, `.ruleInlineSelect`, `.ruleInlineNumber` to `bundle-configure-shared.module.css`
- Added compose entries to `full-page-bundle-configure.module.css` and `product-page-bundle-configure.module.css`
- Replaced `s-select label="Type"`, `s-select label="Condition"`, `s-number-field label="Value"` with native `<select>`/`<input type="number">` using `aria-label` only (no visible label) in both FPB and PPB `route.tsx`
- Verified via a11y tree: `combobox "Type"`, `combobox "Condition"`, `spinbutton "Value"` — all unlabelled inline fields, exact EB match
- No new ESLint errors introduced

## Phases Checklist
- [x] Add CSS classes to shared module
- [x] Add compose entries to FPB + PPB module CSS
- [x] Update FPB route.tsx
- [x] Update PPB route.tsx
- [x] Lint + commit
