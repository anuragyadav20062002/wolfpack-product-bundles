// eslint-disable-next-line @typescript-eslint/no-require-imports
const { shouldHideInpageStepChrome } = require('../../../app/assets/widgets/product-page/methods/layout-shell-methods.js');

describe('PPB Product List single-step chrome behavior', () => {
  it('hides step and category chrome for a single-step single-category Cascade bundle', () => {
    expect(shouldHideInpageStepChrome({
      isCascade: true,
      steps: [{ categories: [{ id: 'category-1' }] }],
      step: { categories: [{ id: 'category-1' }] },
    })).toBe(true);
  });

  it('keeps category chrome for a multi-category Cascade bundle', () => {
    expect(shouldHideInpageStepChrome({
      isCascade: true,
      steps: [{ categories: [{ id: 'category-1' }, { id: 'category-2' }] }],
      step: { categories: [{ id: 'category-1' }, { id: 'category-2' }] },
    })).toBe(false);
  });

  it('keeps step chrome for non-Cascade templates', () => {
    expect(shouldHideInpageStepChrome({
      isCascade: false,
      steps: [{ categories: [{ id: 'category-1' }] }],
      step: { categories: [{ id: 'category-1' }] },
    })).toBe(false);
  });
});
