# Issue: Checkout UI Currency and Savings Layout
**Issue ID:** checkout-ui-currency-savings-layout-1
**Status:** Completed
**Priority:** 🔴 High
**Created:** 2026-06-05
**Last Updated:** 2026-06-05 00:14

## Overview
Checkout bundle savings currently formats prices through locale-default `Intl.NumberFormat`, which can render USD as `US$` and similarly code-prefixed symbols for other dollar currencies. The checkout savings panel should display the narrow currency symbol and combine savings amount with the percent saved inline.

## Progress Log
### 2026-06-05 00:08 - Investigation started
- Found checkout UI formatter in `extensions/bundle-checkout-ui/src/Checkout.tsx`.
- Root cause: `Intl.NumberFormat(undefined, { style: "currency", currency })` lets the runtime locale choose the symbol style, so code-prefixed forms like `US$` may appear.
- Next: add/update contract tests, switch to narrow currency symbols, remove the separate `% Saved` row, and validate checkout Polaris components.

### 2026-06-05 00:14 - Currency and savings layout fixed
- Updated formatter to use `currencyDisplay: 'narrowSymbol'`, which avoids locale code-prefixed dollar output such as `US$` / `A$`.
- Removed the separate `% Saved` row from checkout UI.
- Rendered savings percentage inline beside the savings amount as small success text, e.g. `$143.99 (10%)`.
- Focused Jest contract test, checkout extension TypeScript, ESLint, and Shopify component validation passed.

## Related Documentation
- `extensions/bundle-checkout-ui/src/Checkout.tsx`
- `tests/unit/extensions/bundle-checkout-ui-contract.test.ts`
- `test-spec/checkout-ui-bundle-savings.spec.md`

## Phases Checklist
- [x] Phase 1: Update checkout UI contract tests/spec
- [x] Phase 2: Update currency formatting and savings row layout
- [x] Phase 3: Validate tests, lint, typecheck, and Shopify checkout components
