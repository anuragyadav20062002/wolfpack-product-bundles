export {};

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { VariantSelectorComponent } = require('../../../app/assets/widgets/shared/variant-selector.js');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { fullPageProductProcessingMethods } = require('../../../app/assets/widgets/full-page/methods/product-processing-methods.js');

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

  it('treats tracked zero-stock variants as out of stock only when inventory tracking is enabled', () => {
    const trackedZeroStockProduct = {
      available: true,
      quantityAvailable: 0,
      currentlyNotInStock: false,
    };

    expect(fullPageProductProcessingMethods.isVariantOutOfStock.call({
      _getLandingPageControls: () => ({ trackInventoryOnAddToCart: false }),
    }, trackedZeroStockProduct)).toBe(false);

    expect(fullPageProductProcessingMethods.isVariantOutOfStock.call({
      _getLandingPageControls: () => ({ trackInventoryOnAddToCart: true }),
    }, trackedZeroStockProduct)).toBe(true);
  });

  it('keeps backorderable zero-stock variants selectable when inventory tracking is enabled', () => {
    expect(fullPageProductProcessingMethods.isVariantOutOfStock.call({
      _getLandingPageControls: () => ({ trackInventoryOnAddToCart: true }),
    }, {
      available: true,
      quantityAvailable: 0,
      currentlyNotInStock: true,
    })).toBe(false);
  });

  it('does not clamp positive stock quantities when inventory tracking is disabled', () => {
    const state = fullPageProductProcessingMethods.getVariantAvailable.call({
      stepProductData: [[{
        variantId: 'variant-1',
        available: true,
        quantityAvailable: 2,
        currentlyNotInStock: false,
      }]],
      _getLandingPageControls: () => ({ trackInventoryOnAddToCart: false }),
      isVariantOutOfStock: fullPageProductProcessingMethods.isVariantOutOfStock,
    }, 0, 'variant-1');

    expect(state).toEqual({ available: null, outOfStock: false, acceptsBackorder: false });
  });
});
