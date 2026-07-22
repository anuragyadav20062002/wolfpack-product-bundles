/**
 * Unit Tests — Step Condition Validator
 *
 * Tests the shared `ConditionValidator` module used by both the product-page
 * and full-page bundle widgets.
 *
 * Focus areas:
 *  - calculateStepTotalAfterUpdate: must include newQuantity even for NEW products
 *  - canUpdateQuantity: supported operator types, edge cases, undefined-safe
 *  - isStepConditionSatisfied: supported operator types, edge cases, undefined-safe
 *
 * The critical bug that prompted this test suite:
 *   When productId is NOT yet in currentSelections (first addition), the old
 *   implementation omitted newQuantity from the total, letting the customer
 *   exceed the step condition silently.
 */

export {};

// eslint-disable-next-line @typescript-eslint/no-require-imports
const ConditionValidator = require('../../../app/assets/widgets/shared/condition-validator.js');

const {
  calculateStepTotalAfterUpdate,
  canUpdateQuantity,
  isStepConditionSatisfied,
  getAllowedQuantityPerProduct,
  canUpdateProductQuantity,
  isProductQuantityIncreaseDisabled,
  OPERATORS,
} = ConditionValidator;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeStep(operator: string, value: number, type = 'quantity') {
  return { conditionType: type, conditionOperator: operator, conditionValue: value };
}

const EQ  = 'equal_to';
const GTE = 'greater_than_or_equal_to';
const LTE = 'less_than_or_equal_to';

// ─── calculateStepTotalAfterUpdate ───────────────────────────────────────────

describe('calculateStepTotalAfterUpdate', () => {
  it('returns newQuantity when step has no existing selections', () => {
    expect(calculateStepTotalAfterUpdate({}, 'A', 3)).toBe(3);
  });

  it('returns newQuantity for a null/undefined currentSelections', () => {
    expect(calculateStepTotalAfterUpdate(null, 'A', 2)).toBe(2);
    expect(calculateStepTotalAfterUpdate(undefined, 'A', 2)).toBe(2);
  });

  it('replaces existing quantity for the target product', () => {
    // Product A currently has 2; user changes to 5. Others unchanged.
    const selections = { A: 2, B: 1 };
    expect(calculateStepTotalAfterUpdate(selections, 'A', 5)).toBe(6); // 5 + 1
  });

  it('adds newQuantity for a product not yet in selections (THE BUG)', () => {
    // Step already has A:2 (satisfying EQUAL_TO 2).
    // User now adds product C for the first time with qty 1.
    // Old code: total = 2 (C's qty never added) → BUG
    // New code: total = 3 → correctly blocks the update
    const selections = { A: 2 };
    expect(calculateStepTotalAfterUpdate(selections, 'C', 1)).toBe(3);
  });

  it('handles removing a product (newQuantity = 0)', () => {
    const selections = { A: 3, B: 2 };
    expect(calculateStepTotalAfterUpdate(selections, 'A', 0)).toBe(2); // only B remains
  });

  it('handles multi-product step correctly', () => {
    const selections = { A: 1, B: 1, C: 1 };
    // Increasing A to 3: others (B=1, C=1) + 3 = 5
    expect(calculateStepTotalAfterUpdate(selections, 'A', 3)).toBe(5);
  });
});

// ─── canUpdateQuantity — no condition ─────────────────────────────────────────

describe('canUpdateQuantity — no condition', () => {
  it('allows any update when step has no conditionType', () => {
    const step = { conditionType: null, conditionOperator: EQ, conditionValue: 2 };
    expect(canUpdateQuantity(step, {}, 'A', 999).allowed).toBe(true);
  });

  it('allows any update when step has no conditionOperator', () => {
    const step = { conditionType: 'quantity', conditionOperator: null, conditionValue: 2 };
    expect(canUpdateQuantity(step, {}, 'A', 999).allowed).toBe(true);
  });

  it('allows any update when conditionValue is null', () => {
    const step = { conditionType: 'quantity', conditionOperator: EQ, conditionValue: null };
    expect(canUpdateQuantity(step, {}, 'A', 999).allowed).toBe(true);
  });

  it('allows any update when conditionValue is undefined', () => {
    const step = { conditionType: 'quantity', conditionOperator: EQ, conditionValue: undefined };
    expect(canUpdateQuantity(step, {}, 'A', 999).allowed).toBe(true);
  });

  it('allows any update when step itself is null', () => {
    expect(canUpdateQuantity(null, {}, 'A', 5).allowed).toBe(true);
  });

  it('returns null limitText when allowed', () => {
    const step = makeStep(EQ, 2);
    expect(canUpdateQuantity(step, {}, 'A', 1).limitText).toBeNull();
  });
});

