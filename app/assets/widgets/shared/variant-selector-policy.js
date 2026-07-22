export function shouldRenderInlineVariantSelector({
  bundleVariantSelectorEnabled = true,
  product,
  displayVariantsAsIndividualProducts = false,
} = {}) {
  if (bundleVariantSelectorEnabled === false) return false;
  if (!product || !Array.isArray(product.variants) || product.variants.length <= 1) return false;
  if (displayVariantsAsIndividualProducts === true) return false;
  if (product.parentProductId && product.variants.length === 0) return false;
  return true;
}

export function getInlineVariantSelectorPresentation(designPreset) {
  switch (designPreset) {
    case 'STANDARD':
    case 'CLASSIC':
      return { type: 'dropdown', mobileMode: 'drawer' };
    case 'HORIZONTAL':
      return { type: 'dropdown', mobileMode: 'inline' };
    default:
      return { type: 'buttons', mobileMode: null };
  }
}
