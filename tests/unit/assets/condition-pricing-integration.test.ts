/**
 * Integration Tests — Step Conditions (ConditionValidator) + Discount Conditions (PricingCalculator)
 *
 * Tests that the two condition systems cooperate correctly in realistic
 * multi-step bundle + tiered-pricing scenarios.
 *
 * ConditionValidator governs: "Can the customer add/adjust a product in this step?"
 * PricingCalculator governs: "What discount applies given current totals?"
 *
 * Both systems are independent (separate functions, separate state), but must
 * produce consistent, coherent results when used together. These tests verify
 * end-to-end correctness of the combined flow.
 *
 * All price values are in CENTS.
 */

export {};

// eslint-disable-next-line @typescript-eslint/no-require-imports
const ConditionValidator = require('../../../app/assets/widgets/shared/condition-validator.js');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PricingCalculator } = require('../../../app/assets/widgets/shared/pricing-calculator.js');

const { canUpdateQuantity, isStepConditionSatisfied } = ConditionValidator;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Build a single-condition step (for standard ranges like GTE 3).
 */
function makeStep(operator: string, value: number) {
  return { conditionType: 'quantity', conditionOperator: operator, conditionValue: value };
}

/**
 * Build a two-condition step (e.g. "between 2 and 5").
 */
function makeStep2(op1: string, val1: number, op2: string, val2: number) {
  return {
    conditionType: 'quantity',
    conditionOperator: op1,
    conditionValue: val1,
    conditionOperator2: op2,
    conditionValue2: val2,
  };
}

function makeBundle(rules: any[]) {
  return { pricing: { enabled: true, rules } };
}

function makeQtyRule(operator: string, value: number, method: string, discountValue: number) {
  return {
    condition: { type: 'quantity', operator, value },
    discount:  { method, value: discountValue },
  };
}

function makeAmtRule(operator: string, value: number, method: string, discountValue: number) {
  return {
    condition: { type: 'amount', operator, value },
    discount:  { method, value: discountValue },
  };
}

// ─── Scenario 1: Range-bound step + tiered pricing ────────────────────────────

describe('Integration: range-bound step (GTE 2 AND LTE 5) + tiered pricing', () => {
  /**
   * Step condition: quantity >= 2 AND quantity <= 5
   * Pricing rules:
   *   Tier 1: qty >= 2 → 10% off
   *   Tier 2: qty >= 4 → 20% off
   * Products each cost 1000 cents ($10)
   */
  const step = makeStep2('greater_than_or_equal_to', 2, 'less_than_or_equal_to', 5);
  const bundle = makeBundle([
    makeQtyRule('gte', 2, 'percentage_off', 10),
    makeQtyRule('gte', 4, 'percentage_off', 20),
  ]);

  it('qty=1 — step NOT satisfied (fails GTE 2), no discount applies', () => {
    const selections = { A: 1 };
    expect(isStepConditionSatisfied(step, selections)).toBe(false);

    const result = PricingCalculator.calculateDiscount(bundle, 1000, 1);
    expect(result.hasDiscount).toBe(false);
  });

  it('qty=2 — step satisfied (2>=2 AND 2<=5), tier-1 discount (10%)', () => {
    const selections = { A: 2 };
    expect(isStepConditionSatisfied(step, selections)).toBe(true);

    const result = PricingCalculator.calculateDiscount(bundle, 2000, 2);
    expect(result.hasDiscount).toBe(true);
    expect(result.discountAmount).toBe(200);     // 10% of 2000
    expect(result.finalPrice).toBe(1800);
    expect(result.applicableRule.condition.value).toBe(2);
  });

  it('qty=3 — step satisfied, tier-1 discount (10%, tier-2 needs 4)', () => {
    const selections = { A: 3 };
    expect(isStepConditionSatisfied(step, selections)).toBe(true);

    const result = PricingCalculator.calculateDiscount(bundle, 3000, 3);
    expect(result.discountAmount).toBe(300);     // 10% of 3000
    expect(result.applicableRule.condition.value).toBe(2);
  });

  it('qty=4 — step satisfied, tier-2 discount (20%, best of tiers 1+2)', () => {
    const selections = { A: 4 };
    expect(isStepConditionSatisfied(step, selections)).toBe(true);

    const result = PricingCalculator.calculateDiscount(bundle, 4000, 4);
    expect(result.discountAmount).toBe(800);     // 20% of 4000
    expect(result.finalPrice).toBe(3200);
    expect(result.applicableRule.condition.value).toBe(4);
  });

  it('qty=5 — step satisfied (5<=5), tier-2 discount (20%)', () => {
    const selections = { A: 5 };
    expect(isStepConditionSatisfied(step, selections)).toBe(true);

    const result = PricingCalculator.calculateDiscount(bundle, 5000, 5);
    expect(result.discountAmount).toBe(1000);    // 20% of 5000
    expect(result.applicableRule.condition.value).toBe(4);
  });

  it('qty=6 — step NOT satisfied (fails LTE 5), discount irrelevant', () => {
    const selections = { A: 6 };
    expect(isStepConditionSatisfied(step, selections)).toBe(false);
    // The step is incomplete; bundle shouldn't proceed to checkout
  });
});

