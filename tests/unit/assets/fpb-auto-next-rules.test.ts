export {};

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { shouldAutoAdvanceFullPageStep } = require('../../../app/assets/widgets/full-page/methods/selection-navigation-methods.js');

describe('FPB auto-next rule decision', () => {
  it('does not auto-next for step rules', () => {
    expect(shouldAutoAdvanceFullPageStep({
      quantity: 1,
      step: {
        conditionType: 'quantity',
        conditionOperator: 'greater_than_or_equal',
        conditionValue: 1,
      },
    })).toBe(false);
  });

  it('does not auto-next for category rules when the category flag is disabled', () => {
    expect(shouldAutoAdvanceFullPageStep({
      quantity: 1,
      step: {
        categories: [{
          conditions: [{ type: 'quantity', condition: 'greaterThanOrEqualTo', value: '01' }],
          autoNextStepOnConditionMet: false,
        }],
      },
    })).toBe(false);
  });

  it('auto-nexts for category rules when the category flag is enabled', () => {
    expect(shouldAutoAdvanceFullPageStep({
      quantity: 1,
      step: {
        categories: [{
          conditions: [{ type: 'quantity', condition: 'greaterThanOrEqualTo', value: '01' }],
          autoNextStepOnConditionMet: true,
        }],
      },
    })).toBe(true);
  });

  it('does not auto-next on removals', () => {
    expect(shouldAutoAdvanceFullPageStep({
      quantity: 0,
      step: {
        categories: [{
          conditions: [{ type: 'quantity', condition: 'greaterThanOrEqualTo', value: '01' }],
          autoNextStepOnConditionMet: true,
        }],
      },
    })).toBe(false);
  });
});
