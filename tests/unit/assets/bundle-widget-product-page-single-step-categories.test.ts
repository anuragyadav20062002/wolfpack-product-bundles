import { readProductPageWidgetSources } from './widget-source-helpers';
describe('PPB single-step categories-as-steps storefront contract', () => {
  const source = readProductPageWidgetSources();

  it('exposes the category-step expansion helper for focused runtime testing', () => {
    expect(source).toContain('function ppbExpandSingleStepCategoriesAsSteps(bundle)');
    expect(source).toContain('ppbExpandSingleStepCategoriesAsSteps,');
  });

  it('applies the helper immediately after bundle selection', () => {
    expect(source).toContain('this.selectedBundle = ppbExpandSingleStepCategoriesAsSteps(');
    expect(source).toContain('BundleDataManager.selectBundle(this.bundleData, this.config)');
  });

  it('turns one multi-category step into one-category visible steps', () => {
    expect(source).toContain('bundle?.useSingleStepCategoriesAsBundleSteps');
    expect(source).toContain('bundle.steps.length !== 1');
    expect(source).toContain('categories.length <= 1 || step?.isDefault || step?.isFreeGift');
    expect(source).toContain('categories: [category]');
    expect(source).toContain('_sourceCategoryIndex: categoryIndex');
  });
});
