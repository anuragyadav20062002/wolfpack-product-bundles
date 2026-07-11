'use strict';

export function ppbExpandSingleStepCategoriesAsSteps(bundle) {
  if (!bundle?.useSingleStepCategoriesAsBundleSteps) return bundle;
  if (!Array.isArray(bundle.steps) || bundle.steps.length !== 1) return bundle;

  const [step] = bundle.steps;
  const categories = Array.isArray(step?.categories) ? step.categories : [];
  if (categories.length <= 1 || step?.isDefault || step?.isFreeGift) return bundle;

  return {
    ...bundle,
    steps: categories.map((category, categoryIndex) => {
      const categoryLabel = category?.pageTitle
        || category?.title
        || category?.name
        || `${step.pageTitle || step.name || 'Step'} ${categoryIndex + 1}`;
      const categoryKey = category?.id
        || category?.categoryId
        || category?.title
        || category?.name
        || categoryIndex + 1;

      return {
        ...step,
        id: `${step.id || 'step'}__category_${categoryKey}`,
        name: categoryLabel,
        pageTitle: categoryLabel,
        categories: [category],
        conditions: category?.conditions || step.conditions,
        _sourceStepId: step.id || null,
        _sourceCategoryId: category?.id || category?.categoryId || null,
        _sourceCategoryIndex: categoryIndex,
      };
    }),
  };
}
