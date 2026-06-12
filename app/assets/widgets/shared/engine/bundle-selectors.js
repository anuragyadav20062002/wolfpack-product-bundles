/**
 * Shared bundle selectors.
 *
 * Selectors accept the current widget-shaped state so FPB and PPB can adopt
 * them gradually without changing render ownership.
 */

'use strict';

export function getCurrentStep(state) {
  const steps = Array.isArray(state?.steps) ? state.steps : [];
  return steps[state?.currentStepIndex || 0] || null;
}

export function getSelectedQuantity(state) {
  return getSelectedEntries(state).reduce((total, entry) => total + entry.quantity, 0);
}

export function getSelectedSubtotalCents(state) {
  return getSelectedEntries(state).reduce((total, entry) => {
    const product = findProductByVariantId(state, entry.variantId);
    const price = Number(product?.price || 0);
    return total + (price * entry.quantity);
  }, 0);
}

export function getDiscountProgressData({ currentValue = 0, targetValue = 0, message = '' } = {}) {
  const current = Math.max(0, Number(currentValue || 0));
  const target = Math.max(0, Number(targetValue || 0));
  const progressPercent = target > 0
    ? Math.max(0, Math.min(100, Math.round((current / target) * 100)))
    : 0;

  return {
    currentValue: current,
    targetValue: target,
    progressPercent,
    message: String(message || ''),
    success: target > 0 && current >= target,
  };
}

export function getSelectedEntries(state) {
  const selectedProducts = Array.isArray(state?.selectedProducts) ? state.selectedProducts : [];
  const entries = [];

  selectedProducts.forEach((stepSelections, stepIndex) => {
    if (!stepSelections || typeof stepSelections !== 'object') return;

    Object.entries(stepSelections).forEach(([variantId, quantity]) => {
      const normalizedQuantity = Number(quantity || 0);
      if (normalizedQuantity <= 0) return;
      entries.push({ stepIndex, variantId, quantity: normalizedQuantity });
    });
  });

  return entries;
}

export function getSelectedProductEntries(state, options = {}) {
  const stepProductData = Array.isArray(state?.stepProductData) ? state.stepProductData : [];
  const normalizeSelectionKey = options.normalizeSelectionKey || ((value) => String(value));

  return getSelectedEntries(state).reduce((entries, entry) => {
    const sourceProducts = stepProductData[entry.stepIndex] || [];
    const products = typeof options.expandProductsByStep === 'function'
      ? options.expandProductsByStep(sourceProducts, entry.stepIndex)
      : sourceProducts;
    const product = (Array.isArray(products) ? products : []).find((candidate) =>
      normalizeSelectionKey(candidate?.variantId || candidate?.id) === normalizeSelectionKey(entry.variantId)
    );

    if (!product) return entries;

    entries.push({ ...entry, product });
    return entries;
  }, []);
}

export function getTimelineEntryState({
  entry = {},
  currentStepIndex = 0,
  isCompleted = false,
  isAccessible = true,
  hasMultipleCategoryEntry = false,
} = {}) {
  const step = entry.step || {};
  const isDefaultStep = step.isDefault === true;
  const isCategoryEntry = entry.type === 'multiple_categories';
  const isCurrent = Number(entry.stepIndex) === Number(currentStepIndex)
    && (!hasMultipleCategoryEntry || isCategoryEntry);
  const completed = Boolean(isCompleted);
  const accessible = isAccessible !== false;
  const classes = [];

  if (isDefaultStep) classes.push('timeline-step--included');
  if (isCurrent) classes.push('timeline-step--active');
  if (completed) classes.push('timeline-step--completed');
  if (!isCurrent && !completed) classes.push('timeline-step--inactive');
  if (!accessible) classes.push('timeline-step--locked');

  return {
    isDefaultStep,
    isCurrent,
    isCompleted: completed,
    isAccessible: accessible,
    classes,
  };
}

function findProductByVariantId(state, variantId) {
  const stepProductData = Array.isArray(state?.stepProductData) ? state.stepProductData : [];

  for (const products of stepProductData) {
    if (!Array.isArray(products)) continue;
    const product = products.find((item) => String(item?.variantId) === String(variantId));
    if (product) return product;
  }

  return null;
}
