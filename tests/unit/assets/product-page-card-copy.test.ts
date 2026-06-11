// eslint-disable-next-line @typescript-eslint/no-require-imports
const { resolveProductPageCardButtonText } = require('../../../app/assets/widgets/product-page/methods/modal-methods.js');

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
});
