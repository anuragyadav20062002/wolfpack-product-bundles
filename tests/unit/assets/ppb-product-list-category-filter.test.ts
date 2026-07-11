export {};

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { ProductPageLayoutShellMethods } = require('../../../app/assets/widgets/product-page/methods/layout-shell-methods.js');

function createContext(activeIndex = 0) {
  return {
    ...ProductPageLayoutShellMethods,
    activeInpageCategoryIndexes: { 0: activeIndex },
    extractId(value: string) {
      return String(value).split('/').pop();
    },
  };
}

const PRODUCTS = [
  { id: 'gid://shopify/Product/101', title: 'First category product' },
  { parentProductId: 'gid://shopify/Product/202', title: 'Second category product' },
  { id: 'gid://shopify/Product/303', title: 'Other product' },
];

describe('PPB Product List category filtering', () => {
  it('filters products to the active category product ids', () => {
    const step = {
      categories: [
        { id: 'cat-a', products: [{ id: 'gid://shopify/Product/101' }] },
        { id: 'cat-b', selectedProducts: [{ productId: 'gid://shopify/Product/202' }] },
      ],
    };

    const result = ProductPageLayoutShellMethods._filterProductsForInpageCategory.call(
      createContext(1),
      step,
      PRODUCTS,
      0,
    );

    expect(result).toEqual([
      { parentProductId: 'gid://shopify/Product/202', title: 'Second category product' },
    ]);
  });

  it('returns no products for an empty manual active category', () => {
    const step = {
      categories: [
        { id: 'cat-a', products: [{ id: 'gid://shopify/Product/101' }] },
        { id: 'cat-empty', products: [], selectedProducts: [] },
      ],
    };

    const result = ProductPageLayoutShellMethods._filterProductsForInpageCategory.call(
      createContext(1),
      step,
      PRODUCTS,
      0,
    );

    expect(result).toEqual([]);
  });

  it('preserves hydrated products for collection-backed active categories', () => {
    const step = {
      categories: [
        { id: 'cat-a', products: [{ id: 'gid://shopify/Product/101' }] },
        { id: 'cat-collection', collectionsSelectedData: [{ handle: 'earrings' }] },
      ],
    };

    const result = ProductPageLayoutShellMethods._filterProductsForInpageCategory.call(
      createContext(1),
      step,
      PRODUCTS,
      0,
    );

    expect(result).toBe(PRODUCTS);
  });
});
