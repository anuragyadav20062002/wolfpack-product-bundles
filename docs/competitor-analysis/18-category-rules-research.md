# Category Rules — Research Distillation

**Issue:** category-rules-1
**Created:** 2026-05-29
**Status:** Reference for category-rules-2 implementation

This document consolidates what we know about category rules in EB and what Wolfpack already implements, so that the storefront SDK enforcement work in `category-rules-2` can ship to exact parity.

> Sources: `docs/competitor-analysis/16-eb-full-data-flow-investigation.md` (Phase 4 — Template Enumeration), `docs/competitor-analysis/17-eb-complete-configure-e2e-audit.md` (PPB Step Setup section, lines 402–465).

## 1. Admin UX contract (mirrored by Wolfpack)

| Concept | EB behavior | Wolfpack status |
|---|---|---|
| Rule mode radio | "Step rules" vs "Category rules" — mutually exclusive | ✅ Implemented in FPB (route.tsx 3299–3503) and PPB (route.tsx 2794–2942). |
| Availability gate | Category rules option appears ONLY when `stepCategories.length > 1` | ✅ Implemented (`categoryRulesAvailable = stepCategories.length > 1`). |
| Mutual exclusivity | Switching to category rules clears step rules (sets `conditions.isEnabled: false` in step payload); switching back clears category conditions | ✅ Implemented via `clearStepConditions` / `clearCategoryConditionRules` callbacks. |
| Per-category rule fields | Type (quantity / amount) × Condition (greaterThanOrEqualTo / lessThanOrEqualTo / equalTo / greaterThan / lessThan) × Value | ✅ Same shape rendered in admin. |
| Auto-next checkbox | "Auto Next When rule is met" — per-category boolean | ✅ Implemented (`autoNextStepOnConditionMet` on StepCategory). |

## 2. Persistence shape

EB's `mixAndMatch/update` payload for a step using category rules (from doc 17 lines 432–448):

```json
{
  "productsData1": {
    "conditions": { "isEnabled": false, "rules": [...] },
    "categories": [
      { "title": "Pick audit items", "categoryRule": { "type": "quantity", "condition": "greaterThanOrEqualTo", "value": "01" } },
      { "title": "More audit items" }
    ]
  }
}
```

Wolfpack's equivalent (per Prisma `StepCategory.conditions: Json?`): an array of rule objects per category. The admin UI emits this exact shape — confirmed via the existing FPB/PPB save handlers. Field-by-field:

| EB field | Wolfpack field | Notes |
|---|---|---|
| `categoryRule.type` | `conditions[i].type` | Values: `"quantity"`, `"amount"` |
| `categoryRule.condition` | `conditions[i].condition` (also accepts `.operator` as fallback) | Values: `greaterThanOrEqualTo`, etc. |
| `categoryRule.value` | `conditions[i].value` | String (e.g. `"01"`) |

✅ No DB migration needed for #12.

## 3. Server runtime exposure (already done)

`app/lib/bundle-config/category-runtime.ts` `formatStepCategoryForRuntime` line 88 already emits:

```js
{
  ...
  conditions: asArray(category.conditions),
  autoNextStepOnConditionMet: category.autoNextStepOnConditionMet === true,
}
```

…inside each `step.categories[i]`. The storefront widget receives the array as-is via both the metafield cache and the app-proxy JSON response.

✅ No server changes needed for #12.

## 4. Storefront enforcement contract — the gap #12 must close

Currently the SDK only looks at step-level conditions:

- `app/assets/sdk/validate-bundle.js` (40 lines): reads `step.conditionValue / step.conditionOperator` only.
- `app/assets/widgets/shared/condition-validator.js`: `isStepConditionSatisfied(step, currentSelections)` sums all selections under the step and evaluates against `step.conditionType / conditionOperator / conditionValue`.

EB's semantics for category rules (inferred from observed admin behavior + doc 16 "category rule quantity >= 01" capture):

1. When the merchant configures category rules, **each category's rule is evaluated independently against the selections in that category**.
2. **A step is "satisfied"** when every category that has `conditions.length > 0` is independently satisfied. Categories without conditions don't gate the step.
3. The step-level `conditionValue` is ignored (because step rules and category rules are mutually exclusive in EB's UI).
4. ATC is blocked when any required step is not satisfied — same as today, but the satisfaction check now includes the per-category dimension.

### Concrete check the SDK must implement

For each `step` with `step.categories.length > 0`:

```js
function isStepSatisfied(step, selectionsByCategory) {
  // selectionsByCategory shape: { [categoryId]: { [productId]: qty } }
  for (const cat of step.categories) {
    const rules = Array.isArray(cat.conditions) ? cat.conditions : [];
    if (rules.length === 0) continue;
    const sel = selectionsByCategory[cat.categoryId] || {};
    const total = sumQuantities(sel);
    for (const rule of rules) {
      if (!evaluateRule(rule.type, rule.condition, rule.value, total)) return false;
    }
  }
  return true;
}
```

…with `evaluateRule(type, condition, value, total)` mirroring the existing `_evaluateSatisfied(operator, value, total)` in `condition-validator.js`.

### Auto-next behavior

When a step has category rules and `category.autoNextStepOnConditionMet === true` AND that category's rules are satisfied, the widget should advance to the next step automatically (FPB only — PPB doesn't multi-page).

## 5. Implementation outline for category-rules-2

1. Extract a pure helper `isCategoryConditionSatisfied(category, selectionsForCategory)` into `condition-validator.js`.
2. Extend `isStepConditionSatisfied(step, selections)` (or add `isStepSatisfiedWithCategories`) that:
   - If the step has any category with non-empty `conditions`, evaluate each category independently and AND the results.
   - Otherwise fall through to the existing step-level check.
3. Extend the SDK `validateStep` in `app/assets/sdk/validate-bundle.js` to call the new combined check.
4. Wire the autoNextStepOnConditionMet behavior at the per-category level in the FPB widget after each selection change.
5. Bump `WIDGET_VERSION`, build, deploy.
6. Tests:
   - Extend `tests/unit/assets/condition-validator.test.ts` with category branch fixtures.
   - New `tests/unit/assets/sdk-validate-bundle-category.test.ts` for the SDK wrapper.

## 6. Open uncertainties

- **Does EB combine step-level + category-level when both have data?** Per doc 17 line 438, EB sets `conditions.isEnabled: false` after switching to category rules — suggests strict mutual exclusivity. Wolfpack admin enforces the same (radio group). Implementation should treat the two as mutually exclusive too; if a step has any non-empty category conditions, ignore step-level conditions.
- **What does the widget do when a category has 0 selections but a rule like `quantity >= 1`?** The rule is not satisfied → step not satisfied → ATC blocked. Confirmed in EB ATC behavior observed in doc 17.
- **Auto-next race conditions** when multiple categories meet their conditions simultaneously: requires explicit testing.
