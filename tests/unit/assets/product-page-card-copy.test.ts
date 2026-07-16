// eslint-disable-next-line @typescript-eslint/no-require-imports
const {
  ProductPageModalMethods,
  resolveProductPageCardButtonText,
  resolveProductPageInlineAddText,
} = require('../../../app/assets/widgets/product-page/methods/modal-methods.js');

describe('PPB product card button copy', () => {
  it('interpolates selected quantity tokens instead of rendering raw template copy', () => {
    expect(resolveProductPageCardButtonText({
      currentQuantity: 1,
      currentStep: { addonReplaceText: 'Added x{{allowedQuantity}}' },
      outOfStock: false,
      defaultAddText: 'Add to Cart',
    })).toBe('Added x1');
  });

  it('keeps PPB modal add copy for unselected products', () => {
    expect(resolveProductPageCardButtonText({
      currentQuantity: 0,
      currentStep: {},
      outOfStock: false,
      defaultAddText: 'Add to Cart',
    })).toBe('Add to Cart');
  });

  it('uses quantity-aware selected copy when no replacement text is configured', () => {
    expect(resolveProductPageCardButtonText({
      currentQuantity: 2,
      currentStep: {},
      outOfStock: false,
      defaultAddText: 'Add to Cart',
    })).toBe('Added x2');
  });

  it('resolves PPB inline product-card add copy before modal add copy', () => {
    const resolveText = jest.fn((key, fallback) => ({
      productCardAddButton: 'Modal Add',
      productCardInlineAddButton: 'Inline Add +',
    }[key] || fallback));

    expect(resolveProductPageInlineAddText(resolveText)).toBe('Inline Add +');
  });

  it('falls back to modal product-card add copy for inline cards', () => {
    const resolveText = jest.fn((key, fallback) => ({
      productCardAddButton: 'Modal Add',
    }[key] || fallback));

    expect(resolveProductPageInlineAddText(resolveText)).toBe('Modal Add');
  });

  it('renders the active Product Page variant label on variant selectors', () => {
    const html = ProductPageModalMethods.renderVariantSelector.call(
      {
        _resolveText: (key, fallback) => (key === 'productVariantLabel' ? 'Choose Variant' : fallback),
        isInventoryTrackingOnAddToCartEnabled: () => false,
      },
      {
        id: 'product-1',
        variantId: 'variant-1',
        variants: [
          { id: 'variant-1', title: 'Small', available: true },
          { id: 'variant-2', title: 'Large', available: true },
        ],
      },
    );

    expect(html).toContain('aria-label="Choose Variant"');
    expect(html).toContain('Choose Variant');
  });
});
