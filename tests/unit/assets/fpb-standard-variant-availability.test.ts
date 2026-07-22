export {};

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { VariantSelectorComponent } = require('../../../app/assets/widgets/shared/variant-selector.js');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { fullPageProductProcessingMethods } = require('../../../app/assets/widgets/full-page/methods/product-processing-methods.js');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { fullPageSearchCategoryMethods } = require('../../../app/assets/widgets/full-page/methods/search-category-methods.js');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { fullPageProductGridMethods } = require('../../../app/assets/widgets/full-page/methods/product-grid-methods.js');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { BUNDLE_WIDGET } = require('../../../app/assets/widgets/shared/constants.js');

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

  it('resolves live inventory when the card uses a numeric variant ID and step data keeps the GID', () => {
    const context: any = {
      stepProductData: [[{
        id: 'gid://shopify/Product/9506421735683',
        variants: [{
          id: 'gid://shopify/ProductVariant/48720397271299',
          available: true,
        }],
      }]],
      _getLandingPageControls: () => ({ trackInventoryOnAddToCart: true }),
      isVariantOutOfStock: fullPageProductProcessingMethods.isVariantOutOfStock,
      getRuntimeVariantInventory: fullPageProductProcessingMethods.getRuntimeVariantInventory,
    };
    fullPageProductProcessingMethods.rememberRuntimeProductInventory.call(context, [{
      variants: [{
        id: 'gid://shopify/ProductVariant/48720397271299',
        available: true,
        quantityAvailable: 1,
        currentlyNotInStock: false,
      }],
    }]);

    expect(fullPageProductProcessingMethods.getVariantAvailable.call(
      context,
      0,
      '48720397271299',
    )).toEqual({ available: 1, outOfStock: false, acceptsBackorder: false });
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

  it('omits explicitly unavailable variants from individual product expansion', () => {
    const normalized = fullPageProductProcessingMethods.processProductsForStep.call({
      extractId: (id: string) => String(id || '').split('/').pop(),
      shouldExpandStepProductsDuringLoad: () => true,
      isVariantSelectableForInventory: fullPageProductProcessingMethods.isVariantSelectableForInventory,
      isInventoryTrackingOnAddToCartEnabled: fullPageProductProcessingMethods.isInventoryTrackingOnAddToCartEnabled,
      getRuntimeVariantInventory: (variant: any) => String(variant.id).endsWith('/789')
        ? { available: false, quantityAvailable: 0, currentlyNotInStock: false }
        : null,
      _getLandingPageControls: () => ({ trackInventoryOnAddToCart: false }),
    }, [{
      id: 'gid://shopify/Product/123',
      title: 'Grouped product',
      imageUrl: 'https://cdn.example.test/product.jpg',
      variants: [
        {
          id: 'gid://shopify/ProductVariant/456',
          title: 'Available',
          price: '30.00',
          available: true,
        },
        {
          id: 'gid://shopify/ProductVariant/789',
          title: 'Unavailable',
          price: '35.00',
          available: true,
        },
        {
          id: 'gid://shopify/ProductVariant/101',
          title: 'Tracked zero stock',
          price: '40.00',
          available: true,
          quantityAvailable: 0,
          currentlyNotInStock: false,
        },
      ],
    }], { displayVariantsAsIndividual: true });

    expect(normalized.map((product: any) => product.variantId)).toEqual(['456', '101']);
  });

  it('preserves product descriptions for the product detail modal', () => {
    const normalized = fullPageProductProcessingMethods.processProductsForStep.call({
      extractId: (id: string) => String(id || '').split('/').pop(),
      shouldExpandStepProductsDuringLoad: () => false,
      getFirstAvailableVariant: (product: any) => product.variants[0],
      isVariantSelectableForInventory: () => true,
      _getLandingPageControls: () => ({ trackInventoryOnAddToCart: false }),
    }, [{
      id: 'gid://shopify/Product/123',
      title: 'Black Crew Neck T-Shirt',
      description: 'Soft cotton product description.',
      imageUrl: 'https://cdn.example.test/product.jpg',
      variants: [
        {
          id: 'gid://shopify/ProductVariant/456',
          title: 'S / Black',
          price: '30.00',
          available: true,
        },
      ],
    }], { displayVariantsAsIndividual: false });

    expect(normalized[0].description).toBe('Soft cotton product description.');
  });

  it('preserves Shopify descriptionHtml for the product detail modal', () => {
    const normalized = fullPageProductProcessingMethods.processProductsForStep.call({
      extractId: (id: string) => String(id || '').split('/').pop(),
      shouldExpandStepProductsDuringLoad: () => false,
      getFirstAvailableVariant: (product: any) => product.variants[0],
      isVariantSelectableForInventory: () => true,
      _getLandingPageControls: () => ({ trackInventoryOnAddToCart: false }),
    }, [{
      id: 'gid://shopify/Product/123',
      title: 'Black Crew Neck T-Shirt',
      description: 'Soft cotton product description.',
      descriptionHtml: '<p>Soft <strong>cotton</strong> product description.</p>',
      imageUrl: 'https://cdn.example.test/product.jpg',
      variants: [
        {
          id: 'gid://shopify/ProductVariant/456',
          title: 'S / Black',
          price: '30.00',
          available: true,
        },
      ],
    }], { displayVariantsAsIndividual: false });

    expect(normalized[0].description).toBe('Soft cotton product description.');
    expect(normalized[0].descriptionHtml).toBe('<p>Soft <strong>cotton</strong> product description.</p>');
  });

  it('omits grouped products with no sellable variants when inventory tracking is enabled', () => {
    const normalized = fullPageProductProcessingMethods.processProductsForStep.call({
      extractId: (id: string) => String(id || '').split('/').pop(),
      shouldExpandStepProductsDuringLoad: () => false,
      getFirstAvailableVariant: fullPageProductProcessingMethods.getFirstAvailableVariant,
      isVariantSelectableForInventory: fullPageProductProcessingMethods.isVariantSelectableForInventory,
      getRuntimeVariantInventory: fullPageProductProcessingMethods.getRuntimeVariantInventory,
      isInventoryTrackingOnAddToCartEnabled: fullPageProductProcessingMethods.isInventoryTrackingOnAddToCartEnabled,
      _getLandingPageControls: () => ({ trackInventoryOnAddToCart: true }),
    }, [{
      id: 'gid://shopify/Product/123',
      title: 'Black Crew Neck T-Shirt',
      imageUrl: 'https://cdn.example.test/product.jpg',
      variants: [
        {
          id: 'gid://shopify/ProductVariant/456',
          title: 'Default Title',
          price: '30.00',
          available: true,
          quantityAvailable: 0,
          currentlyNotInStock: false,
        },
      ],
    }], { displayVariantsAsIndividual: false });

    expect(normalized).toEqual([]);
  });

  it('enriches cached products missing descriptions before modal normalization', async () => {
    const previousWindow = (global as any).window;
    const previousFetch = (global as any).fetch;
    (global as any).window = {
      Shopify: { shop: 'test.myshopify.com', country: 'US' },
      location: { host: 'test.myshopify.com' },
    };
    (global as any).fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        products: [{
          id: 'gid://shopify/Product/123',
          description: 'Fetched product description.',
          descriptionHtml: '<p>Fetched <strong>product</strong> description.</p>',
        }],
      }),
    });

    try {
      const enriched = await fullPageProductProcessingMethods.enrichMissingProductDescriptions.call({
        resolveStorefrontApiBase: () => '/apps/product-bundles',
      }, [{
        id: 'gid://shopify/Product/123',
        title: 'Cached product',
      }]);

      expect((global as any).fetch).toHaveBeenCalledWith(
        expect.stringContaining('/apps/product-bundles/api/storefront-products'),
      );
      expect(enriched[0].description).toBe('Fetched product description.');
      expect(enriched[0].descriptionHtml).toBe('<p>Fetched <strong>product</strong> description.</p>');
    } finally {
      (global as any).window = previousWindow;
      (global as any).fetch = previousFetch;
    }
  });

  it('refreshes enriched saved product inventory before rendering when tracking is enabled', async () => {
    const previousWindow = (global as any).window;
    const previousFetch = (global as any).fetch;
    (global as any).window = {
      Shopify: { shop: 'test.myshopify.com', country: 'US' },
      location: { host: 'test.myshopify.com' },
    };
    (global as any).fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        products: [{
          id: 'gid://shopify/Product/123',
          title: 'Tracked zero-stock product',
          imageUrl: 'https://cdn.example.test/product.jpg',
          description: 'Fresh description.',
          variants: [{
            id: 'gid://shopify/ProductVariant/456',
            title: 'Default Title',
            price: '30.00',
            available: true,
            quantityAvailable: 0,
            currentlyNotInStock: false,
          }],
        }],
      }),
    });

    const context: any = {
      selectedBundle: {
        steps: [{
          StepProduct: [{
            productId: 'gid://shopify/Product/123',
            title: 'Tracked zero-stock product',
            imageUrl: 'https://cdn.example.test/product.jpg',
            price: 3000,
            description: 'Cached description.',
            variants: [{
              id: 'gid://shopify/ProductVariant/456',
              title: 'Default Title',
              price: 3000,
              available: true,
            }],
          }],
        }],
      },
      stepProductData: [[]],
      stepCollectionProductIds: {},
      selectedProducts: [{}],
      resolveStorefrontApiBase: () => '/apps/product-bundles',
      collectStepProductIds: fullPageSearchCategoryMethods.collectStepProductIds,
      collectStepCollectionHandles: () => [],
      shouldExpandStepProductsDuringLoad: () => false,
      extractId: (id: string) => String(id || '').split('/').pop(),
      isVariantSelectableForInventory: fullPageProductProcessingMethods.isVariantSelectableForInventory,
      isInventoryTrackingOnAddToCartEnabled: fullPageProductProcessingMethods.isInventoryTrackingOnAddToCartEnabled,
      getFirstAvailableVariant: fullPageProductProcessingMethods.getFirstAvailableVariant,
      processProductsForStep: fullPageProductProcessingMethods.processProductsForStep,
      enrichMissingProductDescriptions: fullPageProductProcessingMethods.enrichMissingProductDescriptions,
      mergeCategoryProductVariantAvailability: fullPageProductProcessingMethods.mergeCategoryProductVariantAvailability,
      _mergeDirectDefaultProductsIntoStep: (_stepIndex: number, products: any[]) => products,
      _getLandingPageControls: () => ({ trackInventoryOnAddToCart: true }),
    };

    try {
      await fullPageProductProcessingMethods.loadStepProducts.call(context, 0);

      expect((global as any).fetch).toHaveBeenCalledWith(
        expect.stringContaining('/apps/product-bundles/api/storefront-products'),
      );
      expect(context.stepProductData[0]).toEqual([]);
    } finally {
      (global as any).window = previousWindow;
      (global as any).fetch = previousFetch;
    }
  });

  it('uses Storefront inventory for saved category products when tracking is enabled', async () => {
    const previousWindow = (global as any).window;
    const previousFetch = (global as any).fetch;
    (global as any).window = {
      Shopify: { shop: 'test.myshopify.com', country: 'US' },
      location: { host: 'test.myshopify.com' },
    };
    (global as any).fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        products: [{
          id: 'gid://shopify/Product/123',
          title: 'Tracked category product',
          imageUrl: 'https://cdn.example.test/product.jpg',
          description: 'Fresh description.',
          variants: [{
            id: 'gid://shopify/ProductVariant/456',
            title: 'Default Title',
            price: '30.00',
            available: true,
            quantityAvailable: 0,
            currentlyNotInStock: false,
          }],
        }],
      }),
    });

    const context: any = {
      selectedBundle: {
        steps: [{
          categories: [{
            products: [{
              id: 'gid://shopify/Product/123',
              title: 'Tracked category product',
              variants: [{
                id: 'gid://shopify/ProductVariant/456',
                title: 'Default Title',
                available: true,
              }],
            }],
          }],
        }],
      },
      stepProductData: [[]],
      stepCollectionProductIds: {},
      selectedProducts: [{}],
      resolveStorefrontApiBase: () => '/apps/product-bundles',
      collectStepProductIds: fullPageSearchCategoryMethods.collectStepProductIds,
      collectStepCollectionHandles: () => [],
      shouldExpandStepProductsDuringLoad: () => false,
      extractId: (id: string) => String(id || '').split('/').pop(),
      isVariantSelectableForInventory: fullPageProductProcessingMethods.isVariantSelectableForInventory,
      isInventoryTrackingOnAddToCartEnabled: fullPageProductProcessingMethods.isInventoryTrackingOnAddToCartEnabled,
      getFirstAvailableVariant: fullPageProductProcessingMethods.getFirstAvailableVariant,
      processProductsForStep: fullPageProductProcessingMethods.processProductsForStep,
      enrichMissingProductDescriptions: fullPageProductProcessingMethods.enrichMissingProductDescriptions,
      mergeCategoryProductVariantAvailability: fullPageProductProcessingMethods.mergeCategoryProductVariantAvailability,
      _mergeDirectDefaultProductsIntoStep: (_stepIndex: number, products: any[]) => products,
      _getLandingPageControls: () => ({ trackInventoryOnAddToCart: true }),
    };

    try {
      await fullPageProductProcessingMethods.loadStepProducts.call(context, 0);

      expect((global as any).fetch).toHaveBeenCalledWith(
        expect.stringContaining('/apps/product-bundles/api/storefront-products'),
      );
      expect(context.stepProductData[0]).toEqual([]);
    } finally {
      (global as any).window = previousWindow;
      (global as any).fetch = previousFetch;
    }
  });

  it('omits tracked zero-stock variants during product grid expansion', () => {
    const expanded = fullPageProductGridMethods.expandProductsByVariant.call({
      isVariantSelectableForInventory: fullPageProductProcessingMethods.isVariantSelectableForInventory,
      isInventoryTrackingOnAddToCartEnabled: fullPageProductProcessingMethods.isInventoryTrackingOnAddToCartEnabled,
      _getLandingPageControls: () => ({ trackInventoryOnAddToCart: true }),
    }, [{
      id: 'gid://shopify/Product/123',
      title: 'Grouped product',
      imageUrl: 'https://cdn.example.test/product.jpg',
      variants: [
        {
          id: 'gid://shopify/ProductVariant/456',
          title: 'Blocked',
          price: '30.00',
          available: true,
          quantityAvailable: 0,
          currentlyNotInStock: false,
        },
        {
          id: 'gid://shopify/ProductVariant/789',
          title: 'Backorder',
          price: '35.00',
          available: true,
          quantityAvailable: 0,
          currentlyNotInStock: true,
        },
      ],
    }], true);

    expect(expanded).toHaveLength(1);
    expect(expanded[0]).toEqual(expect.objectContaining({
      variantId: 'gid://shopify/ProductVariant/789',
      price: 3500,
      available: true,
      quantityAvailable: 0,
      currentlyNotInStock: true,
    }));
  });

  it('uses the self-contained widget placeholder for missing product media', () => {
    const normalized = fullPageProductProcessingMethods.processProductsForStep.call({
      extractId: (id: string) => String(id || '').split('/').pop(),
      shouldExpandStepProductsDuringLoad: () => true,
      isVariantSelectableForInventory: () => true,
      _getLandingPageControls: () => ({ trackInventoryOnAddToCart: false }),
    }, [{
      id: 'gid://shopify/Product/123',
      title: 'Message',
      variants: [{
        id: 'gid://shopify/ProductVariant/456',
        title: 'Message',
        price: '0.00',
        available: true,
      }],
    }], { displayVariantsAsIndividual: true });

    expect(normalized[0].imageUrl).toBe(BUNDLE_WIDGET.PLACEHOLDER_IMAGE);
  });

  it('omits an already-expanded card when runtime inventory marks its variant unavailable', () => {
    const expanded = fullPageProductGridMethods.expandProductsByVariant.call({
      getRuntimeVariantInventory: () => ({
        available: false,
        quantityAvailable: 0,
        currentlyNotInStock: false,
      }),
      isVariantSelectableForInventory: fullPageProductProcessingMethods.isVariantSelectableForInventory,
      isInventoryTrackingOnAddToCartEnabled: fullPageProductProcessingMethods.isInventoryTrackingOnAddToCartEnabled,
      _getLandingPageControls: () => ({ trackInventoryOnAddToCart: false }),
    }, [{
      id: 'gid://shopify/ProductVariant/456',
      variantId: 'gid://shopify/ProductVariant/456',
      parentProductId: 'gid://shopify/Product/123',
      title: 'Grouped product',
      available: true,
    }], true);

    expect(expanded).toEqual([]);
  });

  it('uses runtime inventory by variant id when the card DTO has stale stock fields', () => {
    const context = {
      _fpbRuntimeVariantInventoryById: {
        '456': {
          available: true,
          quantityAvailable: 0,
          currentlyNotInStock: false,
        },
      },
      extractId: (id: string) => String(id || '').split('/').pop(),
      isInventoryTrackingOnAddToCartEnabled: fullPageProductProcessingMethods.isInventoryTrackingOnAddToCartEnabled,
      getRuntimeVariantInventory: fullPageProductProcessingMethods.getRuntimeVariantInventory,
      _getLandingPageControls: () => ({ trackInventoryOnAddToCart: true }),
    };

    expect(fullPageProductProcessingMethods.isVariantSelectableForInventory.call(context, {
      id: 'gid://shopify/ProductVariant/456',
      available: true,
    })).toBe(false);
  });
});
