# Test Spec: Discount & Pricing Parity — Flat PricingRule Parser
**Spec ID:** discount-pricing-parity  **Issue:** [eb-configure-sections-parity-1]  **Created:** 2026-05-25

## Purpose

Verify that `parsePricingRule` and `parsePricingConfiguration` in `app/lib/pricing-rule-parser.ts`
correctly parse, validate, and coerce raw DB JSON into the new flat `PricingRule` shape.

Also covers `migrateNestedRule` — the one-time converter used by the data migration script to
transform existing nested `{ condition, discount }` DB records into the flat format.

## Test Cases

### parsePricingRule — valid flat format

| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Quantity rule, percentage | `{ id: "r1", conditionType: "quantity", conditionValue: 2, discountValue: 10 }` | `{ id: "r1", conditionType: "quantity", conditionValue: 2, discountValue: 10 }` | Minimal valid flat rule |
| 2 | Amount rule, fixed | `{ id: "r2", conditionType: "amount", conditionValue: 5000, discountValue: 500 }` | conditionType "amount", conditionValue 5000 | Amount threshold in cents |
| 3 | BXY rule all fields | `{ id: "r3", conditionType: "quantity", conditionValue: 2, discountValue: 100, customerBuys: 2, customerGets: 1, bxyDiscountType: "percentage", bxyApplyMode: "lowest_priced" }` | All BXY fields returned | |
| 4 | BXY rule minimum (no applyMode) | `{ id: "r4", conditionType: "quantity", conditionValue: 3, discountValue: 50, customerBuys: 3, customerGets: 1, bxyDiscountType: "fixed_amount" }` | `bxyApplyMode` absent | Optional fields omitted |
| 5 | Numeric strings coerced | `{ id: "r5", conditionType: "quantity", conditionValue: "3", discountValue: "20" }` | `conditionValue: 3, discountValue: 20` | Strings → numbers |

### parsePricingRule — invalid / missing fields

| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 6 | Missing id | `{ conditionType: "quantity", conditionValue: 2, discountValue: 10 }` | throws or returns null | id is required |
| 7 | Invalid conditionType | `{ id: "r7", conditionType: "items", conditionValue: 2, discountValue: 5 }` | throws or returns null | Only "quantity" or "amount" |
| 8 | Negative conditionValue | `{ id: "r8", conditionType: "quantity", conditionValue: -1, discountValue: 10 }` | throws or returns null | Must be ≥ 0 |
| 9 | discountValue > 100 for percentage | Not the parser's responsibility — handled by validator | — | Parser is permissive on value range |
| 10 | Null input | `null` | throws or returns null | |
| 11 | Non-object input | `"foo"` | throws or returns null | |

### migrateNestedRule — converts old nested shape to flat

| # | Scenario | Input (nested) | Expected flat Output | Notes |
|---|---|---|---|---|
| 12 | Percentage quantity rule | `{ id: "r1", condition: { type: "quantity", operator: "gte", value: 3 }, discount: { method: "percentage_off", value: 15 } }` | `{ id: "r1", conditionType: "quantity", conditionValue: 3, discountValue: 15 }` | operator dropped |
| 13 | Amount fixed rule | `{ id: "r2", condition: { type: "amount", operator: "gte", value: 10000 }, discount: { method: "fixed_amount_off", value: 500 } }` | `{ id: "r2", conditionType: "amount", conditionValue: 10000, discountValue: 500 }` | |
| 14 | BXY nested rule | `{ id: "r3", condition: { type: "quantity", operator: "gte", value: 2 }, discount: { method: "buy_x_get_y", value: 0 }, getQty: 1, buyStepId: "step-1", getStepId: "step-2" }` | `{ id: "r3", conditionType: "quantity", conditionValue: 2, discountValue: 0, customerBuys: 2, customerGets: 1 }` | buyStepId/getStepId dropped |
| 15 | Already flat (no-op path) | `{ id: "r4", conditionType: "quantity", conditionValue: 2, discountValue: 10 }` | Same as input | Pass-through for already-migrated data |
| 16 | discountValue fallback | `{ id: "r5", condition: { type: "quantity", operator: "gte", value: 2 }, discountValue: 20 }` | `conditionValue: 2, discountValue: 20` | Old form sometimes has top-level discountValue |

### parsePricingConfiguration — happy path

| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 17 | Enabled config, 2 flat rules | `{ enabled: true, method: "percentage_off", rules: [...2 valid flat rules...], display: { showFooter: true, showDiscountProgressBar: false }, messages: { progress: "...", qualified: "...", showInCart: true } }` | All fields returned as-is | |
| 18 | Disabled config | `{ enabled: false, method: "percentage_off", rules: [] }` | `enabled: false` | Empty rules ok |
| 19 | Messages with tierTextByRuleId | `{ ..., messages: { ..., tierTextByRuleId: { "r1": { tierText: "Add 3", tierSubtext: "1 at 100% off" } } } }` | `tierTextByRuleId` preserved | Progress Bar tier text |
| 20 | Messages with tierTextByLocaleByRuleId | Multi-locale tier text present | Preserved as-is | Multi Language modal data |

## Acceptance Criteria
- [ ] All 20 test cases defined above pass
- [ ] `parsePricingRule` exported from `app/lib/pricing-rule-parser.ts`
- [ ] `migrateNestedRule` exported from `app/lib/pricing-rule-parser.ts`
- [ ] `parsePricingConfiguration` exported from `app/lib/pricing-rule-parser.ts`
- [ ] No TypeScript errors
- [ ] ESLint: 0 new errors