// ─── canUpdateProductQuantity — per-product validation ───────────────────────

describe('canUpdateProductQuantity — per-product validation', () => {
  it('returns null limit when quantity validation is disabled', () => {
    expect(getAllowedQuantityPerProduct({ isEnabled: false, allowedQuantity: 1 })).toBeNull();
    expect(canUpdateProductQuantity({ isEnabled: false, allowedQuantity: 1 }, 1, 2)).toEqual({
      allowed: true,
      limit: null,
    });
  });

  it('defaults enabled validation to a max of 1 when allowedQuantity is invalid', () => {
    expect(getAllowedQuantityPerProduct({ isEnabled: true, allowedQuantity: 0 })).toBe(1);
    expect(getAllowedQuantityPerProduct({ isEnabled: true, allowedQuantity: 'bad' })).toBe(1);
  });

  it('allows an increase up to the allowed per-product quantity', () => {
    expect(canUpdateProductQuantity({ isEnabled: true, allowedQuantity: 2 }, 1, 2)).toEqual({
      allowed: true,
      limit: 2,
    });
  });

  it('blocks an increase above the allowed per-product quantity', () => {
    expect(canUpdateProductQuantity({ isEnabled: true, allowedQuantity: 1 }, 1, 2)).toEqual({
      allowed: false,
      limit: 1,
    });
  });

  it('always allows decreases and removals', () => {
    expect(canUpdateProductQuantity({ isEnabled: true, allowedQuantity: 1 }, 2, 1).allowed).toBe(true);
    expect(canUpdateProductQuantity({ isEnabled: true, allowedQuantity: 1 }, 1, 0).allowed).toBe(true);
  });

  it('disables the next increment only when the configured per-product limit is reached', () => {
    expect(isProductQuantityIncreaseDisabled({ isEnabled: true, allowedQuantity: 3 }, 2)).toBe(false);
    expect(isProductQuantityIncreaseDisabled({ isEnabled: true, allowedQuantity: 3 }, 3)).toBe(true);
    expect(isProductQuantityIncreaseDisabled({ isEnabled: false, allowedQuantity: 1 }, 99)).toBe(false);
  });
});

// ─── canUpdateQuantity — EQUAL_TO ─────────────────────────────────────────────

describe('canUpdateQuantity — EQUAL_TO', () => {
  const step = makeStep(EQ, 2);

  it('allows adding first product (total would be 1 ≤ 2)', () => {
    expect(canUpdateQuantity(step, {}, 'A', 1).allowed).toBe(true);
  });

  it('allows bringing total to exactly N (total would be 2 ≤ 2)', () => {
    expect(canUpdateQuantity(step, { A: 1 }, 'A', 2).allowed).toBe(true);
  });

  it('blocks exceeding N — existing product (total would be 3 > 2)', () => {
    const result = canUpdateQuantity(step, { A: 2 }, 'A', 3);
    expect(result.allowed).toBe(false);
    expect(result.limitText).toBe('exactly 2');
  });

  it('blocks exceeding N — NEW product (THE BUG FIX)', () => {
    // A already satisfies the condition. Adding B for the first time must be blocked.
    const result = canUpdateQuantity(step, { A: 2 }, 'B', 1);
    expect(result.allowed).toBe(false);
    expect(result.limitText).toBe('exactly 2');
  });

  it('allows removing a product (decrease always permitted)', () => {
    // A:2 → A:1 — total would be 1 which is ≤ 2, so allowed
    expect(canUpdateQuantity(step, { A: 2 }, 'A', 1).allowed).toBe(true);
  });

  it('allows removing product entirely (qty 0)', () => {
    expect(canUpdateQuantity(step, { A: 2 }, 'A', 0).allowed).toBe(true);
  });

  it('provides correct limitText when blocked', () => {
    const result = canUpdateQuantity(step, { A: 2 }, 'B', 1);
    expect(result.limitText).toContain('exactly 2');
  });
});

