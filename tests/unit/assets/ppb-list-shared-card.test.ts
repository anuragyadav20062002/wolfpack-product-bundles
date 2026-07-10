// eslint-disable-next-line @typescript-eslint/no-require-imports
const { ProductPageInpageRenderMethods } = require('../../../app/assets/widgets/product-page/methods/inpage-render-methods.js');

class FakeClassList {
  toggle(_name: string, _value?: boolean) {}
}

class FakeTarget {
  classList = new FakeClassList();
  innerHTML = '';
  isConnected = true;
}

function createContext(overrides = {}) {
  return {
    stepProductData: [[
      {
        id: 'product-1',
        variantId: 'variant-1',
        title: 'Selected list product',
        imageUrl: 'https://cdn.shopify.com/product.jpg',
        price: 1299,
      },
      {
        id: 'product-2',
        variantId: 'variant-2',
        title: 'Sold out list product',
        imageUrl: 'https://cdn.shopify.com/sold-out.jpg',
        price: 1599,
      },
    ]],
    selectedProducts: [{ 'variant-1': 2 }],
    selectedBundle: {
      steps: [{}],
      validateQuantityPerProduct: null,
      variantSelectorEnabled: true,
    },
    _filterProductsForInpageCategory: (_step: unknown, products: unknown[]) => products,
    expandProductsByVariant: (products: unknown[]) => products,
    _isProductPageCascadeTemplate: () => true,
    _isProductPageGridTemplate: () => false,
    _usesCompactInpageProductCards: () => true,
    getSelectedQuantity: (_stepIndex: number, selectionKey: string) => selectionKey === 'variant-1' ? 2 : 0,
    getVariantAvailable: (_stepIndex: number, selectionKey: string) => selectionKey === 'variant-2'
      ? { available: 0, outOfStock: true }
      : { available: null, outOfStock: false },
    _shouldShowProductComparedAtPrice: () => false,
    renderInlineCardVariantSelector: jest.fn((product: { variantId?: string }) => (
      `<select data-variant-selector-for="${product.variantId ?? ''}"></select>`
    )),
    attachProductEventHandlers: jest.fn(),
    ...overrides,
  };
}

function findButtonForProduct(html: string, productId: string) {
  const markerIndex = html.indexOf(`data-product-id="${productId}"`);
  if (markerIndex === -1) return '';

  const startIndex = html.lastIndexOf('<button', markerIndex);
  const endIndex = html.indexOf('</button>', markerIndex);
  if (startIndex === -1 || endIndex === -1) return '';

  return html.slice(startIndex, endIndex + '</button>'.length);
}

describe('PPB List shared product cards', () => {
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

  it('renders CASCADE rows with selected quantities, variant controls, and disabled sold-out actions', () => {
    const target = new FakeTarget();
    const context = createContext();

    ProductPageInpageRenderMethods._renderInpageStepProducts.call(context, 0, target);

    expect(context.renderInlineCardVariantSelector).toHaveBeenCalledTimes(2);
    expect(target.innerHTML).toContain('Selected list product');
    expect(target.innerHTML).toContain('data-product-id="variant-1"');
    expect(target.innerHTML).toContain('data-variant-selector-for="variant-1"');
    expect(target.innerHTML).toContain('>2</span>');
    expect(target.innerHTML).toContain('Sold out list product');
    expect(target.innerHTML).toContain('data-product-id="variant-2"');
    expect(target.innerHTML).toContain('data-variant-selector-for="variant-2"');

    const soldOutButton = findButtonForProduct(target.innerHTML, 'variant-2');
    expect(soldOutButton).toContain('disabled');
    expect(soldOutButton).toContain('aria-disabled="true"');
    expect(soldOutButton).toContain('Out of stock');
  });
});
