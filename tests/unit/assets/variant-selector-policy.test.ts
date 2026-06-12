// eslint-disable-next-line @typescript-eslint/no-require-imports
const { shouldRenderInlineVariantSelector } = require('../../../app/assets/widgets/shared/variant-selector-policy.js');

describe('variant selector runtime policy', () => {
  const multiVariantProduct = {
    id: 'gid://shopify/Product/1',
    variants: [
      { id: 'gid://shopify/ProductVariant/1', title: 'Small' },
      { id: 'gid://shopify/ProductVariant/2', title: 'Large' },
    ],
  };

  it('allows inline selectors for non-expanded multi-variant product cards when bundle setting is enabled', () => {
    expect(shouldRenderInlineVariantSelector({
      bundleVariantSelectorEnabled: true,
      product: multiVariantProduct,
      displayVariantsAsIndividualProducts: false,
    })).toBe(true);
  });

  it('disables inline selectors when the bundle setting is disabled', () => {
    expect(shouldRenderInlineVariantSelector({
      bundleVariantSelectorEnabled: false,
      product: multiVariantProduct,
      displayVariantsAsIndividualProducts: false,
    })).toBe(false);
  });

  it('suppresses inline selectors for expanded variant cards', () => {
    expect(shouldRenderInlineVariantSelector({
      bundleVariantSelectorEnabled: true,
      product: {
        id: 'gid://shopify/Product/1',
        parentProductId: 'gid://shopify/Product/1',
        variants: [],
      },
      displayVariantsAsIndividualProducts: true,
    })).toBe(false);
  });

  it('suppresses inline selectors for single-variant products', () => {
    expect(shouldRenderInlineVariantSelector({
      bundleVariantSelectorEnabled: true,
      product: {
        id: 'gid://shopify/Product/1',
        variants: [{ id: 'gid://shopify/ProductVariant/1', title: 'Default Title' }],
      },
      displayVariantsAsIndividualProducts: false,
    })).toBe(false);
  });
});
