/**
 * Unit Tests — PricingCalculator
 *
 * Covers every code path in app/assets/widgets/shared/pricing-calculator.js
 *
 * The three public API functions under test:
 *  - normalizeCondition: short/long/alias operator mapping + fallbacks
 *  - checkCondition:     all 5 operators × boundary values, accepts short format
 *  - calculateDiscount:  all 3 discount methods × both condition types, best-rule
 *                        selection, disabled/empty cases, edge cases
 *  - getNextDiscountRule: first unsatisfied rule returned, all satisfied → null
 *
 * Zero-tolerance: any silent regression here costs merchants real revenue.
 *
 * All price/amount values are in CENTS (e.g. $10.00 = 1000).
 */

export {};

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PricingCalculator } = require('../../../app/assets/widgets/shared/pricing-calculator.js');

// ─── Operator Constants (long-format, as returned by normalizeCondition) ─────

const EQ  = 'equal_to';
const GT  = 'greater_than';
const LT  = 'less_than';
const GTE = 'greater_than_or_equal_to';
const LTE = 'less_than_or_equal_to';

// ─── Bundle Builders ──────────────────────────────────────────────────────────

function makeBundle(enabled: boolean, rules: any[]) {
  return { pricing: { enabled, rules } };
}

function makeQtyRule(operator: string, value: number, method: string, discountValue: number) {
  return {
    condition: { type: 'quantity', operator, value },
    discount:  { method, value: discountValue }
  };
}

function makeAmtRule(operator: string, value: number, method: string, discountValue: number) {
  return {
    condition: { type: 'amount', operator, value },
    discount:  { method, value: discountValue }
  };
}

// ─── normalizeCondition ───────────────────────────────────────────────────────

describe('PricingCalculator.normalizeCondition', () => {
  // Short-format aliases
  it('maps gte → greater_than_or_equal_to', () => {
    expect(PricingCalculator.normalizeCondition('gte')).toBe(GTE);
  });
  it('maps gt → greater_than', () => {
    expect(PricingCalculator.normalizeCondition('gt')).toBe(GT);
  });
  it('maps lte → less_than_or_equal_to', () => {
    expect(PricingCalculator.normalizeCondition('lte')).toBe(LTE);
  });
  it('maps lt → less_than', () => {
    expect(PricingCalculator.normalizeCondition('lt')).toBe(LT);
  });
  it('maps eq → equal_to', () => {
    expect(PricingCalculator.normalizeCondition('eq')).toBe(EQ);
  });

  // Long-format passthrough
  it('passes through equal_to unchanged', () => {
    expect(PricingCalculator.normalizeCondition('equal_to')).toBe(EQ);
  });
  it('passes through greater_than unchanged', () => {
    expect(PricingCalculator.normalizeCondition('greater_than')).toBe(GT);
  });
  it('passes through less_than unchanged', () => {
    expect(PricingCalculator.normalizeCondition('less_than')).toBe(LT);
  });
  it('passes through greater_than_or_equal_to unchanged', () => {
    expect(PricingCalculator.normalizeCondition('greater_than_or_equal_to')).toBe(GTE);
  });
  it('passes through less_than_or_equal_to unchanged', () => {
    expect(PricingCalculator.normalizeCondition('less_than_or_equal_to')).toBe(LTE);
  });

  // Underscore aliases (without _or_)
  it('maps greater_than_equal_to → greater_than_or_equal_to', () => {
    expect(PricingCalculator.normalizeCondition('greater_than_equal_to')).toBe(GTE);
  });
  it('maps less_than_equal_to → less_than_or_equal_to', () => {
    expect(PricingCalculator.normalizeCondition('less_than_equal_to')).toBe(LTE);
  });

  // Fallbacks
  it('returns greater_than_or_equal_to for null', () => {
    expect(PricingCalculator.normalizeCondition(null)).toBe(GTE);
  });
  it('returns greater_than_or_equal_to for undefined', () => {
    expect(PricingCalculator.normalizeCondition(undefined)).toBe(GTE);
  });
  it('returns unknown string as-is (no map match → falls back to the string itself)', () => {
    expect(PricingCalculator.normalizeCondition('foo')).toBe('foo');
  });
});

// ─── checkCondition ───────────────────────────────────────────────────────────

