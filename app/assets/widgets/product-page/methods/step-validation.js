export function isProductPageStepRequiredForValidation(step = {}) {
  if (!step || step.enabled === false || step.isFreeGift || step.isDefault) {
    return false;
  }

  const products = Array.isArray(step.products) ? step.products : [];
  const collections = Array.isArray(step.collections) ? step.collections : [];
  if (products.length > 0 || collections.length > 0) {
    return true;
  }

  const categories = Array.isArray(step.categories) ? step.categories : [];
  return categories.some((category) => {
    const categoryProducts = Array.isArray(category?.products) ? category.products : [];
    const categoryCollections = Array.isArray(category?.collections) ? category.collections : [];
    return categoryProducts.length > 0 || categoryCollections.length > 0;
  });
}

export function areRequiredProductPageStepsValid(steps = [], validateStep = () => false) {
  if (!Array.isArray(steps)) return true;
  return steps.every((step, index) => {
    if (!isProductPageStepRequiredForValidation(step)) return true;
    return validateStep(index);
  });
}

export function getLastRequiredProductPageStepIndex(steps = []) {
  if (!Array.isArray(steps)) return -1;
  for (let index = steps.length - 1; index >= 0; index -= 1) {
    if (isProductPageStepRequiredForValidation(steps[index])) {
      return index;
    }
  }
  return -1;
}
