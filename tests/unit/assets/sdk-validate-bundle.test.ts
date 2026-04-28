/**
 * Unit Tests — SDK validate-bundle module
 */

export {};

// eslint-disable-next-line @typescript-eslint/no-require-imports
const ConditionValidator = require('../../../app/assets/widgets/shared/condition-validator.js');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { validateStep, validateBundle } = require('../../../app/assets/sdk/validate-bundle.js');

function makeStep(id: string, operator: string, value: number, isFreeGift = false, isDefault = false) {
  return {
    id,
    name: `Step ${id}`,
    conditionType: 'quantity',
    conditionOperator: operator,
    conditionValue: value,
    isFreeGift,
    isDefault,
  };
}

function makeState(steps: object[], selections: Record<string, Record<string, number>>) {
  return { steps, selections, isReady: true };
}

describe('validateStep', () => {
  it('returns valid when step condition is satisfied', () => {
    const steps = [makeStep('step_1', 'equal_to', 2)];
    const state = makeState(steps, { step_1: { 'v1': 1, 'v2': 1 } });
    const result = validateStep('step_1', state, ConditionValidator);
    expect(result.valid).toBe(true);
    expect(result.message).toBe('');
  });

  it('returns invalid with message when condition not met', () => {
    const steps = [makeStep('step_1', 'equal_to', 3)];
    const state = makeState(steps, { step_1: { 'v1': 1 } });
    const result = validateStep('step_1', state, ConditionValidator);
    expect(result.valid).toBe(false);
    expect(result.message).toBeTruthy();
  });

  it('returns error for unknown stepId', () => {
    const steps = [makeStep('step_1', 'equal_to', 1)];
    const state = makeState(steps, {});
    const result = validateStep('step_99', state, ConditionValidator);
    expect(result.valid).toBe(false);
    expect(result.message).toMatch(/step_99/);
  });

  it('returns valid for step with no selections when no min required', () => {
    const steps = [{ id: 'step_1', name: 'S1', conditionType: null, conditionOperator: null, conditionValue: null, isFreeGift: false, isDefault: false }];
    const state = makeState(steps, { step_1: { 'v1': 1 } });
    const result = validateStep('step_1', state, ConditionValidator);
    expect(result.valid).toBe(true);
  });
});

describe('validateBundle', () => {
  it('returns valid when all required steps are satisfied', () => {
    const steps = [makeStep('step_1', 'equal_to', 2), makeStep('step_2', 'equal_to', 1)];
    const state = makeState(steps, {
      step_1: { 'v1': 1, 'v2': 1 },
      step_2: { 'v3': 1 },
    });
    const result = validateBundle(state, ConditionValidator);
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual({});
  });

  it('returns errors for incomplete required steps', () => {
    const steps = [makeStep('step_1', 'equal_to', 2), makeStep('step_2', 'equal_to', 1)];
    const state = makeState(steps, {
      step_1: { 'v1': 1 }, // only 1, needs 2
      step_2: { 'v3': 1 },
    });
    const result = validateBundle(state, ConditionValidator);
    expect(result.valid).toBe(false);
    expect(result.errors['step_1']).toBeTruthy();
    expect(result.errors['step_2']).toBeUndefined();
  });

  it('skips free gift steps in validation', () => {
    const steps = [makeStep('step_1', 'equal_to', 2), makeStep('step_2', 'equal_to', 1, true)];
    const state = makeState(steps, {
      step_1: { 'v1': 1, 'v2': 1 },
      step_2: {}, // free gift not selected — should still pass
    });
    const result = validateBundle(state, ConditionValidator);
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual({});
  });

  it('skips default steps in validation', () => {
    const steps = [makeStep('step_1', 'equal_to', 1), makeStep('step_2', 'equal_to', 2, false, true)];
    const state = makeState(steps, {
      step_1: { 'v1': 1 },
      step_2: {}, // default step not selected — should still pass
    });
    const result = validateBundle(state, ConditionValidator);
    expect(result.valid).toBe(true);
  });

  it('returns valid true with empty errors object on full pass', () => {
    const steps = [makeStep('step_1', 'greater_than_or_equal_to', 1)];
    const state = makeState(steps, { step_1: { 'v1': 2 } });
    const result = validateBundle(state, ConditionValidator);
    expect(result.valid).toBe(true);
    expect(Object.keys(result.errors)).toHaveLength(0);
  });
});