describe('PricingCalculator.checkCondition', () => {
  // equal_to
  describe('equal_to / eq (threshold: >= semantics for discount rules)', () => {
    it('true when value exactly equals target', () => {
      expect(PricingCalculator.checkCondition(5, EQ, 5)).toBe(true);
    });
    it('false when value is one below target', () => {
      expect(PricingCalculator.checkCondition(4, EQ, 5)).toBe(false);
    });
    it('true when value is above target (threshold behavior)', () => {
      // For discount pricing rules, "equal to N" means "at N or more"
      // so buying 6 when condition is "equal to 5" still qualifies
      expect(PricingCalculator.checkCondition(6, EQ, 5)).toBe(true);
    });
    it('accepts short operator eq', () => {
      expect(PricingCalculator.checkCondition(3, 'eq', 3)).toBe(true);
      // Above threshold also qualifies
      expect(PricingCalculator.checkCondition(4, 'eq', 3)).toBe(true);
    });
  });

  // greater_than
  describe('greater_than / gt', () => {
    it('false at boundary (strict inequality)', () => {
      expect(PricingCalculator.checkCondition(5, GT, 5)).toBe(false);
    });
    it('true when one above boundary', () => {
      expect(PricingCalculator.checkCondition(6, GT, 5)).toBe(true);
    });
    it('false when one below boundary', () => {
      expect(PricingCalculator.checkCondition(4, GT, 5)).toBe(false);
    });
    it('accepts short operator gt', () => {
      expect(PricingCalculator.checkCondition(6, 'gt', 5)).toBe(true);
      expect(PricingCalculator.checkCondition(5, 'gt', 5)).toBe(false);
    });
  });

  // less_than
  describe('less_than / lt', () => {
    it('false at boundary (strict inequality)', () => {
      expect(PricingCalculator.checkCondition(5, LT, 5)).toBe(false);
    });
    it('true when one below boundary', () => {
      expect(PricingCalculator.checkCondition(4, LT, 5)).toBe(true);
    });
    it('false when one above boundary', () => {
      expect(PricingCalculator.checkCondition(6, LT, 5)).toBe(false);
    });
    it('accepts short operator lt', () => {
      expect(PricingCalculator.checkCondition(4, 'lt', 5)).toBe(true);
      expect(PricingCalculator.checkCondition(5, 'lt', 5)).toBe(false);
    });
  });

  // greater_than_or_equal_to
  describe('greater_than_or_equal_to / gte', () => {
    it('true at boundary', () => {
      expect(PricingCalculator.checkCondition(5, GTE, 5)).toBe(true);
    });
    it('true above boundary', () => {
      expect(PricingCalculator.checkCondition(6, GTE, 5)).toBe(true);
    });
    it('false below boundary', () => {
      expect(PricingCalculator.checkCondition(4, GTE, 5)).toBe(false);
    });
    it('accepts short operator gte', () => {
      expect(PricingCalculator.checkCondition(5, 'gte', 5)).toBe(true);
      expect(PricingCalculator.checkCondition(4, 'gte', 5)).toBe(false);
    });
  });

  // less_than_or_equal_to
  describe('less_than_or_equal_to / lte', () => {
    it('true at boundary', () => {
      expect(PricingCalculator.checkCondition(5, LTE, 5)).toBe(true);
    });
    it('true below boundary', () => {
      expect(PricingCalculator.checkCondition(4, LTE, 5)).toBe(true);
    });
    it('false above boundary', () => {
      expect(PricingCalculator.checkCondition(6, LTE, 5)).toBe(false);
    });
    it('accepts short operator lte', () => {
      expect(PricingCalculator.checkCondition(5, 'lte', 5)).toBe(true);
      expect(PricingCalculator.checkCondition(6, 'lte', 5)).toBe(false);
    });
  });

  // Unknown operator fallback
  it('unknown operator falls back to >= (backward compatibility)', () => {
    expect(PricingCalculator.checkCondition(5, 'unknown', 5)).toBe(true);
    expect(PricingCalculator.checkCondition(4, 'unknown', 5)).toBe(false);
  });

  // Zero value
  it('handles zero value correctly for gte', () => {
    expect(PricingCalculator.checkCondition(0, GTE, 0)).toBe(true);
    expect(PricingCalculator.checkCondition(0, GTE, 1)).toBe(false);
  });
});

// ─── calculateDiscount — no discount scenarios ────────────────────────────────