// ─── canUpdateQuantity — LESS_THAN_OR_EQUAL_TO ────────────────────────────────

  describe('canUpdateQuantity — LESS_THAN_OR_EQUAL_TO', () => {
  const step = makeStep(LTE, 3);

  it('allows total equal to N (3 ≤ 3)', () => {
    expect(canUpdateQuantity(step, { A: 2 }, 'A', 3).allowed).toBe(true);
  });

  it('blocks total above N (4 ≤ 3 = false)', () => {
    const result = canUpdateQuantity(step, { A: 3 }, 'A', 4);
    expect(result.allowed).toBe(false);
    expect(result.limitText).toBe('at most 3');
  });

  it('blocks when new product pushes total above N', () => {
      // A:3 satisfies LTE 3. Adding B:1 → total 4 > 3 → blocked.
      expect(canUpdateQuantity(step, { A: 3 }, 'B', 1).allowed).toBe(false);
    });
  });

describe('canUpdateQuantity — amount condition', () => {
  const productPrices = { A: 600, B: 450 };
  const step = makeStep(LTE, 10, 'amount');

  it('allows updates while running total stays within amount threshold', () => {
    const selections = {
      A: { quantity: 1, amount: 400, weight: 0 },
    };
    expect(canUpdateQuantity(step, selections, 'B', 1, { amount: productPrices.B, weight: 0 }).allowed).toBe(true);
  });

  it('blocks updates when proposed amount exceeds threshold', () => {
    const selections = {
      A: { quantity: 1, amount: 600, weight: 0 },
    };
    expect(canUpdateQuantity(step, selections, 'B', 2, { amount: productPrices.B, weight: 0 }).allowed).toBe(false);
  });

  it('allows no-op updates that remain below threshold for equal condition', () => {
    const equalStep = makeStep(EQ, 10, 'amount');
    const selections = {
      A: { quantity: 1, amount: 700, weight: 0 },
    };
    expect(canUpdateQuantity(equalStep, selections, 'A', 1, { amount: productPrices.A, weight: 0 }).allowed).toBe(true);
  });
});

describe('canUpdateQuantity — weight condition', () => {
  it('uses per-product weights in condition math', () => {
    const step = makeStep(LTE, 1000, 'weight');
    const selections = {
      A: { quantity: 1, amount: 0, weight: 600 },
    };
    const result = canUpdateQuantity(step, selections, 'B', 1, { amount: 0, weight: 500 });
    expect(result.allowed).toBe(false);
  });
});

// ─── canUpdateQuantity — GREATER_THAN_OR_EQUAL_TO ────────────────────────────

describe('canUpdateQuantity — GREATER_THAN_OR_EQUAL_TO', () => {
  const step = makeStep(GTE, 2);

  it('always allows increases', () => {
    expect(canUpdateQuantity(step, {}, 'A', 1).allowed).toBe(true);
    expect(canUpdateQuantity(step, { A: 2 }, 'B', 99).allowed).toBe(true);
  });
});

// ─── canUpdateQuantity — unknown operator ─────────────────────────────────────

describe('canUpdateQuantity — unknown operator', () => {
  it('defaults to allowed for unrecognised operators', () => {
    const step = makeStep('unknown_op', 2);
    expect(canUpdateQuantity(step, {}, 'A', 999).allowed).toBe(true);
  });
});

// ─── isStepConditionSatisfied — no condition ─────────────────────────────────