// ─── Scenario 2: canUpdateQuantity enforces the upper bound ──────────────────

describe('Integration: canUpdateQuantity prevents breaching LTE bound', () => {
  const step = makeStep2('greater_than_or_equal_to', 2, 'less_than_or_equal_to', 5);

  it('allows adding first item (qty 0→1, total becomes 1)', () => {
    expect(canUpdateQuantity(step, {}, 'A', 1).allowed).toBe(true);
  });

  it('allows adding to reach lower bound (qty 1→2, total becomes 2)', () => {
    const selections = { A: 1 };
    expect(canUpdateQuantity(step, selections, 'A', 2).allowed).toBe(true);
  });

  it('allows adding up to upper bound exactly (total=5 is still ok)', () => {
    const selections = { A: 3, B: 1 };
    // Updating B from 1 to 2 → total = 3+2 = 5
    expect(canUpdateQuantity(step, selections, 'B', 2).allowed).toBe(true);
  });

  it('blocks going one over the upper bound (total becomes 6)', () => {
    const selections = { A: 3, B: 2 }; // currently at max (5)
    // Trying to increase A to 4: total = 4+2 = 6 > 5 → blocked
    const result = canUpdateQuantity(step, selections, 'A', 4);
    expect(result.allowed).toBe(false);
  });

  it('blocks adding a new product when already at upper bound', () => {
    const selections = { A: 5 }; // already at LTE 5 limit
    // Adding B (new) for 1: total = 5+1 = 6 → blocked
    const result = canUpdateQuantity(step, selections, 'B', 1);
    expect(result.allowed).toBe(false);
  });

  it('allows decreasing quantity from over to within the range', () => {
    // This tests that the GTE lower-bound does NOT block decreases
    // (canUpdateQuantity for GTE returns allowed:true, so only LTE matters here)
    const selections = { A: 5 };
    // Decreasing A to 4: total = 4 — within [2,5]
    expect(canUpdateQuantity(step, selections, 'A', 4).allowed).toBe(true);
  });

  it('removing product below lower bound is allowed by canUpdateQuantity (GTE does not block decreases)', () => {
    // GTE conditions only affect increases (see _evaluateCanUpdate logic).
    // Decreasing below the lower bound is allowed at the UI level;
    // isStepConditionSatisfied will handle the gate at submit.
    const selections = { A: 3 };
    // Decreasing A to 1: total = 1 — below GTE 2, but canUpdateQuantity allows it
    expect(canUpdateQuantity(step, selections, 'A', 1).allowed).toBe(true);
    // However, step is not satisfied at qty=1
    expect(isStepConditionSatisfied(step, { A: 1 })).toBe(false);
  });
});

// ─── Scenario 3: GTE-only step + tiered pricing (no upper bound) ─────────────

