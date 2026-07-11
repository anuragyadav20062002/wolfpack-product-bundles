export {};

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { ProductPageInpageRenderMethods } = require('../../../app/assets/widgets/product-page/methods/inpage-render-methods.js');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { ProductPageLayoutShellMethods } = require('../../../app/assets/widgets/product-page/methods/layout-shell-methods.js');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { ProductPageSelectionDataMethods } = require('../../../app/assets/widgets/product-page/methods/selection-data-methods.js');

class FakeClassList {
  toggle(_name: string, _value?: boolean) {}
}

class FakeTarget {
  classList = new FakeClassList();
  innerHTML = '';
  isConnected = true;
}

const multiVariantProduct = {
  id: 'gid://shopify/Product/101',
  title: 'Variant Product',
  imageUrl: 'https://cdn.shopify.com/product.jpg',
  variants: [
    {
      id: 'gid://shopify/ProductVariant/1001',
      title: 'Small',
      price: 1000,
      available: true,
    },
    {
      id: 'gid://shopify/ProductVariant/1002',
      title: 'Large',
      price: 1200,
      available: true,
    },
  ],
};

function createContext(displayVariantsAsIndividualProducts: boolean) {
  return {
    ...ProductPageInpageRenderMethods,
    ...ProductPageLayoutShellMethods,
    ...ProductPageSelectionDataMethods,
    stepProductData: [[multiVariantProduct]],
    selectedProducts: [{}],
    selectedBundle: {
      steps: [{
        id: 'productsData1',
        categories: [{
          id: 'cat-variants',
          products: [{ id: 'gid://shopify/Product/101' }],
          displayVariantsAsIndividualProducts,
        }],
      }],
      validateQuantityPerProduct: null,
      variantSelectorEnabled: true,
    },
    activeInpageCategoryIndexes: { 0: 0 },
    _isProductPageCascadeTemplate: () => true,
    _isProductPageGridTemplate: () => false,
    _usesCompactInpageProductCards: () => true,
    extractId(value: string) {
      return String(value).split('/').pop();
    },
    getSelectedQuantity: () => 0,
    getVariantAvailable: () => ({ available: null, outOfStock: false }),
    _shouldShowProductComparedAtPrice: () => false,
    renderInlineCardVariantSelector: jest.fn((product: { variants?: unknown[]; title?: string }) => (
      Array.isArray(product.variants)
        ? `<select data-grouped-product="${product.title ?? ''}"></select>`
        : ''
    )),
    attachProductEventHandlers: jest.fn(),
  };
}

describe('PPB Product List category variant display', () => {
  const originalWindow = global.window;

  beforeEach(() => {
    global.window = {
      Shopify: {
        currency: {
          active: 'USD',
          format: ['$', '{{amount}}'].join(''),
        },
      },
    } as unknown as Window & typeof globalThis;
  });

  afterEach(() => {
    global.window = originalWindow;
  });

  it('keeps grouped variants when the active category flag is false', () => {
    const target = new FakeTarget();
    const context = createContext(false);

    ProductPageInpageRenderMethods._renderInpageStepProducts.call(context, 0, target);

    expect(context.renderInlineCardVariantSelector).toHaveBeenCalledTimes(1);
    expect(context.renderInlineCardVariantSelector).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Variant Product',
        variants: expect.any(Array),
      }),
      context.selectedBundle.steps[0],
    );
    expect(target.innerHTML).toContain('Variant Product');
    expect(target.innerHTML).toContain('data-grouped-product="Variant Product"');
    expect(target.innerHTML).not.toContain('Variant Product - Small');
    expect(target.innerHTML).not.toContain('Variant Product - Large');
  });

  it('expands available variants when the active category flag is true', () => {
    const target = new FakeTarget();
    const context = createContext(true);

    ProductPageInpageRenderMethods._renderInpageStepProducts.call(context, 0, target);

    expect(context.renderInlineCardVariantSelector).toHaveBeenCalledTimes(2);
    expect(target.innerHTML).toContain('Variant Product');
    expect(target.innerHTML).toContain('Small');
    expect(target.innerHTML).toContain('Large');
    expect(target.innerHTML).not.toContain('data-grouped-product="Variant Product"');
  });
});
