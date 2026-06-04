# Issue: Checkout UI Bundle Savings Display
**Issue ID:** checkout-ui-bundle-savings-1
**Status:** Completed
**Priority:** 🔴 High
**Created:** 2026-06-04
**Last Updated:** 2026-06-04 23:29

## Overview
Update `bundle-checkout-ui` so checkout and thank-you cart-line extension output shows only the aggregate bundle savings panel when a bundle discount exists.

Required display:
- Bundle Savings
- Retail Price: aggregate original retail price of bundled items
- Bundle Price: aggregate bundle price after bundle discount
- Savings: aggregate savings amount
- % Saved: `savings / retail * 100`

The extension must not render the redundant `Bundle (n items)` heading or per-component price breakdown. Shopify-rendered non-bundle product lines must remain untouched.

## Progress Log
### 2026-06-04 23:18 - Work started
- User provided checkout screenshot and required aggregate bundle savings copy.
- Internal checkout UI note confirms `bundle-checkout-ui` renders on `purchase.checkout.cart-line-item.render-after` and `purchase.thank-you.cart-line-item.render-after`.
- Impact analysis: touches checkout UI extension component and its contract tests. Downstream risk is checkout/thank-you order summary presentation for merged bundle parent cart lines.
- Root cause: `BundlePricingExtension` currently renders an expandable per-component list and legacy labels (`Percentage Savings`, `Exact Savings`) instead of a single aggregate savings panel.
- Next steps: add failing contract tests, implement the aggregate-only render, validate Polaris checkout web components, run focused tests/lint, rebuild graph, and commit relevant changes.

### 2026-06-04 23:22 - Failing contract test added
- Added `test-spec/checkout-ui-bundle-savings.spec.md`.
- Updated `tests/unit/extensions/bundle-checkout-ui-contract.test.ts` to require `Bundle Savings`, `Retail Price`, `Bundle Price`, `Savings`, `% Saved`, no expandable component list UI, and no custom render when there is no discount.
- Verified RED with `npx jest --selectProjects unit --runTestsByPath tests/unit/extensions/bundle-checkout-ui-contract.test.ts`; the test failed because the source still rendered old component-list UI and legacy labels.

### 2026-06-04 23:29 - Aggregate checkout UI implemented and verified
- Updated `extensions/bundle-checkout-ui/src/Checkout.tsx` to render only the aggregate bundle savings panel for bundle parent lines with positive aggregate savings.
- Removed custom component parsing, product thumbnails, expand/collapse UI, and per-item breakdown rows from the extension.
- `% Saved` is now computed as `totalSavingsCents / totalRetailCents * 100` from aggregate cart-transform attributes.
- Shopify component validation passed for `purchase.checkout.cart-line-item.render-after` using `polaris-checkout-extensions` version `2026-01`; validated components were `s-stack`, `s-divider`, and `s-text`.
- Shopify docs for `purchase.checkout.cart-line-item.render-after` confirm this target renders once for every order-summary line item and should selectively return `null` when the extension does not apply.
- Focused Jest contract test passed.
- Focused ESLint passed with zero errors and zero warnings.
- `npx tsc --noEmit -p extensions/bundle-checkout-ui/tsconfig.json --skipLibCheck` passed for extension source. Plain `tsc` without `--skipLibCheck` is blocked by dependency declaration conflicts inside `extensions/bundle-checkout-ui/node_modules/@shopify/ui-extensions`, not by this source change.
- Note: live checkout cannot reflect this change until the checkout UI extension is deployed through Shopify.

## Related Documentation
- `internal docs/Shopify Integration/Checkout UI Extension.md`
- `extensions/bundle-checkout-ui/README.md`

## Phases Checklist
- [x] Phase 1: Add failing checkout UI contract tests
- [x] Phase 2: Implement aggregate-only bundle savings UI
- [x] Phase 3: Validate checkout web component usage
- [x] Phase 4: Run focused tests and lint
- [x] Phase 5: Commit relevant changes