describe('isStepConditionSatisfied — no condition', () => {
  it('falls back to minQuantity (default 1) with no conditionType', () => {
    // No condition → defaults to minQuantity:1, so empty selections fail
    expect(isStepConditionSatisfied({ conditionType: null, conditionOperator: EQ, conditionValue: 2 }, {})).toBe(false);
    // With at least 1 selected, it passes
    expect(isStepConditionSatisfied({ conditionType: null, conditionOperator: EQ, conditionValue: 2 }, { A: 1 })).toBe(true);
    // With explicit minQuantity: 0, empty selections pass (truly optional)
    expect(isStepConditionSatisfied({ conditionType: null, conditionOperator: EQ, conditionValue: 2, minQuantity: 0 }, {})).toBe(true);
  });

  it('falls back to minQuantity (default 1) with no conditionValue', () => {
    expect(isStepConditionSatisfied({ conditionType: 'quantity', conditionOperator: EQ, conditionValue: null }, {})).toBe(false);
    expect(isStepConditionSatisfied({ conditionType: 'quantity', conditionOperator: EQ, conditionValue: null }, { A: 1 })).toBe(true);
  });

  it('falls back to minQuantity (default 1) with undefined conditionValue', () => {
    expect(isStepConditionSatisfied({ conditionType: 'quantity', conditionOperator: EQ, conditionValue: undefined }, {})).toBe(false);
    expect(isStepConditionSatisfied({ conditionType: 'quantity', conditionOperator: EQ, conditionValue: undefined, minQuantity: 0 }, {})).toBe(true);
  });

  it('is satisfied with null step', () => {
    expect(isStepConditionSatisfied(null, { A: 5 })).toBe(true);
  });

  it('is satisfied with null/undefined currentSelections (no condition)', () => {
    expect(isStepConditionSatisfied(null, null)).toBe(true);
  });
});

// ─── isStepConditionSatisfied — EQUAL_TO ──────────────────────────────────────

describe('isStepConditionSatisfied — EQUAL_TO', () => {
  const step = makeStep(EQ, 2);

  it('satisfied when total equals N exactly', () => {
    expect(isStepConditionSatisfied(step, { A: 1, B: 1 })).toBe(true);
    expect(isStepConditionSatisfied(step, { A: 2 })).toBe(true);
  });

  it('not satisfied when total is below N', () => {
    expect(isStepConditionSatisfied(step, { A: 1 })).toBe(false);
    expect(isStepConditionSatisfied(step, {})).toBe(false);
  });

  it('not satisfied when total exceeds N', () => {
    expect(isStepConditionSatisfied(step, { A: 3 })).toBe(false);
  });

  it('handles null/undefined selections (treats as 0 selected)', () => {
    expect(isStepConditionSatisfied(step, null)).toBe(false);   // 0 ≠ 2
    expect(isStepConditionSatisfied(step, undefined)).toBe(false);
  });
});

// ─── isStepConditionSatisfied — GREATER_THAN_OR_EQUAL_TO ─────────────────────

describe('isStepConditionSatisfied — GREATER_THAN_OR_EQUAL_TO', () => {
  const step = makeStep(GTE, 2);

  it('satisfied when total equals N', () => {
    expect(isStepConditionSatisfied(step, { A: 2 })).toBe(true);
  });

  it('satisfied when total exceeds N', () => {
    expect(isStepConditionSatisfied(step, { A: 5 })).toBe(true);
  });

  it('not satisfied when total is below N', () => {
    expect(isStepConditionSatisfied(step, { A: 1 })).toBe(false);
    expect(isStepConditionSatisfied(step, {})).toBe(false);
  });
});

// ─── isStepConditionSatisfied — LESS_THAN_OR_EQUAL_TO ────────────────────────

describe('isStepConditionSatisfied — LESS_THAN_OR_EQUAL_TO', () => {
  const step = makeStep(LTE, 3);

  it('satisfied when total equals N', () => {
    expect(isStepConditionSatisfied(step, { A: 3 })).toBe(true);
  });

  it('satisfied when total is below N', () => {
    expect(isStepConditionSatisfied(step, {})).toBe(true);         // 0 ≤ 3
    expect(isStepConditionSatisfied(step, { A: 2 })).toBe(true);  // 2 ≤ 3
  });

  it('not satisfied when total exceeds N', () => {
    expect(isStepConditionSatisfied(step, { A: 4 })).toBe(false);
  });
});

// ─── isStepConditionSatisfied — unknown operator ──────────────────────────────

describe('isStepConditionSatisfied — unknown operator', () => {
  it('treats unrecognised operators as unsatisfied', () => {
    const step = makeStep('unknown_op', 2);
    expect(isStepConditionSatisfied(step, { A: 10 })).toBe(false);
  });
});

// ─── Multi-condition: canUpdateQuantity ───────────────────────────────────────

function makeStep2(op1: string, val1: number, op2: string, val2: number, type = 'quantity') {
  return {
    conditionType: type,
    conditionOperator: op1,
    conditionValue: val1,
    conditionOperator2: op2,
    conditionValue2: val2,
  };
}