describe('PricingCalculator.calculateDiscount — disabled / empty', () => {
  const noDiscount = {
    hasDiscount: false,
    discountAmount: 0,
    discountPercentage: 0,
    qualifiesForDiscount: false,
    applicableRule: null
  };

  it('returns no-discount when pricing is disabled', () => {
    const bundle = makeBundle(false, [makeQtyRule('gte', 1, 'percentage_off', 50)]);
    const result = PricingCalculator.calculateDiscount(bundle, 5000, 5);
    expect(result).toMatchObject(noDiscount);
    expect(result.finalPrice).toBe(5000);
  });

  it('returns no-discount when rules array is empty', () => {
    const bundle = makeBundle(true, []);
    const result = PricingCalculator.calculateDiscount(bundle, 5000, 5);
    expect(result).toMatchObject(noDiscount);
    expect(result.finalPrice).toBe(5000);
  });

  it('returns no-discount when bundle is null', () => {
    const result = PricingCalculator.calculateDiscount(null, 5000, 5);
    expect(result).toMatchObject(noDiscount);
    expect(result.finalPrice).toBe(5000);
  });

  it('returns no-discount when bundle.pricing is null', () => {
    const result = PricingCalculator.calculateDiscount({ pricing: null }, 5000, 5);
    expect(result).toMatchObject(noDiscount);
    expect(result.finalPrice).toBe(5000);
  });

  it('returns no-discount when quantity condition not met', () => {
    const bundle = makeBundle(true, [makeQtyRule('gte', 5, 'percentage_off', 50)]);
    // qty=4 < 5 → condition not met
    const result = PricingCalculator.calculateDiscount(bundle, 4000, 4);
    expect(result).toMatchObject(noDiscount);
    expect(result.finalPrice).toBe(4000);
  });

  it('returns no-discount when amount condition not met', () => {
    const bundle = makeBundle(true, [makeAmtRule('gte', 5000, 'percentage_off', 10)]);
    // totalPrice=4000 < 5000 → condition not met
    const result = PricingCalculator.calculateDiscount(bundle, 4000, 4);
    expect(result).toMatchObject(noDiscount);
    expect(result.finalPrice).toBe(4000);
  });
});

// ─── calculateDiscount — percentage_off ──────────────────────────────────────

describe('PricingCalculator.calculateDiscount — percentage_off', () => {
  it('applies 50% off when quantity GTE condition met', () => {
    const bundle = makeBundle(true, [makeQtyRule('gte', 3, 'percentage_off', 50)]);
    const result = PricingCalculator.calculateDiscount(bundle, 10000, 3);
    expect(result.hasDiscount).toBe(true);
    expect(result.discountAmount).toBe(5000);         // 50% of 10000
    expect(result.finalPrice).toBe(5000);
    expect(result.discountPercentage).toBe(50);
    expect(result.qualifiesForDiscount).toBe(true);
    expect(result.applicableRule).not.toBeNull();
  });

  it('applies 10% off when amount GTE condition met (amount in cents)', () => {
    const bundle = makeBundle(true, [makeAmtRule('gte', 5000, 'percentage_off', 10)]);
    // totalPrice=5000 >= 5000 → condition met
    const result = PricingCalculator.calculateDiscount(bundle, 5000, 5);
    expect(result.hasDiscount).toBe(true);
    expect(result.discountAmount).toBe(500);          // 10% of 5000
    expect(result.finalPrice).toBe(4500);
    expect(result.discountPercentage).toBeCloseTo(10, 5);
  });

  it('rounds discountAmount to nearest integer (no floating point leakage)', () => {
    // 33% of 1000 = 330.0 exactly; confirm no decimal in result
    const bundle = makeBundle(true, [makeQtyRule('gte', 1, 'percentage_off', 33)]);
    const result = PricingCalculator.calculateDiscount(bundle, 1000, 1);
    expect(result.discountAmount).toBe(330);
    expect(Number.isInteger(result.discountAmount)).toBe(true);
  });

  it('handles 100% off (free bundle)', () => {
    const bundle = makeBundle(true, [makeQtyRule('gte', 1, 'percentage_off', 100)]);
    const result = PricingCalculator.calculateDiscount(bundle, 5000, 3);
    expect(result.discountAmount).toBe(5000);
    expect(result.finalPrice).toBe(0);
    expect(result.hasDiscount).toBe(true);
  });

  it('zero totalPrice → discountPercentage is 0, no NaN', () => {
    const bundle = makeBundle(true, [makeQtyRule('gte', 1, 'percentage_off', 50)]);
    const result = PricingCalculator.calculateDiscount(bundle, 0, 3);
    expect(result.discountAmount).toBe(0);
    expect(result.finalPrice).toBe(0);
    expect(result.discountPercentage).toBe(0);
    expect(result.hasDiscount).toBe(false);        // discountAmount === 0
    expect(result.qualifiesForDiscount).toBe(true); // condition was met
  });

  it('accepts short-format operator gte in condition', () => {
    const bundle = makeBundle(true, [makeQtyRule('gte', 2, 'percentage_off', 20)]);
    const result = PricingCalculator.calculateDiscount(bundle, 2000, 2);
    expect(result.hasDiscount).toBe(true);
    expect(result.discountAmount).toBe(400);
  });

  it('accepts long-format operator greater_than_or_equal_to in condition', () => {
    const bundle = makeBundle(true, [makeQtyRule('greater_than_or_equal_to', 2, 'percentage_off', 20)]);
    const result = PricingCalculator.calculateDiscount(bundle, 2000, 2);
    expect(result.hasDiscount).toBe(true);
    expect(result.discountAmount).toBe(400);
  });
});

