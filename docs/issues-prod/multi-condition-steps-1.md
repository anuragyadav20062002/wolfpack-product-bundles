# Issue: Multi-Condition Step Support

**Issue ID:** multi-condition-steps-1
**Status:** In Progress
**Priority:** 🔴 High
**Created:** 2026-02-22
**Last Updated:** 2026-02-22 00:00

## Overview

Allow merchants to configure two conditions on a single step (e.g. quantity >= 2 AND quantity <= 6). Currently only one condition is saved; lower-bound operators are also broken in canUpdateQuantity (no upper cap). Fix adds two new nullable DB columns, AND-logic in ConditionValidator, and wires the second rule through handlers and API.

## Related Documentation
- `docs/multi-condition-steps/00-BR.md`
- `docs/multi-condition-steps/02-PO-requirements.md`
- `docs/multi-condition-steps/03-architecture.md`
- `docs/multi-condition-steps/04-SDE-implementation.md`

## Phases Checklist
- [ ] Phase 1: Write failing multi-condition tests (TDD — red)
- [ ] Phase 2: Implement ConditionValidator private helpers + AND logic (green)
- [ ] Phase 3: Prisma schema — add conditionOperator2 + conditionValue2
- [ ] Phase 4: Update metafield-sync types
- [ ] Phase 5: Update both configure route handlers (save second condition)
- [ ] Phase 6: Update JSON API routes (return second condition)
- [ ] Phase 7: Update dashboard handler
- [ ] Phase 8: Update useBundleConfigurationState (load second condition)
- [ ] Phase 9: Add toast guard to both configure route.tsx files
- [ ] Phase 10: Rebuild widget bundles
- [ ] Phase 11: Lint + commit

## Progress Log

### 2026-02-22 00:00 - Starting implementation
- Feature pipeline stages BR → PO → Architect complete
- Beginning TDD — writing failing tests first
