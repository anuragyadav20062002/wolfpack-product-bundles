# Issue: Comprehensive Discount Condition Tests

**Issue ID:** discount-condition-tests-1
**Status:** In Progress
**Priority:** 🔴 High
**Created:** 2026-02-22
**Last Updated:** 2026-02-22 01:30

## Overview

Write exhaustive unit and integration tests for the two condition systems in the app:
1. **Step conditions** — `ConditionValidator` (already tested; now extended with integration coverage)
2. **Discount/pricing conditions** — `PricingCalculator` (untested; zero-tolerance feature)

Also writes integration tests that combine both systems to verify they cooperate correctly
in realistic multi-step bundle + tiered-pricing scenarios.

This is a 0% tolerance feature: any regression here silently costs merchants revenue.

## Related Documentation
- `docs/multi-condition-steps/03-architecture.md`
- `app/assets/widgets/shared/pricing-calculator.js`
- `app/assets/widgets/shared/condition-validator.js`
- `app/assets/widgets/shared/constants.js`

## Phases Checklist
- [x] Phase 1: Create issue file
- [x] Phase 2: Update jest.config.js — add babel-jest transform for .js files
- [x] Phase 3: Write pricing-calculator.test.ts (normalizeCondition + checkCondition + calculateDiscount + getNextDiscountRule)
- [x] Phase 4: Write condition-pricing-integration.test.ts (step conditions + discount conditions together)
- [ ] Phase 5: Run tests — confirm all pass
- [ ] Phase 6: Lint + commit

## Progress Log

### 2026-02-22 01:30 - Starting implementation
- Explored PricingCalculator (ES module, babel-jest required)
- Explored ConditionValidator (IIFE/CJS, already require()-able)
- babel-jest + @babel/plugin-transform-modules-commonjs already installed
- Writing tests now
