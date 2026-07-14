export {};

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { ProductPageLayoutShellMethods } = require('../../../app/assets/widgets/product-page/methods/layout-shell-methods.js');

function createContext() {
  return {
    ...ProductPageLayoutShellMethods,
    activeInpageCategoryIndexes: { 0: 0 },
    extractId(value: string) {
      return String(value).split('/').pop();
    },
  };
}

const hydratedProduct = {
  id: '101',
  title: '18k Pedal Ring',
  variantId: '1001',
  variantTitle: '6',
  price: 39900,
  imageUrl: 'https://cdn.example/ring-6.jpg',
  sourceVariantCount: 2,
  variants: [
    {
      id: '1001',
      title: '6',
      price: 39900,
      compareAtPrice: null,
      available: true,
      image: { src: 'https://cdn.example/ring-6.jpg' },
    },
    {
      id: '1002',
      title: '10',
      price: 42900,
      compareAtPrice: 44900,
      available: true,
      image: { src: 'https://cdn.example/ring-10.jpg' },
    },
  ],
};

describe('PPB category-scoped variants', () => {
  it('keeps only explicitly configured variants and promotes the survivor to card identity', () => {
    const step = {
      categories: [{
        id: 'cat-10-only',
        products: [{
          id: 'gid://shopify/Product/101',
          variants: [{ id: 'gid://shopify/ProductVariant/1002' }],
        }],
      }],
    };

    const result = ProductPageLayoutShellMethods._filterProductsForInpageCategory.call(
      createContext(),
      step,
      [hydratedProduct],
      0,
    );

    expect(result).toEqual([
      expect.objectContaining({
        id: '101',
        variantId: '1002',
        variantTitle: '10',
        price: 42900,
        compareAtPrice: 44900,
        imageUrl: 'https://cdn.example/ring-10.jpg',
        variants: [expect.objectContaining({ id: '1002', title: '10' })],
      }),
    ]);
    expect(hydratedProduct.variantId).toBe('1001');
    expect(hydratedProduct.variants).toHaveLength(2);
  });

  it('keeps every hydrated variant when the category has no explicit subset', () => {
    const step = {
      categories: [{
        id: 'cat-all-variants',
        products: [{ id: 'gid://shopify/Product/101', variants: [] }],
      }],
    };

    const result = ProductPageLayoutShellMethods._filterProductsForInpageCategory.call(
      createContext(),
      step,
      [hydratedProduct],
      0,
    );

    expect(result).toEqual([hydratedProduct]);
  });
});
