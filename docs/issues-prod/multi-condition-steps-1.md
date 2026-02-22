# Issue: Multi-Condition Step Support

**Issue ID:** multi-condition-steps-1
**Status:** Completed
**Priority:** 🔴 High
**Created:** 2026-02-22
**Last Updated:** 2026-02-22 01:00

## Overview

Allow merchants to configure two conditions on a single step (e.g. quantity >= 2 AND quantity <= 6). Currently only one condition is saved; lower-bound operators are also broken in canUpdateQuantity (no upper cap). Fix adds two new nullable DB columns, AND-logic in ConditionValidator, and wires the second rule through handlers and API.

## Related Documentation
- `docs/multi-condition-steps/00-BR.md`
- `docs/multi-condition-steps/02-PO-requirements.md`
- `docs/multi-condition-steps/03-architecture.md`
- `docs/multi-condition-steps/04-SDE-implementation.md`

## Phases Checklist
- [x] Phase 1: Write failing multi-condition tests (TDD — red)
- [x] Phase 2: Implement ConditionValidator private helpers + AND logic (green)
- [x] Phase 3: Prisma schema — add conditionOperator2 + conditionValue2
- [x] Phase 4: Update metafield-sync types
- [x] Phase 5: Update both configure route handlers (save second condition)
- [x] Phase 6: Update JSON API routes (return second condition)
- [x] Phase 7: Update dashboard handler
- [x] Phase 8: Update useBundleConfigurationState (load second condition)
- [x] Phase 9: Add toast guard to both configure route.tsx files
- [x] Phase 10: Rebuild widget bundles
- [x] Phase 11: Lint + commit

## Progress Log

### 2026-02-22 00:00 - Starting implementation
- Feature pipeline stages BR → PO → Architect complete
- Beginning TDD — writing failing tests first

### 2026-02-22 01:00 - Completed all phases
- ✅ 25 new multi-condition unit tests added (84 total, all passing)
- ✅ ConditionValidator: added _evaluateCanUpdate + _evaluateSatisfied helpers, AND logic for both public functions
- ✅ prisma/schema.prisma: conditionOperator2 String? + conditionValue2 Int? added to Step
- ✅ prisma generate run; db push pending (run manually against SIT then prod)
- ✅ metafield-sync/types.ts: BundleUiStep + OptimizedStepConfig extended
- ✅ Both configure handlers: save secondCondition to new DB fields
- ✅ Both configure handlers: optimized metafield step config includes second condition
- ✅ api.bundle.$bundleId.json + api.bundles.json: second condition in step response
- ✅ dashboard handler: second condition passed through in clone
- ✅ bundle-product.server.ts + cart-transform.server.ts: second condition passed through
- ✅ useBundleConfigurationState: loads both conditions from DB into rule array
- ✅ Both configure route.tsx: "Add Rule" shows info toast at 2-rule limit
- ✅ Widget bundles rebuilt
- ✅ ESLint: 0 errors
- Files modified: 14
