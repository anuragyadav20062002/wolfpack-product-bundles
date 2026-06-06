# Issue: Category Rules Behavior — Research + Doc

**Issue ID:** category-rules-1
**Status:** In Progress
**Priority:** 🟡 Medium
**Created:** 2026-05-29
**Last Updated:** 2026-05-29

## Overview

Document the end-to-end behavior of category rules in EB so that #12 (Wolfpack storefront SDK enforcement) can ship to exact parity.

Wolfpack admin UI + DB + server-side runtime formatter already understand category rules:
- Admin UI in FPB (route.tsx 3299–3503) and PPB (route.tsx 2794–2942) — Step rules / Category rules radio group, gated by `categoryRulesAvailable = stepCategories.length > 1`.
- Persistence: `StepCategory.conditions` (JSON array) in Prisma schema.
- Runtime exposure: `app/lib/bundle-config/category-runtime.ts` `formatStepCategoryForRuntime` line 88 emits `conditions: asArray(category.conditions)` to the storefront runtime.

The **gap is purely in the storefront SDK** — `app/assets/sdk/validate-bundle.js` and `app/assets/widgets/shared/condition-validator.js` both look at step-level `conditionType / conditionOperator / conditionValue` only and ignore per-category conditions.

## Files Changed

- `docs/competitor-analysis/18-category-rules-research.md` (new) — distilled facts + Wolfpack alignment table + implementation outline for #12.

## Approach

This commit is **docs only** — research, distill, document. The implementation lives in `category-rules-2`.

## Phases Checklist

- [x] Phase 1: Read existing competitor docs (16, 17) for category rules evidence
- [x] Phase 2: Diff against Wolfpack admin UI behavior and current DB shape
- [x] Phase 3: Document the storefront enforcement contract that #12 should follow
- [x] Phase 4: Commit

**Status:** Completed (docs only)

## Progress Log

### 2026-05-29 — Implementation complete
- Confirmed Wolfpack's admin UI, DB schema, and server runtime formatter already cover category rules end-to-end. The only gap is storefront enforcement.
- Written `docs/competitor-analysis/18-category-rules-research.md` consolidating the EB contract (admin UX, payload shape, mutual-exclusivity rules, auto-next semantics) and an implementation outline for #12 with concrete code targets in `condition-validator.js` and `validate-bundle.js`.

### 2026-05-29 — Starting implementation
- Created issue file. Next: write the consolidated research doc.