describe('Integration: GTE-only step with tiered pricing (no upper cap)', () => {
  /**
   * Step condition: quantity >= 3 (no upper bound)
   * Pricing: qty >= 3 (15% off), qty >= 6 (25% off)
   */
  const step = makeStep('greater_than_or_equal_to', 3);
  const bundle = makeBundle([
    makeQtyRule('gte', 3, 'percentage_off', 15),
    makeQtyRule('gte', 6, 'percentage_off', 25),
  ]);

  it('qty=2 — step not satisfied, canUpdate blocked by GTE-only? No — GTE never blocks increases', () => {
    // GTE conditions only block when an upper-bound would be violated.
    // With only a lower-bound, adding items is always allowed by canUpdateQuantity.
    expect(canUpdateQuantity(step, { A: 2 }, 'A', 3).allowed).toBe(true);
    // But step not satisfied yet:
    expect(isStepConditionSatisfied(step, { A: 2 })).toBe(false);
  });

  it('qty=3 — step satisfied, 15% discount', () => {
    expect(isStepConditionSatisfied(step, { A: 3 })).toBe(true);
    const result = PricingCalculator.calculateDiscount(bundle, 3000, 3);
    expect(result.discountAmount).toBe(450);    // 15% of 3000
  });

  it('qty=6 — step satisfied, 25% discount (best rule)', () => {
    expect(isStepConditionSatisfied(step, { A: 6 })).toBe(true);
    const result = PricingCalculator.calculateDiscount(bundle, 6000, 6);
    expect(result.discountAmount).toBe(1500);   // 25% of 6000
  });

  it('qty=10 — no upper bound, adding more items still allowed', () => {
    expect(canUpdateQuantity(step, { A: 10 }, 'A', 11).allowed).toBe(true);
    expect(isStepConditionSatisfied(step, { A: 10 })).toBe(true);
  });
});

// ─── Scenario 4: Amount-based discount with quantity step condition ───────────

describe('Integration: quantity step condition + amount-based discount rule', () => {
  /**
   * Step condition: quantity >= 2 (minimum 2 items)
   * Pricing: amount >= 5000 (≥$50) → 10% off
   *
   * This verifies the two condition types (qty for step, amount for discount)
   * cooperate correctly: step gate uses qty, discount gate uses amount.
   */
  const step = makeStep('greater_than_or_equal_to', 2);
  const bundle = makeBundle([makeAmtRule('gte', 5000, 'percentage_off', 10)]);

  it('qty=2, price=$30 — step satisfied but amount threshold not met → no discount', () => {
    expect(isStepConditionSatisfied(step, { A: 2 })).toBe(true);
    const result = PricingCalculator.calculateDiscount(bundle, 3000, 2);
    expect(result.hasDiscount).toBe(false);
  });

  it('qty=1, price=$60 — amount threshold met but step NOT satisfied', () => {
    expect(isStepConditionSatisfied(step, { A: 1 })).toBe(false);
    // Discount would apply based on price alone, but step gate prevents checkout
    const result = PricingCalculator.calculateDiscount(bundle, 6000, 1);
    expect(result.hasDiscount).toBe(true);  // PricingCalculator is unaware of step state
  });

  it('qty=2, price=$50 — both conditions met → discount applies', () => {
    expect(isStepConditionSatisfied(step, { A: 2 })).toBe(true);
    const result = PricingCalculator.calculateDiscount(bundle, 5000, 2);
    expect(result.hasDiscount).toBe(true);
    expect(result.discountAmount).toBe(500);   // 10% of 5000
    expect(result.finalPrice).toBe(4500);
  });

  it('qty=3, price=$80 — both conditions met → discount applies', () => {
    expect(isStepConditionSatisfied(step, { A: 3 })).toBe(true);
    const result = PricingCalculator.calculateDiscount(bundle, 8000, 3);
    expect(result.discountAmount).toBe(800);   // 10% of 8000
  });
});

// ─── Scenario 5: getNextDiscountRule used to show progress messaging ──────────

describe('Integration: getNextDiscountRule + step satisfaction for progress messaging', () => {
  /**
   * Simulates the UX pattern where the widget shows "Add N more items to unlock 20% off".
   * Step condition: qty >= 1 (any selection)
   * Pricing tiers: qty >= 3 (10% off), qty >= 5 (20% off)
   */
  const step = makeStep('greater_than_or_equal_to', 1);
  const bundle = makeBundle([
    makeQtyRule('gte', 3, 'percentage_off', 10),
    makeQtyRule('gte', 5, 'percentage_off', 20),
  ]);

  it('qty=1 — step done, no current discount, next target is qty>=3', () => {
    expect(isStepConditionSatisfied(step, { A: 1 })).toBe(true);
    expect(PricingCalculator.calculateDiscount(bundle, 1000, 1).hasDiscount).toBe(false);
    const next = PricingCalculator.getNextDiscountRule(bundle, 1, 1000);
    expect(next.condition.value).toBe(3);
  });

  it('qty=3 — step done, 10% discount, next target is qty>=5', () => {
    expect(isStepConditionSatisfied(step, { A: 3 })).toBe(true);
    const result = PricingCalculator.calculateDiscount(bundle, 3000, 3);
    expect(result.hasDiscount).toBe(true);
    expect(result.discountAmount).toBe(300);

    const next = PricingCalculator.getNextDiscountRule(bundle, 3, 3000);
    expect(next.condition.value).toBe(5);
  });

  it('qty=5 — step done, 20% discount, all tiers unlocked → no next rule', () => {
    expect(isStepConditionSatisfied(step, { A: 5 })).toBe(true);
    const result = PricingCalculator.calculateDiscount(bundle, 5000, 5);
    expect(result.discountAmount).toBe(1000);   // 20% of 5000

    const next = PricingCalculator.getNextDiscountRule(bundle, 5, 5000);
    expect(next).toBeNull();
  });
});