// ─── calculateDiscount — fixed_amount_off ────────────────────────────────────

describe('PricingCalculator.calculateDiscount — fixed_amount_off', () => {
  it('deducts fixed amount (in cents) from total price', () => {
    // $10 off a $50 bundle (5000 cents) when buying 2+
    const bundle = makeBundle(true, [makeQtyRule('gte', 2, 'fixed_amount_off', 1000)]);
    const result = PricingCalculator.calculateDiscount(bundle, 5000, 2);
    expect(result.hasDiscount).toBe(true);
    expect(result.discountAmount).toBe(1000);
    expect(result.finalPrice).toBe(4000);
    expect(result.discountPercentage).toBeCloseTo(20, 5); // 1000/5000 = 20%
  });

  it('finalPrice is capped at 0 when discount exceeds total price', () => {
    // Discount of $60 on a $50 bundle → finalPrice = 0
    const bundle = makeBundle(true, [makeQtyRule('gte', 1, 'fixed_amount_off', 6000)]);
    const result = PricingCalculator.calculateDiscount(bundle, 5000, 2);
    // discountAmount = 6000 (the stored value), finalPrice = max(0, 5000 - 6000) = 0
    expect(result.finalPrice).toBe(0);
    expect(result.hasDiscount).toBe(true);
  });

  it('works with amount-based condition', () => {
    // $5 off when cart total >= $30
    const bundle = makeBundle(true, [makeAmtRule('gte', 3000, 'fixed_amount_off', 500)]);
    const result = PricingCalculator.calculateDiscount(bundle, 4000, 5);
    expect(result.discountAmount).toBe(500);
    expect(result.finalPrice).toBe(3500);
  });
});

// ─── calculateDiscount — fixed_bundle_price ───────────────────────────────────

describe('PricingCalculator.calculateDiscount — fixed_bundle_price', () => {
  it('sets bundle to fixed price by computing discountAmount as difference', () => {
    // Bundle priced at $30 total; normal price is $50
    const bundle = makeBundle(true, [makeQtyRule('gte', 3, 'fixed_bundle_price', 3000)]);
    const result = PricingCalculator.calculateDiscount(bundle, 5000, 3);
    expect(result.discountAmount).toBe(2000);   // 5000 - 3000
    expect(result.finalPrice).toBe(3000);
    expect(result.discountPercentage).toBeCloseTo(40, 5); // 2000/5000
    expect(result.hasDiscount).toBe(true);
  });

  it('discountAmount is 0 (no savings) when target price >= totalPrice', () => {
    // Fixed price of $60 but cart is only $50 → no discount makes sense
    const bundle = makeBundle(true, [makeQtyRule('gte', 1, 'fixed_bundle_price', 6000)]);
    const result = PricingCalculator.calculateDiscount(bundle, 5000, 2);
    expect(result.discountAmount).toBe(0);      // max(0, 5000 - 6000) = 0
    expect(result.finalPrice).toBe(5000);       // max(0, 5000 - 0) = 5000
    expect(result.hasDiscount).toBe(false);     // discountAmount === 0
    expect(result.qualifiesForDiscount).toBe(true); // condition was met
  });

  it('works with amount-based condition', () => {
    // Fixed price of $25 when cart total >= $40
    const bundle = makeBundle(true, [makeAmtRule('gte', 4000, 'fixed_bundle_price', 2500)]);
    const result = PricingCalculator.calculateDiscount(bundle, 5000, 4);
    expect(result.discountAmount).toBe(2500);   // 5000 - 2500
    expect(result.finalPrice).toBe(2500);
  });

  it('finalPrice is 0 when bundle price is 0', () => {
    const bundle = makeBundle(true, [makeQtyRule('gte', 1, 'fixed_bundle_price', 0)]);
    const result = PricingCalculator.calculateDiscount(bundle, 5000, 2);
    expect(result.discountAmount).toBe(5000);
    expect(result.finalPrice).toBe(0);
  });
});

// ─── calculateDiscount — best-rule selection ──────────────────────────────────

