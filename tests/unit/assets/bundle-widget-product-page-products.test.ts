// eslint-disable-next-line @typescript-eslint/no-require-imports
const { ProductPageSelectionDataMethods } = require('../../../app/assets/widgets/product-page/methods/selection-data-methods.js');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { ProductPageSelectionMethods } = require('../../../app/assets/widgets/product-page/methods/selection-methods.js');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { ToastManager } = require('../../../app/assets/bundle-widget-components.js');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { shouldDisableProductPageVariantOption } = require('../../../app/assets/widgets/product-page/methods/modal-methods.js');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { ProductPageProductDataMethods } = require('../../../app/assets/widgets/product-page/methods/product-data-methods.js');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { ProductPageDefaultProductMethods } = require('../../../app/assets/widgets/product-page/methods/default-product-methods.js');
/**
 * Unit Tests — Product Page widget product normalization
 *
 * Pattern: pure logic mirrors the browser widget's processProductsForStep()
 * branch so storefront hydration regressions can be tested without loading the
 * full IIFE bundle in Jest.
 */

interface StorefrontVariant {
  id: string;
  title: string;
  price?: string;
  compareAtPrice?: string | null;
  available?: boolean;
  quantityAvailable?: number | null;
  currentlyNotInStock?: boolean;
  image?: { src?: string } | null;
}

interface StorefrontProduct {
  id: string;
  title: string;
  imageUrl?: string;
  variants?: StorefrontVariant[];
  options?: Array<string | { name: string }>;
  images?: Array<{ src?: string }>;
  description?: string;
  descriptionHtml?: string;
}

interface WidgetStep {
  displayVariantsAsIndividual?: boolean;
}

function extractId(idString: string | null | undefined): string | null {
  if (!idString) return null;
  const gidMatch = idString.toString().match(/gid:\/\/shopify\/\w+\/(\d+)/);
  if (gidMatch) return gidMatch[1];
  return idString.toString().split('/').pop() ?? null;
}

function processProductPageProductsForStep(
  products: StorefrontProduct[],
  step: WidgetStep,
  trackInventoryOnAddToCart = false,
  hideOutOfStockProducts = true,
): any[] {
  return ProductPageProductDataMethods.processProductsForStep.call({
    extractId,
    _getProductPageControls: () => ({
      trackInventoryOnAddToCart,
      hideOutOfStockProducts,
    }),
  }, products, step);
}

describe('processProductPageProductsForStep', () => {
  it('uses the first available variant for parent product cards when the first variant is unavailable', () => {
    const products = processProductPageProductsForStep([
      {
        id: 'gid://shopify/Product/9427287703811',
        title: 'Armor Matte Case',
        imageUrl: 'https://cdn.example/product.jpg',
        variants: [
          {
            id: 'gid://shopify/ProductVariant/111',
            title: 'Sold out',
            price: '123.0',
            available: false,
          },
          {
            id: 'gid://shopify/ProductVariant/222',
            title: 'Available',
            price: '125.0',
            compareAtPrice: '150.0',
            available: true,
            quantityAvailable: 4,
            currentlyNotInStock: false,
            image: { src: 'https://cdn.example/variant.jpg' },
          },
        ],
        options: [{ name: 'Color' }],
      },
    ], { displayVariantsAsIndividual: false });

    expect(products).toHaveLength(1);
    expect(products[0]).toMatchObject({
      id: '9427287703811',
      title: 'Armor Matte Case',
      variantId: '222',
      imageUrl: 'https://cdn.example/variant.jpg',
      price: 12500,
      compareAtPrice: 15000,
      available: true,
      quantityAvailable: 4,
      currentlyNotInStock: false,
      sourceVariantCount: 2,
    });
    expect(products[0].variants.map((variant: StorefrontVariant) => variant.id)).toEqual(['222']);
  });

  it('omits true unavailable variants from individual Product List rows without hiding sellable zero-quantity variants', () => {
    const products = processProductPageProductsForStep([
      {
        id: 'gid://shopify/Product/700',
        title: 'Tracked Bundle Product',
        imageUrl: 'https://cdn.example/product.jpg',
        variants: [
          {
            id: 'gid://shopify/ProductVariant/701',
            title: 'Unavailable',
            price: '10.00',
            available: false,
            quantityAvailable: 0,
            currentlyNotInStock: false,
          },
          {
            id: 'gid://shopify/ProductVariant/702',
            title: 'Sellable zero',
            price: '11.00',
            available: true,
            quantityAvailable: 0,
            currentlyNotInStock: false,
          },
        ],
      },
    ], { displayVariantsAsIndividual: true }, false);

    expect(products.map(product => product.variantId)).toEqual(['702']);
    expect(products[0]).toEqual(expect.objectContaining({
      variantId: '702',
      price: 1100,
      available: true,
      quantityAvailable: 0,
      currentlyNotInStock: false,
    }));
  });

  it('omits grouped product cards when every Storefront variant is unavailable', () => {
    const products = processProductPageProductsForStep([
      {
        id: 'gid://shopify/Product/9427287703811',
        title: 'Armor Matte Case',
        imageUrl: 'https://cdn.example/product.jpg',
        variants: [
          {
            id: 'gid://shopify/ProductVariant/111',
            title: 'Sold out',
            price: '19.99',
            available: false,
            quantityAvailable: 0,
            currentlyNotInStock: false,
          },
        ],
      },
    ], { displayVariantsAsIndividual: false }, true);

    expect(products).toEqual([]);
  });

  it('keeps unavailable variants in grouped product selectors when hide out-of-stock products is disabled', () => {
    const products = processProductPageProductsForStep([
      {
        id: 'gid://shopify/Product/8322633760964',
        title: 'Massage Oil',
        imageUrl: 'https://cdn.example/massage-oil.jpg',
        variants: [
          {
            id: 'gid://shopify/ProductVariant/1',
            title: 'Grapefruit',
            price: '25.00',
            available: true,
            quantityAvailable: 4,
            currentlyNotInStock: false,
          },
          {
            id: 'gid://shopify/ProductVariant/2',
            title: 'Pepper',
            price: '25.00',
            available: false,
            quantityAvailable: 0,
            currentlyNotInStock: false,
          },
          {
            id: 'gid://shopify/ProductVariant/3',
            title: 'Rosemary',
            price: '25.00',
            available: false,
            quantityAvailable: 0,
            currentlyNotInStock: false,
          },
        ],
        options: [{ name: 'Scent' }],
      },
    ], { displayVariantsAsIndividual: false }, false, false);

    expect(products).toHaveLength(1);
    expect(products[0]).toMatchObject({
      title: 'Massage Oil',
      variantId: '1',
      available: true,
    });
    expect(products[0].variants.map((variant: StorefrontVariant) => ({
      id: variant.id,
      title: variant.title,
      available: variant.available,
    }))).toEqual([
      { id: '1', title: 'Grapefruit', available: true },
      { id: '2', title: 'Pepper', available: false },
      { id: '3', title: 'Rosemary', available: false },
    ]);
  });
});

