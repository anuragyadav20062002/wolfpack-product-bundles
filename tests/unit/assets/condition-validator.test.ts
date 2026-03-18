/**
 * Unit Tests — Step Condition Validator
 *
 * Tests the shared `ConditionValidator` module used by both the product-page
 * and full-page bundle widgets.
 *
 * Focus areas:
 *  - calculateStepTotalAfterUpdate: must include newQuantity even for NEW products
 *  - canUpdateQuantity: all operator types, edge cases, undefined-safe
 *  - isStepConditionSatisfied: all operator types, edge cases, undefined-safe
 *
 * The critical bug that prompted this test suite:
 *   When productId is NOT yet in currentSelections (first addition), the old
 *   implementation omitted newQuantity from the total, letting the customer
 *   exceed the step condition silently.
 */

export {};

// eslint-disable-next-line @typescript-eslint/no-require-imports
const ConditionValidator = require('../../../app/assets/widgets/shared/condition-validator.js');

const { calculateStepTotalAfterUpdate, canUpdateQuantity, isStepConditionSatisfied, OPERATORS } = ConditionValidator;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeStep(operator: string, value: number, type = 'quantity') {
  return { conditionType: type, conditionOperator: operator, conditionValue: value };
}

const EQ  = 'equal_to';
const GT  = 'greater_than';
const LT  = 'less_than';
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

// ─── canUpdateQuantity — LESS_THAN ────────────────────────────────────────────

describe('canUpdateQuantity — LESS_THAN', () => {
  const step = makeStep(LT, 3);

  it('allows total strictly below N (1 < 3)', () => {
    expect(canUpdateQuantity(step, {}, 'A', 1).allowed).toBe(true);
  });

  it('allows total of N-1 (2 < 3)', () => {
    expect(canUpdateQuantity(step, { A: 1 }, 'A', 2).allowed).toBe(true);
  });

  it('blocks total equal to N (3 < 3 = false)', () => {
    const result = canUpdateQuantity(step, { A: 2 }, 'A', 3);
    expect(result.allowed).toBe(false);
    expect(result.limitText).toBe('less than 3');
  });

  it('blocks total above N (4 < 3 = false)', () => {
    expect(canUpdateQuantity(step, { A: 3 }, 'A', 4).allowed).toBe(false);
  });

  it('blocks when adding new product pushes total to N', () => {
    // A:2, new product B with qty 1 → total 3, not < 3
    expect(canUpdateQuantity(step, { A: 2 }, 'B', 1).allowed).toBe(false);
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

// ─── canUpdateQuantity — GREATER_THAN ────────────────────────────────────────

describe('canUpdateQuantity — GREATER_THAN', () => {
  const step = makeStep(GT, 2);

  it('always allows increases (minimum-quantity condition has no upper bound)', () => {
    expect(canUpdateQuantity(step, {}, 'A', 1).allowed).toBe(true);
    expect(canUpdateQuantity(step, { A: 5 }, 'A', 10).allowed).toBe(true);
    expect(canUpdateQuantity(step, { A: 100 }, 'B', 50).allowed).toBe(true);
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

// ─── isStepConditionSatisfied — GREATER_THAN ──────────────────────────────────

describe('isStepConditionSatisfied — GREATER_THAN', () => {
  const step = makeStep(GT, 2);

  it('satisfied when total is strictly greater than N', () => {
    expect(isStepConditionSatisfied(step, { A: 3 })).toBe(true);
    expect(isStepConditionSatisfied(step, { A: 2, B: 1 })).toBe(true);
  });

  it('not satisfied when total equals N', () => {
    expect(isStepConditionSatisfied(step, { A: 2 })).toBe(false);
  });

  it('not satisfied when total is below N', () => {
    expect(isStepConditionSatisfied(step, { A: 1 })).toBe(false);
    expect(isStepConditionSatisfied(step, {})).toBe(false);
  });
});

// ─── isStepConditionSatisfied — LESS_THAN ─────────────────────────────────────

describe('isStepConditionSatisfied — LESS_THAN', () => {
  const step = makeStep(LT, 3);

  it('satisfied when total is strictly less than N', () => {
    expect(isStepConditionSatisfied(step, {})).toBe(true);        // 0 < 3
    expect(isStepConditionSatisfied(step, { A: 2 })).toBe(true); // 2 < 3
  });

  it('not satisfied when total equals N', () => {
    expect(isStepConditionSatisfied(step, { A: 3 })).toBe(false);
  });

  it('not satisfied when total exceeds N', () => {
    expect(isStepConditionSatisfied(step, { A: 4 })).toBe(false);
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
  it('defaults to satisfied for unrecognised operators', () => {
    const step = makeStep('unknown_op', 2);
    expect(isStepConditionSatisfied(step, { A: 10 })).toBe(true);
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

describe('canUpdateQuantity — two conditions (GT + LT, i.e. exclusive range)', () => {
  // step: quantity > 1 AND quantity < 5  →  2 ≤ total ≤ 4
  const step = makeStep2(GT, 1, LT, 5);

  it('allows total 1 (building up; neither blocks increases below cap)', () => {
    expect(canUpdateQuantity(step, {}, 'A', 1).allowed).toBe(true);
  });

  it('allows total 4 (4 < 5 passes)', () => {
    expect(canUpdateQuantity(step, { A: 3 }, 'A', 4).allowed).toBe(true);
  });

  it('blocks total 5 — secondary LT 5 blocks', () => {
    const result = canUpdateQuantity(step, { A: 4 }, 'A', 5);
    expect(result.allowed).toBe(false);
    expect(result.limitText).toBe('less than 5');
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

describe('isStepConditionSatisfied — two conditions (GT 1 AND LT 5)', () => {
  const step = makeStep2(GT, 1, LT, 5);

  it('not satisfied at total = 1 (1 > 1 fails)', () => {
    expect(isStepConditionSatisfied(step, { A: 1 })).toBe(false);
  });

  it('satisfied at total = 2', () => {
    expect(isStepConditionSatisfied(step, { A: 2 })).toBe(true);
  });

  it('satisfied at total = 4', () => {
    expect(isStepConditionSatisfied(step, { A: 4 })).toBe(true);
  });

  it('not satisfied at total = 5 (5 < 5 fails)', () => {
    expect(isStepConditionSatisfied(step, { A: 5 })).toBe(false);
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

// ─── OPERATORS export ─────────────────────────────────────────────────────────

describe('OPERATORS constants', () => {
  it('exports all expected operator keys', () => {
    expect(OPERATORS.EQUAL_TO).toBe('equal_to');
    expect(OPERATORS.GREATER_THAN).toBe('greater_than');
    expect(OPERATORS.LESS_THAN).toBe('less_than');
    expect(OPERATORS.GREATER_THAN_OR_EQUAL_TO).toBe('greater_than_or_equal_to');
    expect(OPERATORS.LESS_THAN_OR_EQUAL_TO).toBe('less_than_or_equal_to');
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
