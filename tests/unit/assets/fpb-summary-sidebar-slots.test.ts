export {};

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { fullPageValidationAddonsMethods } = require('../../../app/assets/widgets/full-page/methods/validation-addons-methods.js');

function makeContext(steps: any[]) {
  return {
    selectedBundle: { steps },
  };
}

describe('fullPageValidationAddonsMethods.getSummarySidebarMaxItemCount', () => {
  it('sums enabled step max quantities for the full bundle capacity', () => {
    const count = fullPageValidationAddonsMethods.getSummarySidebarMaxItemCount.call(
      makeContext([
        { enabled: true, minQuantity: 1, maxQuantity: 1 },
        { enabled: true, minQuantity: 1, maxQuantity: 3 },
      ]),
    );

    expect(count).toBe(4);
  });

  it('ignores disabled steps when calculating summary sidebar capacity', () => {
    const count = fullPageValidationAddonsMethods.getSummarySidebarMaxItemCount.call(
      makeContext([
        { enabled: true, minQuantity: 1, maxQuantity: 2 },
        { enabled: false, minQuantity: 1, maxQuantity: 5 },
      ]),
    );

    expect(count).toBe(2);
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