describe('canUpdateQuantity — two conditions (GTE + LTE, i.e. range)', () => {
  // step: quantity >= 2 AND quantity <= 6
  const step = makeStep2(GTE, 2, LTE, 6);

  it('allows total 1 (primary GTE 2 allows increases, secondary LTE 6 allows)', () => {
    expect(canUpdateQuantity(step, {}, 'A', 1).allowed).toBe(true);
  });

  it('allows total 6 (at the upper bound — LTE passes)', () => {
    expect(canUpdateQuantity(step, { A: 5 }, 'A', 6).allowed).toBe(true);
  });

  it('blocks total 7 — secondary LTE 6 blocks the increase', () => {
    const result = canUpdateQuantity(step, { A: 6 }, 'A', 7);
    expect(result.allowed).toBe(false);
    expect(result.limitText).toBe('at most 6');
  });

  it('blocks when new product pushes total above 6', () => {
    // A:6 already at cap. Adding B:1 → total 7 → blocked.
    const result = canUpdateQuantity(step, { A: 6 }, 'B', 1);
    expect(result.allowed).toBe(false);
    expect(result.limitText).toBe('at most 6');
  });

  it('allows decreasing from 7 back to 6 (decrease always permitted by LTE)', () => {
    // A:6, B:1 → set A to 5 → total 6 → allowed
    expect(canUpdateQuantity(step, { A: 6, B: 1 }, 'A', 5).allowed).toBe(true);
  });
});

describe('canUpdateQuantity — single lower-bound only (no second condition)', () => {
  // Existing behaviour must be preserved: always allows increases
  const step = makeStep(GTE, 2);

  it('always allows increases with no second condition', () => {
    expect(canUpdateQuantity(step, {}, 'A', 1).allowed).toBe(true);
    expect(canUpdateQuantity(step, { A: 2 }, 'A', 10).allowed).toBe(true);
    expect(canUpdateQuantity(step, { A: 100 }, 'B', 50).allowed).toBe(true);
  });
});

describe('canUpdateQuantity — null / undefined second condition fields', () => {
  it('treats conditionOperator2: null as no second condition', () => {
    const step = { conditionType: 'quantity', conditionOperator: GTE, conditionValue: 2, conditionOperator2: null, conditionValue2: 6 };
    expect(canUpdateQuantity(step, { A: 6 }, 'A', 10).allowed).toBe(true);
  });

  it('treats conditionValue2: null as no second condition', () => {
    const step = { conditionType: 'quantity', conditionOperator: GTE, conditionValue: 2, conditionOperator2: LTE, conditionValue2: null };
    expect(canUpdateQuantity(step, { A: 6 }, 'A', 10).allowed).toBe(true);
  });

  it('treats both second fields undefined as no second condition', () => {
    const step = { conditionType: 'quantity', conditionOperator: GTE, conditionValue: 2 };
    expect(canUpdateQuantity(step, { A: 6 }, 'A', 10).allowed).toBe(true);
  });
});

// ─── Multi-condition: isStepConditionSatisfied ────────────────────────────────

describe('isStepConditionSatisfied — two conditions (GTE 2 AND LTE 6)', () => {
  const step = makeStep2(GTE, 2, LTE, 6);

  it('not satisfied when total = 1 (primary GTE 2 fails)', () => {
    expect(isStepConditionSatisfied(step, { A: 1 })).toBe(false);
  });

  it('satisfied when total = 2 (both conditions pass)', () => {
    expect(isStepConditionSatisfied(step, { A: 2 })).toBe(true);
  });

  it('satisfied when total = 6 (at the upper bound)', () => {
    expect(isStepConditionSatisfied(step, { A: 3, B: 3 })).toBe(true);
  });

  it('not satisfied when total = 7 (secondary LTE 6 fails — newly fixed case)', () => {
    expect(isStepConditionSatisfied(step, { A: 7 })).toBe(false);
  });

  it('not satisfied with empty selections', () => {
    expect(isStepConditionSatisfied(step, {})).toBe(false);
  });

  it('not satisfied with null selections', () => {
    expect(isStepConditionSatisfied(step, null)).toBe(false);
  });
});

