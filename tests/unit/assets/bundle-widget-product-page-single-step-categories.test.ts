// eslint-disable-next-line @typescript-eslint/no-require-imports
const { ppbExpandSingleStepCategoriesAsSteps } = require('../../../app/assets/widgets/product-page/single-step-categories.js');

describe('PPB single-step categories-as-steps storefront contract', () => {
  it('turns one multi-category step into one visible step per category', () => {
    const bundle = {
      useSingleStepCategoriesAsBundleSteps: true,
      steps: [{
        id: 'productsData1',
        name: 'Choose products',
        pageTitle: 'Choose products',
        conditions: [{ type: 'quantity', value: 2 }],
        categories: [
          { id: 'cat-a', name: 'Category A', conditions: [{ type: 'quantity', value: 1 }] },
          { id: 'cat-b', pageTitle: 'Category B' },
        ],
      }],
    };

    const expanded = ppbExpandSingleStepCategoriesAsSteps(bundle);

    expect(expanded.steps).toHaveLength(2);
    expect(expanded.steps[0]).toMatchObject({
      id: 'productsData1__category_cat-a',
      name: 'Category A',
      pageTitle: 'Category A',
      categories: [{ id: 'cat-a', name: 'Category A', conditions: [{ type: 'quantity', value: 1 }] }],
      conditions: [{ type: 'quantity', value: 1 }],
      _sourceStepId: 'productsData1',
      _sourceCategoryId: 'cat-a',
      _sourceCategoryIndex: 0,
    });
    expect(expanded.steps[1]).toMatchObject({
      id: 'productsData1__category_cat-b',
      name: 'Category B',
      pageTitle: 'Category B',
      categories: [{ id: 'cat-b', pageTitle: 'Category B' }],
      conditions: [{ type: 'quantity', value: 2 }],
      _sourceCategoryIndex: 1,
    });
  });

  it('does not mutate or expand when the control is off', () => {
    const bundle = {
      useSingleStepCategoriesAsBundleSteps: false,
      steps: [{ id: 'step-1', categories: [{ id: 'cat-a' }, { id: 'cat-b' }] }],
    };

    expect(ppbExpandSingleStepCategoriesAsSteps(bundle)).toBe(bundle);
  });

  it('does not expand default or free-gift steps', () => {
    const defaultBundle = {
      useSingleStepCategoriesAsBundleSteps: true,
      steps: [{ id: 'default-step', isDefault: true, categories: [{ id: 'cat-a' }, { id: 'cat-b' }] }],
    };
    const giftBundle = {
      useSingleStepCategoriesAsBundleSteps: true,
      steps: [{ id: 'gift-step', isFreeGift: true, categories: [{ id: 'cat-a' }, { id: 'cat-b' }] }],
    };

    expect(ppbExpandSingleStepCategoriesAsSteps(defaultBundle)).toBe(defaultBundle);
    expect(ppbExpandSingleStepCategoriesAsSteps(giftBundle)).toBe(giftBundle);
  });
});
