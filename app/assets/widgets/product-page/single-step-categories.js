'use strict';

function normalizeConditionType(value) {
  if (typeof value !== 'string') return value;
  return value.trim().toLowerCase();
}

function normalizeConditionOperator(value) {
  if (typeof value !== 'string') return value;
  const normalized = value.trim();
  if (normalized.indexOf('_') !== -1) return normalized.toLowerCase();
  return normalized.replace(/([A-Z])/g, '_$1').toLowerCase();
}

function normalizeConditionValue(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : value;
}

function cloneConditionFields(conditions, fallbackCondition, fallbackStep) {
  const sourceConditions = Array.isArray(conditions)
    ? conditions
    : (Array.isArray(fallbackCondition) ? fallbackCondition : undefined);
  const conditionsArray = Array.isArray(sourceConditions) ? sourceConditions : [];

  const primary = conditionsArray[0] || {};
  const secondary = conditionsArray[1] || {};

  const normalizedPrimaryType = normalizeConditionType(
    primary?.type
    ?? primary?.conditionType
    ?? fallbackStep?.conditionType
  );
  const normalizedPrimaryOperator = normalizeConditionOperator(
    primary?.operator
    ?? primary?.condition
    ?? primary?.conditionOperator
    ?? fallbackStep?.conditionOperator
  );
  const normalizedPrimaryValue = normalizeConditionValue(
    primary?.value ?? fallbackStep?.conditionValue,
  );

  const normalizedSecondaryType = normalizeConditionType(
    secondary?.type
    ?? secondary?.conditionType
    ?? fallbackStep?.conditionType2
  );
  const normalizedSecondaryOperator = normalizeConditionOperator(
    secondary?.operator
    ?? secondary?.condition
    ?? secondary?.conditionOperator
    ?? fallbackStep?.conditionOperator2
  );
  const normalizedSecondaryValue = normalizeConditionValue(
    secondary?.value ?? fallbackStep?.conditionValue2,
  );

  const next = {
    conditions: sourceConditions,
  };

  if (normalizedPrimaryType != null) next.conditionType = normalizedPrimaryType;
  if (normalizedPrimaryOperator != null) next.conditionOperator = normalizedPrimaryOperator;
  if (normalizedPrimaryValue != null) next.conditionValue = normalizedPrimaryValue;

  if (normalizedSecondaryType != null) next.conditionType2 = normalizedSecondaryType;
  if (normalizedSecondaryOperator != null) next.conditionOperator2 = normalizedSecondaryOperator;
  if (normalizedSecondaryValue != null) next.conditionValue2 = normalizedSecondaryValue;

  return next;
}

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
        ...cloneConditionFields(category?.conditions, step.conditions, step),
        _sourceStepId: step.id || null,
        _sourceCategoryId: category?.id || category?.categoryId || null,
        _sourceCategoryIndex: categoryIndex,
      };
    }),
  };
}