// ─── Scenario 6: fixed_bundle_price + multi-condition step ───────────────────

describe('Integration: fixed_bundle_price discount + two-condition step', () => {
  /**
   * Step condition: qty >= 3 AND qty <= 5 (a fixed-size bundle)
   * Pricing: qty >= 3 → fixed price $25 (2500 cents), product price $10 each (1000 cents)
   */
  const step = makeStep2('greater_than_or_equal_to', 3, 'less_than_or_equal_to', 5);
  const bundle = makeBundle([makeQtyRule('gte', 3, 'fixed_bundle_price', 2500)]);

  it('qty=3 — step satisfied, fixed price $25, discount = $30 - $25 = $5', () => {
    expect(isStepConditionSatisfied(step, { A: 3 })).toBe(true);
    // totalPrice = 3 * 1000 = 3000
    const result = PricingCalculator.calculateDiscount(bundle, 3000, 3);
    expect(result.hasDiscount).toBe(true);
    expect(result.discountAmount).toBe(500);    // 3000 - 2500
    expect(result.finalPrice).toBe(2500);
  });

  it('qty=5 — step satisfied (boundary), fixed price applied', () => {
    expect(isStepConditionSatisfied(step, { A: 5 })).toBe(true);
    const result = PricingCalculator.calculateDiscount(bundle, 5000, 5);
    expect(result.discountAmount).toBe(2500);   // 5000 - 2500
    expect(result.finalPrice).toBe(2500);
  });

  it('qty=6 — step NOT satisfied (exceeds LTE 5), canUpdateQuantity blocks it', () => {
    const selections = { A: 5 };
    const updateResult = canUpdateQuantity(step, selections, 'A', 6);
    expect(updateResult.allowed).toBe(false);
    expect(isStepConditionSatisfied(step, { A: 6 })).toBe(false);
  });

  it('qty=2 — step NOT satisfied (below GTE 3)', () => {
    expect(isStepConditionSatisfied(step, { A: 2 })).toBe(false);
    // Discount condition also not met:
    const result = PricingCalculator.calculateDiscount(bundle, 2000, 2);
    expect(result.hasDiscount).toBe(false);
  });
});

// ─── Scenario 7: Multi-product selections across one step ────────────────────

describe('Integration: multi-product step selections + pricing', () => {
  /**
   * Step allows mix-and-match. Two products A ($10) and B ($15).
   * Step condition: qty >= 3 (total across all products)
   * Pricing: qty >= 3 → 10% off
   */
  const step = makeStep('greater_than_or_equal_to', 3);
  const bundle = makeBundle([makeQtyRule('gte', 3, 'percentage_off', 10)]);

  it('A=1, B=1 → total=2, step not satisfied', () => {
    const selections = { A: 1, B: 1 };
    expect(isStepConditionSatisfied(step, selections)).toBe(false);
    expect(PricingCalculator.calculateDiscount(bundle, 2500, 2).hasDiscount).toBe(false);
  });

  it('A=2, B=1 → total=3, step satisfied, 10% off $35 = $3.50 (350 cents)', () => {
    const selections = { A: 2, B: 1 };
    expect(isStepConditionSatisfied(step, selections)).toBe(true);
    // totalPrice = 2*1000 + 1*1500 = 3500
    const result = PricingCalculator.calculateDiscount(bundle, 3500, 3);
    expect(result.hasDiscount).toBe(true);
    expect(result.discountAmount).toBe(350);
    expect(result.finalPrice).toBe(3150);
  });

  it('adding a new product C to an already-max step is blocked', () => {
    const stepBounded = makeStep2('greater_than_or_equal_to', 3, 'less_than_or_equal_to', 3);
    const selections = { A: 2, B: 1 }; // exactly at max
    const result = canUpdateQuantity(stepBounded, selections, 'C', 1); // would be 4
    expect(result.allowed).toBe(false);
  });
});
