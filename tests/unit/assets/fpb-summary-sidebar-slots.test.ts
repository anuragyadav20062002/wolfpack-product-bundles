export {};

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { fullPageValidationAddonsMethods } = require('../../../app/assets/widgets/full-page/methods/validation-addons-methods.js');

function makeContext(steps: any[]) {
  return Object.assign(Object.create(fullPageValidationAddonsMethods), {
    selectedBundle: { steps },
  });
}

describe('fullPageValidationAddonsMethods.getSummarySidebarMaxItemCount', () => {
  it('sums configured required quantities from step quantity conditions', () => {
    const count = fullPageValidationAddonsMethods.getSummarySidebarMaxItemCount.call(
      makeContext([
        { enabled: true, conditionType: 'QUANTITY', conditionOperator: 'greater_than_or_equal_to', conditionValue: 2 },
        { enabled: true, conditionType: 'QUANTITY', conditionOperator: 'equal_to', conditionValue: 3 },
      ]),
    );

    expect(count).toBe(5);
  });

  it('falls back to one row when there is no explicit required-quantity condition', () => {
    const count = fullPageValidationAddonsMethods.getSummarySidebarMaxItemCount.call(
      makeContext([
        { enabled: true, minQuantity: 1 },
        { enabled: false, minQuantity: 1, maxQuantity: 5 },
      ]),
    );

    expect(count).toBe(1);
  });

  it('keeps enough rows for selected products when selected count exceeds configured fallback', () => {
    const count = fullPageValidationAddonsMethods.getSummarySidebarMaxItemCount.call(
      makeContext([
        { enabled: true, minQuantity: 2 },
      ]),
      4,
    );

    expect(count).toBe(4);
  });
});

describe('fullPageValidationAddonsMethods.getSummarySidebarEmptyStateMode', () => {
  it('uses inline slots when Product Slots is enabled', () => {
    const mode = fullPageValidationAddonsMethods.getSummarySidebarEmptyStateMode.call({
      _shouldRenderProductSlots: () => true,
    });

    expect(mode).toBe('slots');
  });

  it('uses skeleton rows when Product Slots is disabled', () => {
    const mode = fullPageValidationAddonsMethods.getSummarySidebarEmptyStateMode.call({
      _shouldRenderProductSlots: () => false,
    });

    expect(mode).toBe('skeletons');
  });
});