describe('PricingCalculator.calculateDiscount — best-rule selection', () => {
  /**
   * Bundle has 3 tiered rules:
   *   Tier 1: qty >= 2 → 10% off
   *   Tier 2: qty >= 4 → 20% off
   *   Tier 3: qty >= 6 → 30% off
   *
   * Best rule = the one with highest conditionValue that is satisfied.
   */
  const rules = [
    makeQtyRule('gte', 2, 'percentage_off', 10),
    makeQtyRule('gte', 4, 'percentage_off', 20),
    makeQtyRule('gte', 6, 'percentage_off', 30),
  ];
  const bundle = makeBundle(true, rules);

  it('qty=1 — no rule satisfied → no discount', () => {
    const result = PricingCalculator.calculateDiscount(bundle, 1000, 1);
    expect(result.hasDiscount).toBe(false);
    expect(result.discountPercentage).toBe(0);
  });

  it('qty=2 — only tier 1 satisfied → 10% off', () => {
    const result = PricingCalculator.calculateDiscount(bundle, 2000, 2);
    expect(result.discountAmount).toBe(200);      // 10% of 2000
    expect(result.discountMethod).toBe('percentage_off');
    expect(result.applicableRule.condition.value).toBe(2);
  });

  it('qty=3 — only tier 1 satisfied → 10% off (tier 2 needs 4)', () => {
    const result = PricingCalculator.calculateDiscount(bundle, 3000, 3);
    expect(result.discountAmount).toBe(300);      // 10% of 3000
    expect(result.applicableRule.condition.value).toBe(2);
  });

  it('qty=4 — tiers 1 and 2 satisfied → 20% off (highest conditionValue=4)', () => {
    const result = PricingCalculator.calculateDiscount(bundle, 4000, 4);
    expect(result.discountAmount).toBe(800);      // 20% of 4000
    expect(result.applicableRule.condition.value).toBe(4);
  });

  it('qty=5 — tiers 1 and 2 satisfied → 20% off (tier 3 needs 6)', () => {
    const result = PricingCalculator.calculateDiscount(bundle, 5000, 5);
    expect(result.discountAmount).toBe(1000);     // 20% of 5000
    expect(result.applicableRule.condition.value).toBe(4);
  });

  it('qty=6 — all three tiers satisfied → 30% off (highest conditionValue=6)', () => {
    const result = PricingCalculator.calculateDiscount(bundle, 6000, 6);
    expect(result.discountAmount).toBe(1800);     // 30% of 6000
    expect(result.applicableRule.condition.value).toBe(6);
  });

  it('qty=10 — all three tiers satisfied → 30% off', () => {
    const result = PricingCalculator.calculateDiscount(bundle, 10000, 10);
    expect(result.discountAmount).toBe(3000);     // 30% of 10000
    expect(result.applicableRule.condition.value).toBe(6);
  });

  it('selects best rule even when rules are defined out of order', () => {
    // Rules in reverse order — best-rule logic must compare conditionValues, not iterate order
    const reverseRules = [
      makeQtyRule('gte', 6, 'percentage_off', 30),
      makeQtyRule('gte', 2, 'percentage_off', 10),
      makeQtyRule('gte', 4, 'percentage_off', 20),
    ];
    const bundleReverse = makeBundle(true, reverseRules);
    // qty=4 → tier 2 (conditionValue=4) and tier 1 (conditionValue=2) satisfied
    // → best = conditionValue=4 = 20% off
    const result = PricingCalculator.calculateDiscount(bundleReverse, 4000, 4);
    expect(result.applicableRule.condition.value).toBe(4);
    expect(result.discountAmount).toBe(800);
  });
});

// ─── calculateDiscount — return shape completeness ────────────────────────────

describe('PricingCalculator.calculateDiscount — return shape', () => {
  const bundle = makeBundle(true, [makeQtyRule('gte', 3, 'percentage_off', 50)]);

  it('hasDiscount is false when no rule met', () => {
    const result = PricingCalculator.calculateDiscount(bundle, 2000, 2);
    expect(result.hasDiscount).toBe(false);
  });

  it('hasDiscount is true when discount is applied', () => {
    const result = PricingCalculator.calculateDiscount(bundle, 3000, 3);
    expect(result.hasDiscount).toBe(true);
  });

  it('qualifiesForDiscount is false when no rule met', () => {
    const result = PricingCalculator.calculateDiscount(bundle, 2000, 2);
    expect(result.qualifiesForDiscount).toBe(false);
  });

  it('qualifiesForDiscount is true when rule met (even if discountAmount = 0)', () => {
    const result = PricingCalculator.calculateDiscount(bundle, 3000, 3);
    expect(result.qualifiesForDiscount).toBe(true);
  });

  it('applicableRule is null when no rule met', () => {
    const result = PricingCalculator.calculateDiscount(bundle, 2000, 2);
    expect(result.applicableRule).toBeNull();
  });

  it('applicableRule matches the best rule when condition met', () => {
    const result = PricingCalculator.calculateDiscount(bundle, 3000, 3);
    expect(result.applicableRule).not.toBeNull();
    expect(result.applicableRule.condition.value).toBe(3);
    expect(result.applicableRule.discount.method).toBe('percentage_off');
  });

  it('discountMethod is returned for matched rule', () => {
    const result = PricingCalculator.calculateDiscount(bundle, 3000, 3);
    expect(result.discountMethod).toBe('percentage_off');
  });
});

