export {};

// eslint-disable-next-line @typescript-eslint/no-require-imports
const {
  syncProductPageSelectedOverlay,
} = require('../../../app/assets/widgets/product-page/methods/selection-methods.js');

describe('PPB selected product marker', () => {
  it('creates the marker when an initially empty card becomes selected', () => {
    let marker: Record<string, unknown> | null = null;
    const productCard = {
      querySelector: jest.fn(() => marker),
      ownerDocument: {
        createElement: jest.fn(() => ({ style: {} })),
      },
      prepend: jest.fn((node) => {
        marker = node;
      }),
    };

    const result = syncProductPageSelectedOverlay(productCard, 1);

    expect(productCard.prepend).toHaveBeenCalledWith(result);
    // The unit uses a minimal DOM double because the unit project runs in Node.
    // eslint-disable-next-line jest-dom/prefer-to-have-text-content
    expect(result.textContent).toBe('✓');
  });

  it('does not create a marker for an unselected card', () => {
    const productCard = {
      querySelector: jest.fn(() => null),
      ownerDocument: {
        createElement: jest.fn(),
      },
      prepend: jest.fn(),
    };

    expect(syncProductPageSelectedOverlay(productCard, 0)).toBeNull();
    expect(productCard.prepend).not.toHaveBeenCalled();
  });
});
