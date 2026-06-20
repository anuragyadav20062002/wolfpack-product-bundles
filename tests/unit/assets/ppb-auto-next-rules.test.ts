// eslint-disable-next-line @typescript-eslint/no-require-imports
const { shouldAutoAdvanceProductPageStep } = require('../../../app/assets/widgets/product-page/methods/selection-methods.js');

describe('PPB auto-next rule decision', () => {
  it('does not auto-next for step rules', () => {
    expect(shouldAutoAdvanceProductPageStep({
      quantity: 1,
      step: {
        conditionType: 'quantity',
        conditionOperator: 'greater_than_or_equal',
        conditionValue: 1,
      },
    })).toBe(false);
  });

  it('does not auto-next for category rules when the category flag is disabled', () => {
    expect(shouldAutoAdvanceProductPageStep({
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
    expect(shouldAutoAdvanceProductPageStep({
      quantity: 1,
      productId: '101',
      step: {
        categories: [{
          products: [{ id: '101' }],
          conditions: [{ type: 'quantity', condition: 'greaterThanOrEqualTo', value: '01' }],
          autoNextStepOnConditionMet: true,
        }],
      },
    })).toBe(true);
  });

  it('does not auto-next on removals', () => {
    expect(shouldAutoAdvanceProductPageStep({
      quantity: 0,
      step: {
        categories: [{
          conditions: [{ type: 'quantity', condition: 'greaterThanOrEqualTo', value: '01' }],
          autoNextStepOnConditionMet: true,
        }],
      },
    })).toBe(false);
  });

  it('does not auto-next when only a different category opted in', () => {
    expect(shouldAutoAdvanceProductPageStep({
      quantity: 1,
      productId: '101',
      step: {
        categories: [
          {
            products: [{ id: '101' }],
            conditions: [{ type: 'quantity', condition: 'greaterThanOrEqualTo', value: '01' }],
            autoNextStepOnConditionMet: false,
          },
          {
            products: [{ id: '202' }],
            conditions: [{ type: 'quantity', condition: 'greaterThanOrEqualTo', value: '01' }],
            autoNextStepOnConditionMet: true,
          },
        ],
      },
    })).toBe(false);
  });
});
