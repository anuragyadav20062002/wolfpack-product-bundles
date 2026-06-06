# Issue: Checkout UI Actual Price Label
**Issue ID:** checkout-ui-actual-price-label-1
**Status:** Completed
**Priority:** 🔴 High
**Created:** 2026-06-04
**Last Updated:** 2026-06-04 23:52

## Overview
Update the `bundle-checkout-ui` aggregate savings panel so the retail label reads `Actual Price:` and all row labels render as normal text while row values render bold.

## Progress Log
### 2026-06-04 23:52 - Work started
- User requested checkout UI copy/style change after live verification.
- Required behavior:
  - Change `Retail Price:` to `Actual Price:`.
  - Labels must not be bold.
  - Values must be bold.
- Plan:
  1. Add failing source-contract coverage for the label and value emphasis.
  2. Update `extensions/bundle-checkout-ui/src/Checkout.tsx`.
  3. Validate checkout Polaris component usage with Shopify MCP.
  4. Run focused Jest, ESLint, and TypeScript checks.
  5. Rebuild graph metadata and commit scoped changes.

### 2026-06-04 23:54 - Implementation and verification
- Updated `extensions/bundle-checkout-ui/src/Checkout.tsx`:
  - `Retail Price:` visible label changed to `Actual Price:`.
  - Row labels now render as plain `s-text`.
  - All row values now render with `type="strong"`.
- Extended checkout UI contract coverage and test spec.
- Verification completed:
  - RED: `npx jest --selectProjects unit --runTestsByPath tests/unit/extensions/bundle-checkout-ui-contract.test.ts` failed before source update.
  - GREEN: `npx jest --selectProjects unit --runTestsByPath tests/unit/extensions/bundle-checkout-ui-contract.test.ts` passed.
  - Shopify MCP component validation passed for `purchase.checkout.cart-line-item.render-after`, API version `2026-01`.
  - `npx eslint --max-warnings 9999 extensions/bundle-checkout-ui/src/Checkout.tsx tests/unit/extensions/bundle-checkout-ui-contract.test.ts` passed.
  - `npx tsc --noEmit -p extensions/bundle-checkout-ui/tsconfig.json --skipLibCheck` passed.

## Related Documentation
- `docs/issues-prod/checkout-ui-bundle-savings-1.md`
- `test-spec/checkout-ui-bundle-savings.spec.md`

## Phases Checklist
- [x] Phase 1: Add failing contract coverage
- [x] Phase 2: Update checkout UI source
- [x] Phase 3: Validate and run focused checks
- [x] Phase 4: Commit relevant changes
