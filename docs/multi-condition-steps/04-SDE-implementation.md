# SDE Implementation Plan: Multi-Condition Step Support

## Overview

14 files change across 9 layers. TDD order: tests → ConditionValidator → DB → types → handlers → API → hook → UI → widget rebuild.

## Phase 1: Failing Tests (TDD — Red)
- Step 1.1: Add multi-condition test cases to `tests/unit/assets/condition-validator.test.ts`
- Step 1.2: Run `npm run test:unit` — confirm new tests fail, all existing pass

## Phase 2: ConditionValidator — Private Helpers + AND Logic (Green)
- Step 2.1: Add `_evaluateCanUpdate()` and `_evaluateSatisfied()` private helpers inside the IIFE
- Step 2.2: Rewrite `canUpdateQuantity` to use helpers + AND-evaluate `conditionOperator2 / conditionValue2`
- Step 2.3: Rewrite `isStepConditionSatisfied` same way
- Step 2.4: Run tests — confirm all green

## Phase 3: Prisma Schema
- Step 3.1: Add `conditionOperator2 String?` + `conditionValue2 Int?` to `Step` in `prisma/schema.prisma`
- Step 3.2: Run `prisma db push` (SIT, then prod)

## Phase 4: Metafield-Sync Types
- Step 4.1: Add `conditionOperator2?` + `conditionValue2?` to `BundleUiStep` in `types.ts`
- Step 4.2: Add same to `OptimizedStepConfig`

## Phase 5: Configure Route Handlers
- Step 5.1: Full-page handler — save `conditionOperator2 / conditionValue2` from `stepConditions[step.id]?.[1]` in Prisma create block
- Step 5.2: Full-page handler — include same in optimized metafield step config
- Step 5.3: Product-page handler — identical changes

## Phase 6: JSON API Routes
- Step 6.1: `api.bundle.$bundleId[.]json.tsx` — add `conditionOperator2 / conditionValue2` to step shape
- Step 6.2: `api.bundles.json.tsx` — same

## Phase 7: Dashboard Handler
- Step 7.1: `app.dashboard/handlers/handlers.server.ts` — add `conditionOperator2 / conditionValue2` to step data

## Phase 8: Bundle-Product + Cart-Transform Metafield Sync
- Step 8.1: `bundle-product.server.ts` — pass through second condition fields
- Step 8.2: `cart-transform.server.ts` — pass through second condition fields

## Phase 9: useBundleConfigurationState Hook
- Step 9.1: In `initializeStepConditions`, append second rule when `step.conditionOperator2` is non-null

## Phase 10: Configure Route UI — Toast Guard
- Step 10.1: Full-page `route.tsx` — wrap `addConditionRule` onClick with 2-rule limit check + toast
- Step 10.2: Product-page `route.tsx` — same

## Phase 11: Widget Rebuild + Lint + Commit
- Step 11.1: `npm run build:widgets`
- Step 11.2: `npx eslint --max-warnings 9999` on all modified files
- Step 11.3: Commit with `[multi-condition-steps-1] feat: ...`

## Build & Verification Checklist
- [ ] All existing ConditionValidator tests still pass
- [ ] New multi-condition tests pass
- [ ] `prisma db push` succeeds on SIT
- [ ] Widget bundles rebuilt
- [ ] ESLint zero errors
- [ ] Manual test: configure step with qty >= 2 AND qty <= 6, verify storefront blocks at 7 items
