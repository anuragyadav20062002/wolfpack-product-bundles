# Product Owner Requirements: Multi-Condition Step Support

**Inputs:** `docs/multi-condition-steps/00-BR.md`

---

## User Stories with Acceptance Criteria

---

### Story 1: Save both condition rules to the database

**As a** merchant
**I want** both condition rules I configure on a step to be persisted
**So that** my second condition (e.g. upper bound) is not silently discarded on save

**Acceptance Criteria:**
- [ ] Given a step with 2 condition rules configured in the admin, when the merchant saves, then rule #1 is saved to `conditionType / conditionOperator / conditionValue` and rule #2's operator + value are saved to `conditionOperator2 / conditionValue2`
- [ ] Given a step with only 1 rule configured, when saved, then `conditionOperator2` and `conditionValue2` are `NULL` in the DB
- [ ] Given a step with 0 rules, then all condition columns remain `NULL`
- [ ] Given an existing step (created before this feature), then `conditionOperator2 / conditionValue2` default to `NULL` — no migration required

---

### Story 2: Load both conditions back into the admin UI

**As a** merchant
**I want** to re-open a step I previously configured with 2 conditions and see both rules already populated
**So that** I can edit or remove them without having to re-create them

**Acceptance Criteria:**
- [ ] Given a step in the DB with `conditionOperator2` and `conditionValue2` set, when the configure page loads, then the step's condition rule list shows 2 rows (Condition #1 and Condition #2) pre-filled with the correct operator and value
- [ ] Given a step with only `conditionOperator` set (no second condition), when the page loads, then only 1 condition rule row is shown
- [ ] Given a step with no conditions set, when the page loads, then 0 condition rule rows are shown

---

### Story 3: Prevent more than 2 condition rules with informative feedback

**As a** merchant
**I want** to be told why I cannot add a third condition rule
**So that** I understand the 2-condition limit rather than being silently blocked

**Acceptance Criteria:**
- [ ] Given a step already has 2 condition rules, when the merchant clicks "Add Rule", then an info toast is shown (e.g. "A step can have at most 2 conditions")
- [ ] Given a step already has 2 condition rules, the "Add Rule" button remains visually enabled (not greyed out) — the toast is the feedback mechanism
- [ ] Given a step has 0 or 1 condition rules, clicking "Add Rule" works exactly as before — no toast

---

### Story 4: Storefront enforces both conditions at real-time selection time

**As a** shopper
**I want** the step to stop me from adding items beyond the cap defined by the merchant
**So that** I don't accidentally build an invalid bundle

**Acceptance Criteria:**
- [ ] Given a step with `quantity >= 2 AND quantity <= 6`, when the shopper tries to add a 7th item, then the add action is blocked and a limit message is shown
- [ ] Given a step with only `quantity >= 2` (no upper bound), when the shopper adds items, then they are never blocked from increasing quantity (existing behaviour preserved)
- [ ] Given a step with only `quantity <= 6`, when the shopper tries to add a 7th item, then the add action is blocked (existing behaviour preserved)
- [ ] Given either condition is a lower-bound-only operator (`greater_than`, `greater_than_or_equal_to`), when there is no second condition, then `canUpdateQuantity` always returns `allowed: true` for increases (no change to single-condition behaviour)

---

### Story 5: Storefront enforces both conditions at step completion time

**As a** shopper
**I want** the step to tell me when my selection doesn't satisfy ALL conditions before I can navigate forward
**So that** I know exactly what I need to fix

**Acceptance Criteria:**
- [ ] Given `quantity >= 2 AND quantity <= 6`, when total selected = 1, then step is NOT satisfied (lower bound fails)
- [ ] Given `quantity >= 2 AND quantity <= 6`, when total selected = 2, then step IS satisfied
- [ ] Given `quantity >= 2 AND quantity <= 6`, when total selected = 6, then step IS satisfied
- [ ] Given `quantity >= 2 AND quantity <= 6`, when total selected = 7, then step is NOT satisfied (upper bound fails) — this is the newly fixed case
- [ ] Given only `quantity >= 2` (no second condition), when total = 7, then step IS satisfied (existing behaviour preserved)

---

### Story 6: Limit message is meaningful when both conditions block

