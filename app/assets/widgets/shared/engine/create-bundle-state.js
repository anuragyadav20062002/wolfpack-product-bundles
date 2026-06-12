/**
 * Shared bundle state skeleton.
 *
 * This module is intentionally data-only. Renderers keep owning DOM updates
 * while the refactor moves selection math into shared selectors/actions.
 */

'use strict';

export function createBundleState(input = {}) {
  const bundle = input.bundle || null;
  const steps = Array.isArray(input.steps)
    ? input.steps
    : (Array.isArray(bundle?.steps) ? bundle.steps : []);

  return {
    bundle,
    steps,
    selectedProducts: cloneSelectedProducts(input.selectedProducts),
    stepProductData: Array.isArray(input.stepProductData) ? input.stepProductData : [],
    currentStepIndex: Number.isInteger(input.currentStepIndex) ? input.currentStepIndex : 0,
  };
}

export function cloneSelectedProducts(selectedProducts) {
  if (!Array.isArray(selectedProducts)) return [];

  return selectedProducts.map((stepSelections) => {
    if (!stepSelections || typeof stepSelections !== 'object') return {};
    return { ...stepSelections };
  });
}
