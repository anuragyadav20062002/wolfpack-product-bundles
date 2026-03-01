# Architecture Decision Record: Multi-Condition Step Support

**Inputs:**
- `docs/multi-condition-steps/00-BR.md`
- `docs/multi-condition-steps/02-PO-requirements.md`

---

## Context

Each bundle `Step` currently stores one condition in three DB columns (`conditionType`, `conditionOperator`, `conditionValue`). The admin UI already renders a list of condition rules per step and has an "Add Rule" button, but only the first rule is ever saved — the second is silently discarded by the handler. The storefront `ConditionValidator` evaluates only that single condition; lower-bound operators (`greater_than`, `greater_than_or_equal_to`) always return `allowed: true` in `canUpdateQuantity`, providing no upper cap.

The fix spans four layers: DB schema, server handlers, JSON API, and the widget ConditionValidator. No new UI components are needed.

---

## Constraints

- Must not break steps with a single condition or no condition
- `ConditionValidator` remains a pure IIFE with no external dependencies — changes are additive only
- Both configure route handlers (full-page + product-page) must be updated identically
- Widget bundles must be rebuilt after ConditionValidator changes (`npm run build:widgets`)
- TDD: unit tests for ConditionValidator must be written and passing before any implementation

---

## Options Considered

### Option A: Refactor ConditionValidator to accept a `conditions[]` array ❌

Replace `step.conditionOperator / step.conditionValue` with a `step.conditions[]` array in the validator. The API would return an array, the validator would iterate it.

- **Pros:** Scales to N conditions; cleaner conceptually
- **Cons:** Breaking change to the step shape everywhere (API, widget, cart-transform); requires updating all consumers; the benefit (N>2) is out of scope; significantly more risk for a 2-condition requirement
- **Verdict:** ❌ Rejected — disproportionate change for a 2-condition feature

### Option B: Add `conditionOperator2 / conditionValue2` as flat fields ✅ Recommended

Mirror the existing pattern with two new nullable columns. The validator gains private helper functions and checks both fields with AND logic.

- **Pros:** Minimal blast radius; additive-only changes everywhere; backward-compatible (NULL = no second condition); no breaking change to existing API shape; easy to audit
- **Cons:** Doesn't scale beyond 2 (acceptable — bounded range only needs 2)
- **Verdict:** ✅ Recommended

### Option C: Store both conditions in a JSON column ❌

Replace scalar columns with a `conditions Json?` array on `Step`.

- **Pros:** Arbitrary count
- **Cons:** Data migration required to move existing single conditions into JSON; breaks all existing query paths; no DB-level type safety; over-engineered for this use case
- **Verdict:** ❌ Rejected

---

## Decision: Option B — Flat `conditionOperator2 / conditionValue2` fields

---

## Architecture: Data Flow After This Change

```
Admin UI
  conditionsState.stepConditions[step.id] = [rule0, rule1]
          │
          ▼  (form submit)
Handler (full-page / product-page)
  rule0 → conditionType, conditionOperator, conditionValue
  rule1 → conditionOperator2, conditionValue2
          │
          ▼  (Prisma upsert)
DB Step table
  conditionType, conditionOperator, conditionValue
  conditionOperator2, conditionValue2  ← NEW
          │
          ├──► metafield / cart-transform sync (includes both conditions)
          │
          └──► JSON API (api.bundle.$bundleId.json / api.bundles.json)
                  step: { conditionType, conditionOperator, conditionValue,
                          conditionOperator2, conditionValue2 }  ← NEW
                          │
                          ▼  (widget reads JSON)
                  ConditionValidator
                    canUpdateQuantity()        ← AND-evaluates both
                    isStepConditionSatisfied() ← AND-evaluates both
```

---

## ConditionValidator Refactor Design

The current validator has duplicated `switch` blocks in `canUpdateQuantity` and `isStepConditionSatisfied`. Introducing two private helpers eliminates the duplication and makes the AND-evaluation clean.

### New private helpers (internal to the IIFE)

```js
/**
 * Evaluate whether a proposed total satisfies a single operator's
 * "can update" rule (upper-bound check only — lower-bound always allows).
 */
function _evaluateCanUpdate(operator, required, totalAfter) {
  let allowed;
  switch (operator) {
    case OPERATORS.EQUAL_TO:
      allowed = totalAfter <= required;   // block exceeding N
      break;
    case OPERATORS.LESS_THAN:
      allowed = totalAfter < required;
      break;
    case OPERATORS.LESS_THAN_OR_EQUAL_TO:
      allowed = totalAfter <= required;
      break;
    case OPERATORS.GREATER_THAN:
    case OPERATORS.GREATER_THAN_OR_EQUAL_TO:
      allowed = true;                     // lower-bound: no cap
      break;
    default:
      allowed = true;
  }
  return { allowed, limitText: allowed ? null : _buildLimitText(operator, required) };
}

/**
 * Evaluate whether a total satisfies a single condition at step-completion time.
 */
function _evaluateSatisfied(operator, required, total) {
  switch (operator) {
    case OPERATORS.EQUAL_TO:                 return total === required;
    case OPERATORS.GREATER_THAN:             return total > required;
    case OPERATORS.LESS_THAN:               return total < required;
    case OPERATORS.GREATER_THAN_OR_EQUAL_TO: return total >= required;
    case OPERATORS.LESS_THAN_OR_EQUAL_TO:   return total <= required;
    default:                                return true;
  }
}
```

### Updated `canUpdateQuantity` (AND logic)