describe('isStepConditionSatisfied — amount condition', () => {
  it('compares against amount totals when conditionType is amount', () => {
    const step = makeStep(EQ, 10, 'amount');
    expect(isStepConditionSatisfied(step, { A: { quantity: 1, amount: 1000, weight: 0 } })).toBe(true);
    expect(isStepConditionSatisfied(step, { A: { quantity: 2, amount: 600, weight: 0 } })).toBe(false);
  });

  it('compares against weight totals when conditionType is weight', () => {
    const step = makeStep(LTE, 1200, 'weight');
    expect(isStepConditionSatisfied(step, { A: { quantity: 1, amount: 0, weight: 600 } })).toBe(true);
    expect(isStepConditionSatisfied(step, { A: { quantity: 1, amount: 0, weight: 1400 } })).toBe(false);
  });
});

describe('isStepConditionSatisfied — single lower-bound only (GTE 2, no second)', () => {
  const step = makeStep(GTE, 2);

  it('satisfied at total = 7 (no upper bound — existing behaviour preserved)', () => {
    expect(isStepConditionSatisfied(step, { A: 7 })).toBe(true);
  });

  it('not satisfied at total = 1', () => {
    expect(isStepConditionSatisfied(step, { A: 1 })).toBe(false);
  });
});

describe('isStepConditionSatisfied — null / undefined second condition fields', () => {
  it('treats conditionOperator2: null as no second condition', () => {
    const step = { conditionType: 'quantity', conditionOperator: GTE, conditionValue: 2, conditionOperator2: null, conditionValue2: 6 };
    expect(isStepConditionSatisfied(step, { A: 10 })).toBe(true);
  });

  it('treats conditionValue2: null as no second condition', () => {
    const step = { conditionType: 'quantity', conditionOperator: GTE, conditionValue: 2, conditionOperator2: LTE, conditionValue2: null };
    expect(isStepConditionSatisfied(step, { A: 10 })).toBe(true);
  });
});

describe('non-positive condition values', () => {
  it('treats step rule value 0 as absent for product updates', () => {
    const step = makeStep(EQ, 0);

    expect(canUpdateQuantity(step, {}, 'A', 1).allowed).toBe(true);
    expect(isStepConditionSatisfied(step, { A: 1 })).toBe(true);
  });

  it('ignores category rules with value 0', () => {
    const step = {
      minQuantity: 1,
      categories: [
        {
          categoryId: 'cat-1',
          products: [{ id: 'gid://shopify/Product/9427287703811' }],
          conditions: [{ type: 'quantity', condition: 'equalTo', value: 0 }],
        },
      ],
    };

    expect(isStepConditionSatisfied(step, { '9427287703811': 1 })).toBe(true);
    expect(isStepConditionSatisfied(step, {})).toBe(false);
  });
});

// ─── OPERATORS export ─────────────────────────────────────────────────────────

describe('OPERATORS constants', () => {
  it('exports only EB-supported step and category rule operators', () => {
    expect(OPERATORS.EQUAL_TO).toBe('equal_to');
    expect(OPERATORS.GREATER_THAN_OR_EQUAL_TO).toBe('greater_than_or_equal_to');
    expect(OPERATORS.LESS_THAN_OR_EQUAL_TO).toBe('less_than_or_equal_to');
    expect(OPERATORS.GREATER_THAN).toBeUndefined();
    expect(OPERATORS.LESS_THAN).toBeUndefined();
  });
});

describe('unsupported strict operators', () => {
  it('does not satisfy step rules with strict greater-than or strict less-than operators', () => {
    expect(isStepConditionSatisfied(makeStep('greater_than', 2), { A: 3 })).toBe(false);
    expect(isStepConditionSatisfied(makeStep('less_than', 3), { A: 2 })).toBe(false);
  });

  it('does not satisfy category rules with EB-style strict operators', () => {
    const makeCategory = (condition: string) => ({
      categoryId: 'cat-A',
      products: [{ id: 'p1' }],
      conditions: [{ type: 'quantity', condition, value: 1 }],
    });

    expect(isStepConditionSatisfied({ categories: [makeCategory('greaterThan')] }, { p1: 2 })).toBe(false);
    expect(isStepConditionSatisfied({ categories: [makeCategory('lessThan')] }, {})).toBe(false);
  });
});

// ─── Regression tests for reported bug scenarios ──────────────────────────────