**As a** shopper
**I want** to see a clear message about the allowed range when my action is blocked
**So that** I understand what quantity the step requires

**Acceptance Criteria:**
- [ ] Given `quantity >= 2 AND quantity <= 6`, when blocked by the upper-bound condition, the `limitText` communicates the cap (e.g. "at most 6") — the second condition's operator drives the message
- [ ] Given only a single condition, limit text behaviour is unchanged from today

---

## UI/UX Specifications

### No new components
All changes use the existing admin UI components. The condition rule section already renders a list of `Condition #N` cards with Type, Operator, and Value selectors.

### "Add Rule" button — info toast on limit
```
// Existing button — onClick guard triggers toast instead of disabling
<Button
  variant="tertiary"
  fullWidth
  icon={PlusIcon}
  onClick={() => {
    if ((conditionsState.stepConditions[step.id] || []).length >= 2) {
      shopify.toast.show("A step can have at most 2 conditions", { isError: false });
      return;
    }
    conditionsState.addConditionRule(step.id);
  }}
>
  Add Rule
</Button>
```

### Condition card labels (unchanged)
- Card header: "Condition #1", "Condition #2"
- Selectors: "Condition Type", "Operator", "Value" — unchanged
- "Remove" button — unchanged

### Recommended use pattern (admin help text — optional, no code change needed now)
Merchants naturally use:
- Rule #1: `Quantity >= 2` (lower bound)
- Rule #2: `Quantity <= 6` (upper bound)

The existing Type → Operator → Value layout supports this without any label changes.

---

## Data Persistence

### New DB columns (Prisma `Step` model)
| Column | Type | Nullable | Notes |
|--------|------|----------|-------|
| `conditionOperator2` | `String` | Yes | Second condition operator (`equal_to`, `greater_than`, etc.) |
| `conditionValue2` | `Int` | Yes | Second condition threshold value |

No `conditionType2` — the condition type (`quantity`/`amount`) is shared across both conditions on a step.

### Save flow (both configure route handlers)
```
stepConditions[step.id] = [rule0, rule1]  // array from UI

conditionType:     rule0.type     || null
conditionOperator: rule0.operator || null
conditionValue:    parseInt(rule0.value) || null

conditionOperator2: rule1?.operator || null
conditionValue2:    parseInt(rule1?.value) || null
```

### Load flow (`useBundleConfigurationState`)
```
// Existing (unchanged):
if (step.conditionType && step.conditionOperator && step.conditionValue != null) {
  conditions = [{ type, operator, value }]
}

// New: append second condition if present
if (step.conditionOperator2 && step.conditionValue2 != null) {
  conditions.push({ type: step.conditionType, operator: step.conditionOperator2, value: step.conditionValue2 })
}
```

### API response shape
Both `api.bundle.$bundleId.json` and `api.bundles.json` step objects must include:
```json
{
  "conditionType": "quantity",
  "conditionOperator": "greater_than_or_equal_to",
  "conditionValue": 2,
  "conditionOperator2": "less_than_or_equal_to",
  "conditionValue2": 6
}
```

### ConditionValidator step object shape (widget)
```js
{
  conditionType:      'quantity',
  conditionOperator:  'greater_than_or_equal_to',
  conditionValue:     2,
  conditionOperator2: 'less_than_or_equal_to',   // new — may be null/undefined
  conditionValue2:    6                           // new — may be null/undefined
}
```

---

## Backward Compatibility Requirements

- All existing steps with a single condition continue to work exactly as before — `conditionOperator2 / conditionValue2` are `NULL`, and `ConditionValidator` treats missing/null second condition as "no constraint"
- No data migration is required — new columns default to `NULL`
- `conditionType` continues to serve as the existence guard for the first condition; `conditionOperator2 != null && conditionValue2 != null` serves as the guard for the second

---

## Out of Scope (Explicit)

- More than 2 conditions per step
- Mixing condition types per step (e.g. Condition #1 = Quantity, Condition #2 = Amount) — both conditions share the same type
- New UI components, labels, or help text beyond disabling the "Add Rule" button at 2 rules
- Cart-transform Rust/WASM enforcement (storefront JS widget only)
- Pricing rule conditions (`BundlePricingRule.condition`) — separate system, unrelated