```js
function canUpdateQuantity(step, currentSelections, targetProductId, newQuantity) {
  if (!step || !step.conditionType || !step.conditionOperator || step.conditionValue == null) {
    return { allowed: true, limitText: null };
  }

  const totalAfter = calculateStepTotalAfterUpdate(currentSelections, targetProductId, newQuantity);

  // Primary condition
  const primary = _evaluateCanUpdate(step.conditionOperator, step.conditionValue, totalAfter);
  if (!primary.allowed) return primary;

  // Secondary condition (AND — only evaluated if primary passes)
  if (step.conditionOperator2 != null && step.conditionValue2 != null) {
    const secondary = _evaluateCanUpdate(step.conditionOperator2, step.conditionValue2, totalAfter);
    if (!secondary.allowed) return secondary;
  }

  return { allowed: true, limitText: null };
}
```

### Updated `isStepConditionSatisfied` (AND logic)

```js
function isStepConditionSatisfied(step, currentSelections) {
  if (!step || !step.conditionType || !step.conditionOperator || step.conditionValue == null) {
    return true;
  }

  const selections = currentSelections || {};
  let total = 0;
  for (const qty of Object.values(selections)) { total += qty || 0; }

  // Primary condition
  if (!_evaluateSatisfied(step.conditionOperator, step.conditionValue, total)) return false;

  // Secondary condition (AND)
  if (step.conditionOperator2 != null && step.conditionValue2 != null) {
    return _evaluateSatisfied(step.conditionOperator2, step.conditionValue2, total);
  }

  return true;
}
```

---

## DB Schema Change

```prisma
// prisma/schema.prisma — Step model additions
conditionOperator2  String?   // second condition operator (nullable)
conditionValue2     Int?      // second condition value (nullable)
```

No `conditionType2` — both conditions share `conditionType`.
Run `prisma db push` (SIT first, then prod) after this change.

---

## Files to Create / Modify

| Action | File | Change |
|--------|------|--------|
| **MODIFY** | `prisma/schema.prisma` | Add `conditionOperator2 String?` + `conditionValue2 Int?` to `Step` |
| **MODIFY** | `app/hooks/useBundleConfigurationState.ts` | Load second condition from step into rule array (append rule #2 if `conditionOperator2` exists) |
| **MODIFY** | `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/route.tsx` | "Add Rule" onClick — show toast when rule count ≥ 2 |
| **MODIFY** | `app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/route.tsx` | Same toast guard |
| **MODIFY** | `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/handlers/handlers.server.ts` | Save second rule to `conditionOperator2 / conditionValue2` in both Prisma upsert and optimized metafield config |
| **MODIFY** | `app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/handlers/handlers.server.ts` | Same |
| **MODIFY** | `app/routes/api/api.bundle.$bundleId[.]json.tsx` | Include `conditionOperator2 / conditionValue2` in step API response |
| **MODIFY** | `app/routes/api/api.bundles.json.tsx` | Same |
| **MODIFY** | `app/services/bundles/metafield-sync/types.ts` | Add `conditionOperator2? / conditionValue2?` to `BundleUiStep` and `OptimizedStepConfig` |
| **MODIFY** | `app/services/bundles/metafield-sync/operations/bundle-product.server.ts` | Pass through second condition fields |
| **MODIFY** | `app/services/bundles/metafield-sync/operations/cart-transform.server.ts` | Pass through second condition fields |
| **MODIFY** | `app/routes/app/app.dashboard/handlers/handlers.server.ts` | Include second condition in step data |
| **MODIFY** | `app/assets/widgets/shared/condition-validator.js` | Add `_evaluateCanUpdate`, `_evaluateSatisfied` helpers; AND-evaluate both conditions |
| **MODIFY** | `tests/unit/assets/condition-validator.test.ts` | Add multi-condition test cases (**written first — TDD**) |

---

## Backward Compatibility Strategy

1. New DB columns are nullable → existing rows have `NULL` → validator guard `conditionOperator2 != null && conditionValue2 != null` skips the second condition → identical behaviour to today
2. API response gains two new fields; widget code that doesn't reference them is unaffected
3. `useBundleConfigurationState` only adds a second rule array element when the DB has a second condition; steps with one or zero conditions load identically to today

---

## Testing Approach

### TDD Order (write tests first)
1. Write failing tests for multi-condition `canUpdateQuantity` and `isStepConditionSatisfied`
2. Run — confirm they fail
3. Implement `_evaluateCanUpdate`, `_evaluateSatisfied` helpers and update both public functions
4. Run — confirm all tests pass (including existing 50+ tests)

### Test cases to add (minimum)

**`canUpdateQuantity` — two conditions (`>= 2 AND <= 6`)**
- Total 1 → primary (GTE 2) allows; secondary (LTE 6) allows → `allowed: true`
- Total 6 → primary allows; secondary allows (6 ≤ 6) → `allowed: true`
- Total 7 → primary allows; secondary blocks (7 > 6) → `allowed: false`, limitText = "at most 6"
- Decrease from 7 → 6: secondary now passes → `allowed: true`

**`canUpdateQuantity` — single lower-bound only (`>= 2`, no second condition)**
- Any increase → `allowed: true` (existing behaviour, must remain)

**`isStepConditionSatisfied` — two conditions (`>= 2 AND <= 6`)**
- total = 1 → false (primary fails)
- total = 2 → true
- total = 6 → true
- total = 7 → false (secondary fails — new behaviour)

**`isStepConditionSatisfied` — single lower-bound (`>= 2`)**
- total = 7 → true (no second condition, existing behaviour preserved)

**Null / undefined second condition**
- `conditionOperator2: null` → behaves as single condition in all branches
- `conditionOperator2: undefined` → same