describe('Regression: reported bug scenarios', () => {
  it('EQUAL_TO 2 — blocks adding a 3rd item when step already has qty:2 via one product', () => {
    const step = makeStep(EQ, 2);
    // User increments product A from 2 to 3
    const result = canUpdateQuantity(step, { A: 2 }, 'A', 3);
    expect(result.allowed).toBe(false);
  });

  it('EQUAL_TO 2 — blocks adding a NEW product when another already satisfies the limit', () => {
    const step = makeStep(EQ, 2);
    // A:2 meets the condition. User tries to add B:1 → total would be 3.
    const result = canUpdateQuantity(step, { A: 2 }, 'B', 1);
    expect(result.allowed).toBe(false);
  });

  it('EQUAL_TO 1 — single-item step: blocks adding second item', () => {
    const step = makeStep(EQ, 1);
    expect(canUpdateQuantity(step, { A: 1 }, 'B', 1).allowed).toBe(false);
    expect(canUpdateQuantity(step, { A: 1 }, 'A', 2).allowed).toBe(false);
  });

  it('EQUAL_TO 2 — satisfies validation only at exactly 2, not 1 or 3', () => {
    const step = makeStep(EQ, 2);
    expect(isStepConditionSatisfied(step, { A: 1 })).toBe(false);
    expect(isStepConditionSatisfied(step, { A: 2 })).toBe(true);
    expect(isStepConditionSatisfied(step, { A: 3 })).toBe(false);
  });

  it('Multi-product step with EQUAL_TO 3 — allows building to exactly 3', () => {
    const step = makeStep(EQ, 3);
    // 0 → allow A:1
    expect(canUpdateQuantity(step, {}, 'A', 1).allowed).toBe(true);
    // A:1 → allow B:1
    expect(canUpdateQuantity(step, { A: 1 }, 'B', 1).allowed).toBe(true);
    // A:1,B:1 → allow C:1
    expect(canUpdateQuantity(step, { A: 1, B: 1 }, 'C', 1).allowed).toBe(true);
    // A:1,B:1,C:1 → block D:1 (total would be 4)
    expect(canUpdateQuantity(step, { A: 1, B: 1, C: 1 }, 'D', 1).allowed).toBe(false);
    // A:1,B:1,C:1 = 3 → satisfied
    expect(isStepConditionSatisfied(step, { A: 1, B: 1, C: 1 })).toBe(true);
  });
});

// ─── Category-mode rules (category-rules-2) ──────────────────────────────────