describe('Product Page widget product-level inventory tracking', () => {
  function makeSelectionContext(trackInventoryOnAddToCart: boolean) {
    return {
      stepProductData: [[{
        variantId: 'variant-1',
        available: true,
        quantityAvailable: 0,
        currentlyNotInStock: false,
      }]],
      _getProductPageControls: () => ({ trackInventoryOnAddToCart }),
      normalizeSelectionKey: (value: string) => value,
      findProductBySelectionKey(products: any[], selectionKey: string) {
        return products.find(product => product.variantId === selectionKey) || null;
      },
    };
  }

  it('blocks tracked zero-stock variants when inventory tracking is enabled', () => {
    const state = ProductPageSelectionDataMethods.getVariantAvailable.call(
      makeSelectionContext(true),
      0,
      'variant-1',
    );

    expect(state).toEqual({ available: 0, outOfStock: true, acceptsBackorder: false });
  });

  it('keeps unavailable add attempts on the stock toast guard', () => {
    const toastSpy = jest.spyOn(ToastManager, 'show').mockImplementation(() => {});

    try {
      ProductPageSelectionMethods.updateProductSelection.call({
        normalizeSelectionKey: (value: string) => value,
        _getDirectDefaultRequiredQuantity: () => null,
        getVariantAvailable: () => ({ available: 0, outOfStock: true, acceptsBackorder: false }),
      }, 0, 'variant-1', 1);

      expect(toastSpy).toHaveBeenCalledWith('This item is out of stock.');
    } finally {
      toastSpy.mockRestore();
    }
  });

  it('keeps tracked zero-stock variants unbounded when inventory tracking is disabled', () => {
    const state = ProductPageSelectionDataMethods.getVariantAvailable.call(
      makeSelectionContext(false),
      0,
      'variant-1',
    );

    expect(state).toEqual({ available: null, outOfStock: false, acceptsBackorder: false });
  });

  it('does not clamp positive stock quantities when inventory tracking is disabled', () => {
    const context = makeSelectionContext(false);
    context.stepProductData[0][0].quantityAvailable = 2;

    const state = ProductPageSelectionDataMethods.getVariantAvailable.call(
      context,
      0,
      'variant-1',
    );

    expect(state).toEqual({ available: null, outOfStock: false, acceptsBackorder: false });
  });

  it('does not disable a zero-stock variant option when inventory tracking is disabled', () => {
    expect(shouldDisableProductPageVariantOption({
      available: true,
      quantityAvailable: 0,
      currentlyNotInStock: false,
    }, false)).toBe(false);
  });

  it('disables a zero-stock variant option when inventory tracking is enabled', () => {
    expect(shouldDisableProductPageVariantOption({
      available: true,
      quantityAvailable: 0,
      currentlyNotInStock: false,
    }, true)).toBe(true);
  });

  it('keeps backorderable zero-stock variant options enabled when inventory tracking is enabled', () => {
    expect(shouldDisableProductPageVariantOption({
      available: true,
      quantityAvailable: 0,
      currentlyNotInStock: true,
    }, true)).toBe(false);
  });

  it('keeps tracked zero-stock variants visible before rendering individual product cards', () => {
    const products = processProductPageProductsForStep([
      {
        id: 'gid://shopify/Product/700',
        title: 'Tracked Bundle Product',
        imageUrl: 'https://cdn.example/product.jpg',
        variants: [
          {
            id: 'gid://shopify/ProductVariant/701',
            title: 'Tracked zero',
            price: '10.00',
            available: true,
            quantityAvailable: 0,
            currentlyNotInStock: false,
          },
          {
            id: 'gid://shopify/ProductVariant/702',
            title: 'Backorder',
            price: '11.00',
            available: true,
            quantityAvailable: 0,
            currentlyNotInStock: true,
          },
          {
            id: 'gid://shopify/ProductVariant/703',
            title: 'In stock',
            price: '12.00',
            available: true,
            quantityAvailable: 3,
            currentlyNotInStock: false,
          },
        ],
      },
    ], { displayVariantsAsIndividual: true }, true);

    expect(products.map(product => product.variantId)).toEqual(['701', '702', '703']);
    expect(products[0]).toEqual(expect.objectContaining({
      variantId: '701',
      price: 1000,
      available: false,
      quantityAvailable: 0,
      currentlyNotInStock: false,
    }));
  });

  it('selects the first sellable variant for grouped product cards when tracking is enabled', () => {
    const products = processProductPageProductsForStep([
      {
        id: 'gid://shopify/Product/800',
        title: 'Grouped Product',
        imageUrl: 'https://cdn.example/product.jpg',
        variants: [
          {
            id: 'gid://shopify/ProductVariant/801',
            title: 'Tracked zero',
            price: '10.00',
            available: true,
            quantityAvailable: 0,
            currentlyNotInStock: false,
          },
          {
            id: 'gid://shopify/ProductVariant/802',
            title: 'Sellable',
            price: '11.00',
            available: true,
            quantityAvailable: 5,
            currentlyNotInStock: false,
          },
        ],
      },
    ], { displayVariantsAsIndividual: false }, true);

    expect(products).toHaveLength(1);
    expect(products[0]).toMatchObject({
      variantId: '802',
      available: true,
      quantityAvailable: 5,
    });
  });

  it('keeps grouped products visible when every variant is tracked zero stock', () => {
    const products = processProductPageProductsForStep([
      {
        id: 'gid://shopify/Product/900',
        title: 'Empty Product',
        imageUrl: 'https://cdn.example/product.jpg',
        variants: [
          {
            id: 'gid://shopify/ProductVariant/901',
            title: 'Tracked zero',
            price: '10.00',
            available: true,
            quantityAvailable: 0,
            currentlyNotInStock: false,
          },
        ],
      },
    ], { displayVariantsAsIndividual: false }, true);

    expect(products).toHaveLength(1);
    expect(products[0]).toMatchObject({
      variantId: '901',
      price: 1000,
      available: false,
      quantityAvailable: 0,
      currentlyNotInStock: false,
    });
  });

  it('preserves Shopify descriptionHtml for the shared product modal', () => {
    const products = processProductPageProductsForStep([
      {
        id: 'gid://shopify/Product/123',
        title: 'Product with HTML',
        description: 'Plain description',
        descriptionHtml: '<p>Plain <strong>description</strong></p>',
        imageUrl: 'https://cdn.example.test/product.jpg',
        variants: [{
          id: 'gid://shopify/ProductVariant/456',
          title: 'Default Title',
          price: '10.00',
          available: true,
        }],
      },
    ], { displayVariantsAsIndividual: false }, false);

    expect(products[0]).toMatchObject({
      description: 'Plain description',
      descriptionHtml: '<p>Plain <strong>description</strong></p>',
    });
  });

  it('preserves explicit zero inventory on direct default products', () => {
    const product = ProductPageDefaultProductMethods._normalizeDirectDefaultProduct.call({
      extractId,
    }, {
      title: 'Default Product',
      imageUrl: 'https://cdn.example/default.jpg',
      graphqlId: 'gid://shopify/Product/9506413773059',
      productId: '9506413773059',
      variants: [{
        variantGraphqlId: 'gid://shopify/ProductVariant/48720141091075',
        variantId: '48720141091075',
        price: '829.00',
        inventoryQuantity: 0,
      }],
    });

    expect(product).toEqual(expect.objectContaining({
      variantId: '48720141091075',
      available: true,
      quantityAvailable: 0,
    }));
  });

  it('keeps missing direct default inventory unbounded', () => {
    const product = ProductPageDefaultProductMethods._normalizeDirectDefaultProduct.call({
      extractId,
    }, {
      title: 'Default Product',
      imageUrl: 'https://cdn.example/default.jpg',
      graphqlId: 'gid://shopify/Product/9506413773059',
      productId: '9506413773059',
      variants: [{
        variantGraphqlId: 'gid://shopify/ProductVariant/48720141091075',
        variantId: '48720141091075',
        price: '829.00',
      }],
    });

    expect(product).toEqual(expect.objectContaining({
      variantId: '48720141091075',
      available: true,
      quantityAvailable: null,
    }));
  });
});