// ─── calculateDiscount — operator coverage ───────────────────────────────────

describe('PricingCalculator.calculateDiscount — all 5 quantity operators', () => {
  it('equal_to: discount applied at and above threshold (>= semantics)', () => {
    const bundle = makeBundle(true, [makeQtyRule('eq', 3, 'percentage_off', 10)]);
    expect(PricingCalculator.calculateDiscount(bundle, 2000, 2).hasDiscount).toBe(false);
    expect(PricingCalculator.calculateDiscount(bundle, 3000, 3).hasDiscount).toBe(true);
    // "equal to 3" in discount context means "3 or more" (threshold behavior)
    expect(PricingCalculator.calculateDiscount(bundle, 4000, 4).hasDiscount).toBe(true);
  });

  it('greater_than: discount applied only strictly above threshold', () => {
    const bundle = makeBundle(true, [makeQtyRule('gt', 3, 'percentage_off', 10)]);
    expect(PricingCalculator.calculateDiscount(bundle, 3000, 3).hasDiscount).toBe(false);
    expect(PricingCalculator.calculateDiscount(bundle, 4000, 4).hasDiscount).toBe(true);
  });

  it('less_than: discount applied only strictly below threshold', () => {
    const bundle = makeBundle(true, [makeQtyRule('lt', 5, 'percentage_off', 10)]);
    expect(PricingCalculator.calculateDiscount(bundle, 5000, 5).hasDiscount).toBe(false);
    expect(PricingCalculator.calculateDiscount(bundle, 4000, 4).hasDiscount).toBe(true);
  });

  it('greater_than_or_equal_to: discount applied at and above threshold', () => {
    const bundle = makeBundle(true, [makeQtyRule('gte', 3, 'percentage_off', 10)]);
    expect(PricingCalculator.calculateDiscount(bundle, 2000, 2).hasDiscount).toBe(false);
    expect(PricingCalculator.calculateDiscount(bundle, 3000, 3).hasDiscount).toBe(true);
    expect(PricingCalculator.calculateDiscount(bundle, 4000, 4).hasDiscount).toBe(true);
  });

  it('less_than_or_equal_to: discount applied at and below threshold', () => {
    const bundle = makeBundle(true, [makeQtyRule('lte', 5, 'percentage_off', 10)]);
    expect(PricingCalculator.calculateDiscount(bundle, 5000, 5).hasDiscount).toBe(true);
    expect(PricingCalculator.calculateDiscount(bundle, 4000, 4).hasDiscount).toBe(true);
    expect(PricingCalculator.calculateDiscount(bundle, 6000, 6).hasDiscount).toBe(false);
  });
});

describe('PricingCalculator.calculateDiscount — all 5 amount operators', () => {
  it('eq: discount applied at and above threshold (>= semantics)', () => {
    const bundle = makeBundle(true, [makeAmtRule('eq', 3000, 'percentage_off', 10)]);
    expect(PricingCalculator.calculateDiscount(bundle, 2000, 2).hasDiscount).toBe(false);
    expect(PricingCalculator.calculateDiscount(bundle, 3000, 3).hasDiscount).toBe(true);
    // "equal to 3000" in discount context means "3000 or more" (threshold behavior)
    expect(PricingCalculator.calculateDiscount(bundle, 4000, 4).hasDiscount).toBe(true);
  });

  it('gt: discount applied only strictly above threshold', () => {
    const bundle = makeBundle(true, [makeAmtRule('gt', 3000, 'percentage_off', 10)]);
    expect(PricingCalculator.calculateDiscount(bundle, 3000, 3).hasDiscount).toBe(false);
    expect(PricingCalculator.calculateDiscount(bundle, 3001, 4).hasDiscount).toBe(true);
  });

  it('lt: discount applied only strictly below threshold', () => {
    const bundle = makeBundle(true, [makeAmtRule('lt', 5000, 'percentage_off', 10)]);
    expect(PricingCalculator.calculateDiscount(bundle, 5000, 5).hasDiscount).toBe(false);
    expect(PricingCalculator.calculateDiscount(bundle, 4999, 4).hasDiscount).toBe(true);
  });

  it('gte: discount applied at and above threshold', () => {
    const bundle = makeBundle(true, [makeAmtRule('gte', 5000, 'percentage_off', 10)]);
    expect(PricingCalculator.calculateDiscount(bundle, 4999, 4).hasDiscount).toBe(false);
    expect(PricingCalculator.calculateDiscount(bundle, 5000, 5).hasDiscount).toBe(true);
  });

  it('lte: discount applied at and below threshold', () => {
    const bundle = makeBundle(true, [makeAmtRule('lte', 5000, 'percentage_off', 10)]);
    expect(PricingCalculator.calculateDiscount(bundle, 5000, 5).hasDiscount).toBe(true);
    expect(PricingCalculator.calculateDiscount(bundle, 5001, 6).hasDiscount).toBe(false);
  });
});

