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
