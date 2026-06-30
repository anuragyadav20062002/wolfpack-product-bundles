// eslint-disable-next-line @typescript-eslint/no-require-imports
const { VariantSelectorComponent } = require('../../../app/assets/widgets/shared/variant-selector.js');

class FakeWrapper {
  querySelectorAll() {
    return [];
  }
}

class FakeCard {
  querySelector(selector: string) {
    if (selector === '.vs-wrapper') {
      return new FakeWrapper();
    }
    return null;
  }
}

describe('FPB Standard variant availability', () => {
  it('updates the product availability flag when variant selection falls back to an unavailable variant', () => {
    const product = {
      variantId: 'available-small',
      available: true,
      price: 1200,
      quantityAvailable: 3,
      currentlyNotInStock: false,
      variants: [
        {
          id: 'available-small',
          option1: 'Small',
          price: 1200,
          available: true,
          quantityAvailable: 3,
          currentlyNotInStock: false,
        },
        {
          id: 'sold-out-large',
          option1: 'Large',
          price: 1500,
          available: false,
          quantityAvailable: null,
          currentlyNotInStock: false,
        },
      ],
    };
    const onVariantChange = jest.fn();

    VariantSelectorComponent._selectPrimary(new FakeCard(), product, 1, 'Large', onVariantChange);

    expect(product.variantId).toBe('sold-out-large');
    expect(product.available).toBe(false);
    expect(product.quantityAvailable).toBeNull();
    expect(product.currentlyNotInStock).toBe(false);
    expect(onVariantChange).toHaveBeenCalledWith('sold-out-large', 'available-small');
  });
});