// ─── getNextDiscountRule ──────────────────────────────────────────────────────

describe('PricingCalculator.getNextDiscountRule', () => {
  /**
   * Three tiered quantity rules (ascending by conditionValue):
   *   Tier 1: qty >= 2 → 10% off
   *   Tier 2: qty >= 4 → 20% off
   *   Tier 3: qty >= 6 → 30% off
   */
  const rules = [
    makeQtyRule('gte', 2, 'percentage_off', 10),
    makeQtyRule('gte', 4, 'percentage_off', 20),
    makeQtyRule('gte', 6, 'percentage_off', 30),
  ];

  it('returns null when bundle is null', () => {
    expect(PricingCalculator.getNextDiscountRule(null, 0, 0)).toBeNull();
  });

  it('returns null when bundle has no rules', () => {
    const bundle = makeBundle(true, []);
    expect(PricingCalculator.getNextDiscountRule(bundle, 0, 0)).toBeNull();
  });

  it('returns null when bundle.pricing is missing', () => {
    expect(PricingCalculator.getNextDiscountRule({ pricing: null }, 0, 0)).toBeNull();
  });

  it('qty=0 — returns first rule (qty>=2 not yet satisfied)', () => {
    const bundle = makeBundle(true, rules);
    const next = PricingCalculator.getNextDiscountRule(bundle, 0, 0);
    expect(next).not.toBeNull();
    expect(next.condition.value).toBe(2);
  });

  it('qty=1 — still returns qty>=2 rule (1 < 2)', () => {
    const bundle = makeBundle(true, rules);
    const next = PricingCalculator.getNextDiscountRule(bundle, 1, 0);
    expect(next.condition.value).toBe(2);
  });

  it('qty=2 — tier 1 satisfied, returns qty>=4 rule as next target', () => {
    const bundle = makeBundle(true, rules);
    const next = PricingCalculator.getNextDiscountRule(bundle, 2, 0);
    expect(next.condition.value).toBe(4);
  });

  it('qty=3 — tier 1 satisfied, returns qty>=4 rule', () => {
    const bundle = makeBundle(true, rules);
    const next = PricingCalculator.getNextDiscountRule(bundle, 3, 0);
    expect(next.condition.value).toBe(4);
  });

  it('qty=4 — tiers 1 and 2 satisfied, returns qty>=6 rule', () => {
    const bundle = makeBundle(true, rules);
    const next = PricingCalculator.getNextDiscountRule(bundle, 4, 0);
    expect(next.condition.value).toBe(6);
  });

  it('qty=6 — all rules satisfied, returns null', () => {
    const bundle = makeBundle(true, rules);
    expect(PricingCalculator.getNextDiscountRule(bundle, 6, 0)).toBeNull();
  });

  it('qty=100 — all rules satisfied, returns null', () => {
    const bundle = makeBundle(true, rules);
    expect(PricingCalculator.getNextDiscountRule(bundle, 100, 0)).toBeNull();
  });

  it('sorts rules by conditionValue ascending before checking (order-independent)', () => {
    // Same 3 rules but in reverse order in the array
    const reverseRules = [
      makeQtyRule('gte', 6, 'percentage_off', 30),
      makeQtyRule('gte', 4, 'percentage_off', 20),
      makeQtyRule('gte', 2, 'percentage_off', 10),
    ];
    const bundle = makeBundle(true, reverseRules);
    // qty=2 → tier for value=2 satisfied, next should be value=4
    const next = PricingCalculator.getNextDiscountRule(bundle, 2, 0);
    expect(next.condition.value).toBe(4);
  });

  it('works with amount-based rules (uses currentAmount parameter)', () => {
    const amtRules = [
      makeAmtRule('gte', 2000, 'percentage_off', 10),
      makeAmtRule('gte', 5000, 'percentage_off', 20),
    ];
    const bundle = makeBundle(true, amtRules);

    // amount=1000 → none satisfied → next is 2000
    expect(PricingCalculator.getNextDiscountRule(bundle, 0, 1000).condition.value).toBe(2000);

    // amount=3000 → value=2000 satisfied, next is 5000
    expect(PricingCalculator.getNextDiscountRule(bundle, 0, 3000).condition.value).toBe(5000);

    // amount=5000 → all satisfied → null
    expect(PricingCalculator.getNextDiscountRule(bundle, 0, 5000)).toBeNull();
  });

  it('returns single rule when not yet satisfied', () => {
    const bundle = makeBundle(true, [makeQtyRule('gte', 3, 'percentage_off', 25)]);
    expect(PricingCalculator.getNextDiscountRule(bundle, 2, 0).condition.value).toBe(3);
    expect(PricingCalculator.getNextDiscountRule(bundle, 3, 0)).toBeNull();
  });
});

