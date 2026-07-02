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
  it('filters unavailable-only primary values from grouped selector choices', () => {
    const view = VariantSelectorComponent.renderHtml({
      variantId: 'available-small',
      options: ['Size'],
      variants: [
        {
          id: 'available-small',
          option1: 'Small',
          available: true,
        },
        {
          id: 'sold-out-large',
          option1: 'Large',
          available: false,
        },
      ],
    }, 'Size');

    expect(view).toContain('data-primary-value="Small"');
    expect(view).not.toContain('data-primary-value="Large"');
  });

  it('ignores unavailable-only primary variant selections', () => {
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

    expect(product.variantId).toBe('available-small');
    expect(product.available).toBe(true);
    expect(product.quantityAvailable).toBe(3);
    expect(product.currentlyNotInStock).toBe(false);
    expect(onVariantChange).not.toHaveBeenCalled();
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

  it('normalizes selectedOptions into variant option fields for grouped FPB products', () => {
    const normalized = fullPageProductProcessingMethods.processProductsForStep.call({
      extractId: (id: string) => String(id || '').split('/').pop(),
      shouldExpandStepProductsDuringLoad: () => false,
      getFirstAvailableVariant: (product: any) => product.variants[0],
      isVariantSelectableForInventory: () => true,
      _getLandingPageControls: () => ({ trackInventoryOnAddToCart: false }),
    }, [{
      id: 'gid://shopify/Product/123',
      title: 'Black Crew Neck T-Shirt',
      imageUrl: 'https://cdn.example.test/product.jpg',
      variants: [
        {
          id: 'gid://shopify/ProductVariant/456',
          title: 'S / Black',
          price: '30.00',
          available: true,
          selectedOptions: [
            { name: 'Size', value: 'S' },
            { name: 'Color', value: 'Black' },
          ],
        },
        {
          id: 'gid://shopify/ProductVariant/789',
          title: 'M / Navy',
          price: '30.00',
          available: true,
          selectedOptions: [
            { name: 'Size', value: 'M' },
            { name: 'Color', value: 'Navy' },
          ],
        },
      ],
    }], { displayVariantsAsIndividual: false });

    expect(normalized[0].options).toEqual(['Size', 'Color']);
    expect(normalized[0].variants).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: '456', option1: 'S', option2: 'Black' }),
      expect.objectContaining({ id: '789', option1: 'M', option2: 'Navy' }),
    ]));
  });
});
