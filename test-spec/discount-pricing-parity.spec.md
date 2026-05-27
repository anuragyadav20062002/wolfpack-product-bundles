# Test Spec: Discount & Pricing Parity - Rules And Admin UI Contract
**Spec ID:** discount-pricing-parity  **Issue:** [eb-configure-sections-parity-1]  **Created:** 2026-05-25

## Purpose

Verify that `parsePricingRule` and `parsePricingConfiguration` in `app/lib/pricing-rule-parser.ts`
correctly parse, validate, and coerce raw DB JSON into the flat `PricingRule` shape.

Also covers `migrateNestedRule` - the existing converter used by the data migration script to
transform existing nested `{ condition, discount }` DB records into the flat format.

This corrective parity session additionally verifies the FPB and PPB Discount & Pricing route
source contract against the live EB controls captured on 2026-05-25.

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

### Discount & Pricing route UI contract - FPB and PPB

| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 21 | Progress mode labels | Both configure route sources | `Simple Bar` and `Step-Based Bar` are rendered; Simple Bar text inputs are not rendered | Confirmed live in FPB and PPB |
| 22 | Buy X, get Y controls | Both configure route sources | `% off`, `₹ off`, `The lowest priced items`, `The latest added items` | Exact live copy |
| 23 | Type change default rule | Both configure route sources | Changing discount type creates one rule of the selected type | Live change does not leave empty rules |
| 24 | Discount messaging notice | Both configure route sources | Full Buy X, get Y information notice is rendered independently of messaging-enabled content | Visible while messaging is off |
| 25 | Message variable modal | Both configure route sources | Addressable modal target, heading `Variables`, confirmed five discount variables, no primary save/footer action, and native close dismisses it | Live modal is close-only |
| 26 | Bundle Quantity Options modal | Both configure route sources | An addressable `Customize Text for Multiple Languages` modal can render `Select Language`, `Box Label`, `Box Subtext`, and `Save and close` | Existing route previously had no BQO modal |
| 27 | Display-option order | Both configure route sources | Bundle Quantity Options before Progress Bar before Discount Messaging | Matches live visual order |
| 28 | Rule and display state styling | Both configure route sources | Adjacent rule/remove header and zero-rule muted display options styling hook | Visual verification remains required |
| 29 | Discount type labels/order | Shared discount method options | `Fixed Amount Off`, `Percentage Off`, `Fixed Bundle Price`, `Buy X, get Y` in order | Confirmed live select copy |

### Default rule creation after discount-type change

| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 30 | Percentage default | `createNewPricingRule(PERCENTAGE_OFF)` | Quantity `2`, discount `5` | Live type-switch default |
| 31 | Fixed amount default | `createNewPricingRule(FIXED_AMOUNT_OFF)` | Quantity `2`, discount `500` cents | Renders currency value `5` |
| 32 | Fixed bundle price default | `createNewPricingRule(FIXED_BUNDLE_PRICE)` | Product count `2`, price `500` cents | Renders currency value `5` |
| 33 | Buy X, get Y default | `createNewPricingRule(BUY_X_GET_Y)` | Buys `2`, gets `1`, discount `100`, lowest-priced apply mode | Live initial offer |

### Message template defaults

| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 34 | Buy X, get Y default message | `normalizePricingRuleMessages({ method: BUY_X_GET_Y, rules: [rule], messages: {} })` | BXY `Discount Text` and `Success Message` templates | Ensures FPB type switch uses live BXY copy |

## Acceptance Criteria
- [ ] All parser test cases defined above pass
- [ ] Route UI contract assertions for cases 21-29 pass
- [ ] Default-rule assertions for cases 30-33 pass
- [ ] Message-template assertion for case 34 passes
- [ ] `parsePricingRule` exported from `app/lib/pricing-rule-parser.ts`
- [ ] `migrateNestedRule` exported from `app/lib/pricing-rule-parser.ts`
- [ ] `parsePricingConfiguration` exported from `app/lib/pricing-rule-parser.ts`
- [ ] No TypeScript errors
- [ ] ESLint: 0 new errors