// ─── calculateBundleTotal — free gift step exclusion ─────────────────────────

describe('PricingCalculator.calculateBundleTotal — free gift step exclusion', () => {
  // Two steps: step 0 is paid ($500, qty 1), step 1 is free gift ($200, qty 1).
  const selectedProducts = [
    { 'var-paid': 1 },
    { 'var-gift': 1 },
  ];
  const stepProductData = [
    [{ variantId: 'var-paid', price: 50000 }],  // 50000 cents = $500
    [{ variantId: 'var-gift', price: 20000 }],  // 20000 cents = $200
  ];
  const steps = [
    { isFreeGift: false },
    { isFreeGift: true },
  ];

  it('with steps: free gift step is excluded from totalPrice and totalQuantity', () => {
    const { totalPrice, totalQuantity } = PricingCalculator.calculateBundleTotal(
      selectedProducts, stepProductData, steps
    );
    expect(totalPrice).toBe(50000);
    expect(totalQuantity).toBe(1);
  });

  it('without steps (backward compat): free gift price is included as before', () => {
    const { totalPrice, totalQuantity } = PricingCalculator.calculateBundleTotal(
      selectedProducts, stepProductData
    );
    expect(totalPrice).toBe(70000);
    expect(totalQuantity).toBe(2);
  });

  it('with steps=null: behaves identically to no steps argument', () => {
    const { totalPrice } = PricingCalculator.calculateBundleTotal(
      selectedProducts, stepProductData, null
    );
    expect(totalPrice).toBe(70000);
  });

  it('all free gift steps: totalPrice = 0, totalQuantity = 0', () => {
    const allGiftSteps = [{ isFreeGift: true }, { isFreeGift: true }];
    const { totalPrice, totalQuantity } = PricingCalculator.calculateBundleTotal(
      selectedProducts, stepProductData, allGiftSteps
    );
    expect(totalPrice).toBe(0);
    expect(totalQuantity).toBe(0);
  });
});

// ─── calculateDiscount on paid-only total ────────────────────────────────────

describe('PricingCalculator.calculateDiscount — free gift excluded from totalPrice', () => {
  // After calculateBundleTotal skips the free gift step, calculateDiscount
  // receives only the paid total. Verify that discount is applied correctly.

  it('percentage_off on paid-only total: finalPrice = paid * (1 - pct/100)', () => {
    // paidTotal = 50000 cents ($500), 10% off
    const bundle = makeBundle(true, [makeQtyRule('gte', 1, 'percentage_off', 10)]);
    const { finalPrice, discountAmount } = PricingCalculator.calculateDiscount(bundle, 50000, 1);
    expect(discountAmount).toBe(5000);
    expect(finalPrice).toBe(45000);
  });

  it('fixed_amount_off on paid-only total: finalPrice = paidTotal - amountOff', () => {
    // paidTotal = 50000 cents ($500), $50 off = 5000 cents
    const bundle = makeBundle(true, [makeQtyRule('gte', 1, 'fixed_amount_off', 5000)]);
    const { finalPrice } = PricingCalculator.calculateDiscount(bundle, 50000, 1);
    expect(finalPrice).toBe(45000);
  });

  it('fixed_bundle_price on paid-only total: finalPrice = fixedPrice', () => {
    // paidTotal = 50000 cents ($500), fixedPrice = 40000 cents ($400)
    const bundle = makeBundle(true, [makeQtyRule('gte', 1, 'fixed_bundle_price', 40000)]);
    const { finalPrice } = PricingCalculator.calculateDiscount(bundle, 50000, 1);
    expect(finalPrice).toBe(40000);
  });
});
