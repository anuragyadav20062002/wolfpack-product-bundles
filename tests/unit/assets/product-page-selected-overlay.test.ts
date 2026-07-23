export {};

// eslint-disable-next-line @typescript-eslint/no-require-imports
const {
  ProductPageSelectionMethods,
} = require('../../../app/assets/widgets/product-page/methods/selection-methods.js');

function createContext(marker: { remove: jest.Mock } | null = null) {
  const productCard = {
    classList: {
      contains: jest.fn(() => false),
      add: jest.fn(),
      remove: jest.fn(),
    },
    querySelector: jest.fn((selector: string) => (
      selector === '.selected-overlay' ? marker : null
    )),
    ownerDocument: {
      createElement: jest.fn(() => ({ style: {} })),
    },
    prepend: jest.fn(),
  };
  const context = {
    elements: { modal: null },
    container: { querySelector: jest.fn(() => productCard) },
    selectedBundle: { steps: [{}], validateQuantityPerProduct: null },
    getVariantAvailable: jest.fn(() => ({ available: null, outOfStock: false })),
    _resolveText: jest.fn((_key: string, fallback: string) => fallback),
  };

  return { context, productCard };
}

describe('PPB selected product marker', () => {
  it('does not create a tick badge when a card becomes selected', () => {
    const { context, productCard } = createContext();

    ProductPageSelectionMethods.updateProductQuantityDisplay.call(context, 0, 'variant-1', 1);

    expect(productCard.prepend).not.toHaveBeenCalled();
    expect(productCard.ownerDocument.createElement).not.toHaveBeenCalled();
  });

  it('removes a stale tick badge while updating selection state', () => {
    const marker = { remove: jest.fn() };
    const { context } = createContext(marker);

    ProductPageSelectionMethods.updateProductQuantityDisplay.call(context, 0, 'variant-1', 1);

    expect(marker.remove).toHaveBeenCalledTimes(1);
  });
});