describe('isStepConditionSatisfied — category mode', () => {
  function makeCategory(name: string, productIds: string[], rules: any[] = []) {
    return {
      categoryId: `cat-${name}`,
      name,
      products: productIds.map(id => ({ id })),
      conditions: rules,
    };
  }

  it('single category with snake_case operator — rule met', () => {
    const step = {
      categories: [
        makeCategory('A', ['p1', 'p2'], [{ type: 'quantity', operator: 'greater_than_or_equal_to', value: 2 }]),
      ],
    };
    expect(isStepConditionSatisfied(step, { p1: 1, p2: 1 })).toBe(true);
  });

  it('single category with EB-style camelCase operator — rule met', () => {
    const step = {
      categories: [
        makeCategory('A', ['p1', 'p2'], [{ type: 'quantity', condition: 'greaterThanOrEqualTo', value: 2 }]),
      ],
    };
    expect(isStepConditionSatisfied(step, { p1: 1, p2: 1 })).toBe(true);
  });

  it('single category — rule not met when not enough selections in that category', () => {
    const step = {
      categories: [
        makeCategory('A', ['p1', 'p2'], [{ type: 'quantity', condition: 'greaterThanOrEqualTo', value: 2 }]),
      ],
    };
    expect(isStepConditionSatisfied(step, { p1: 1 })).toBe(false);
  });

  it('two categories — both must be satisfied', () => {
    const step = {
      categories: [
        makeCategory('A', ['p1', 'p2'], [{ type: 'quantity', condition: 'greaterThanOrEqualTo', value: 1 }]),
        makeCategory('B', ['p3', 'p4'], [{ type: 'quantity', condition: 'greaterThanOrEqualTo', value: 1 }]),
      ],
    };
    expect(isStepConditionSatisfied(step, { p1: 1, p3: 1 })).toBe(true);
    expect(isStepConditionSatisfied(step, { p1: 1 })).toBe(false); // B unsatisfied
    expect(isStepConditionSatisfied(step, { p3: 1 })).toBe(false); // A unsatisfied
  });

  it('categories without conditions do not gate the step', () => {
    const step = {
      categories: [
        makeCategory('A', ['p1'], [{ type: 'quantity', condition: 'greaterThanOrEqualTo', value: 1 }]),
        makeCategory('B', ['p2']), // no conditions
      ],
    };
    expect(isStepConditionSatisfied(step, { p1: 1 })).toBe(true);
    expect(isStepConditionSatisfied(step, { p2: 1 })).toBe(false); // A unsatisfied; B doesn't compensate
  });

  it('selections outside the category do not count toward its rule', () => {
    const step = {
      categories: [
        makeCategory('A', ['p1'], [{ type: 'quantity', condition: 'greaterThanOrEqualTo', value: 2 }]),
      ],
    };
    // p2 isn't in category A, so it doesn't help A reach its quantity threshold.
    expect(isStepConditionSatisfied(step, { p1: 1, p2: 5 })).toBe(false);
    expect(isStepConditionSatisfied(step, { p1: 2 })).toBe(true);
  });

  it('falls through to step-level check when no category has conditions', () => {
    const step = {
      ...makeStep(GTE, 3),
      categories: [makeCategory('A', ['p1'])], // no conditions
    };
    // Step-level rule kicks in: total >= 3
    expect(isStepConditionSatisfied(step, { p1: 2 })).toBe(false);
    expect(isStepConditionSatisfied(step, { p1: 3 })).toBe(true);
  });

  it('LESS_THAN_OR_EQUAL_TO works in category mode', () => {
    const step = {
      categories: [
        makeCategory('A', ['p1'], [{ type: 'quantity', condition: 'lessThanOrEqualTo', value: 2 }]),
      ],
    };
    expect(isStepConditionSatisfied(step, { p1: 1 })).toBe(true);
    expect(isStepConditionSatisfied(step, { p1: 2 })).toBe(true);
    expect(isStepConditionSatisfied(step, { p1: 3 })).toBe(false);
  });

  it('GID-format product ID in category matches numeric product ID selection key (regression: category-rules-3)', () => {
    // Runtime category products arrive with GID ids from compactProductReference.
    // After widget translates variant→product ID and validator strips the GID,
    // both sides resolve to the same numeric product ID.
    const step = {
      categories: [
        {
          categoryId: 'cat-1',
          products: [{ id: 'gid://shopify/Product/9427287703811', title: 'Test Product' }],
          conditions: [{ type: 'quantity', condition: 'greaterThanOrEqualTo', value: 1 }],
        },
      ],
    };
    // Selection key is numeric product ID (widget translates variant ID → product ID before calling validator)
    expect(isStepConditionSatisfied(step, { '9427287703811': 1 })).toBe(true);
    expect(isStepConditionSatisfied(step, { '9427287703811': 0 })).toBe(false);
  });

  it('amount category rule uses selected product amounts, not selected quantity', () => {
    const step = {
      categories: [
        makeCategory('FullSize', ['p1'], [{ type: 'quantity', condition: 'equalTo', value: 1 }]),
        makeCategory('Statement', ['p2'], [{ type: 'amount', condition: 'greaterThanOrEqualTo', value: 100 }]),
      ],
    };

    expect(isStepConditionSatisfied(step, {
      p1: { quantity: 1, amount: 82900 },
      p2: { quantity: 1, amount: 6360 },
    })).toBe(false);
    expect(isStepConditionSatisfied(step, {
      p1: { quantity: 1, amount: 82900 },
      p2: { quantity: 1, amount: 61900 },
    })).toBe(true);
  });

  it('weight category rule uses selected product weights, not selected quantity', () => {
    const step = {
      categories: [
        makeCategory('Weighted', ['p1'], [{ type: 'weight', condition: 'greaterThanOrEqualTo', value: 500 }]),
      ],
    };

    expect(isStepConditionSatisfied(step, {
      p1: { quantity: 2, weight: 400 },
    })).toBe(false);
    expect(isStepConditionSatisfied(step, {
      p1: { quantity: 2, weight: 600 },
    })).toBe(true);
  });
});
