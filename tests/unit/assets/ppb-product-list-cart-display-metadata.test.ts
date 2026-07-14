export {};

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { ProductPageCartMethods } = require('../../../app/assets/widgets/product-page/methods/cart-methods.js');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PricingCalculator } = require('../../../app/assets/widgets/shared/pricing-calculator.js');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { CurrencyManager } = require('../../../app/assets/widgets/shared/currency-manager.js');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { ToastManager } = require('../../../app/assets/bundle-widget-components.js');

(globalThis as any).PricingCalculator = PricingCalculator;
(globalThis as any).CurrencyManager = CurrencyManager;
(globalThis as any).ToastManager = ToastManager;
const MONEY_FORMAT = ['$', '{{amount}}'].join('');
(globalThis as any).window = {
  Shopify: {
    currency: {
      active: 'USD',
      format: MONEY_FORMAT,
    },
  },
  shopMoneyFormat: MONEY_FORMAT,
};

function makeProductPageContext() {
  return {
    ...ProductPageCartMethods,
    selectedProducts: [
      {
        'gid://shopify/ProductVariant/101': 2,
        'gid://shopify/ProductVariant/102': 1,
        'gid://shopify/ProductVariant/103': 1,
      },
    ],
    stepProductData: [
      [
        {
          id: 'gid://shopify/Product/1',
          variantId: 'gid://shopify/ProductVariant/101',
          title: '14k Dangling Obsidian Earrings',
          price: 82900,
          available: true,
        },
        {
          id: 'gid://shopify/Product/2',
          variantId: 'gid://shopify/ProductVariant/102',
          title: '14k Dangling Pendant Earrings',
          price: 61900,
          available: true,
        },
        {
          id: 'gid://shopify/Product/3',
          variantId: 'gid://shopify/ProductVariant/103',
          title: '18k Pedal Ring - 8',
          variantTitle: '8',
          price: 39900,
          available: true,
        },
      ],
    ],
    selectedBundle: {
      id: 'bundle-1',
      name: 'PPB Product List Fixture',
      steps: [{ id: 'productsData1' }],
      pricing: { enabled: false },
    },
    config: {},
    expandProductsByVariant(products: unknown[]) {
      return products;
    },
    findProductBySelectionKey(products: Array<{ variantId: string }>, selectionKey: string) {
      return products.find((product) => product.variantId === selectionKey);
    },
    extractId(value: string) {
      return String(value).split('/').pop();
    },
    getSelectedSellingPlanAllocationId() {
      return null;
    },
    _isDirectDefaultVariant() {
      return false;
    },
    getAddonTierEvaluation() {
      return {};
    },
    getAddonLineDiscount() {
      return null;
    },
    getDiscountInfoWithSelectedAddonDiscount(discountInfo: unknown) {
      return discountInfo;
    },
  };
}

describe('PPB Product List cart display metadata', () => {
  it('builds EB-compatible display metadata for Product List cart lines', () => {
    const context = makeProductPageContext();

    const items = ProductPageCartMethods.buildCartItems.call(context, 'MIX-894502', 'K1K');

    expect(items).toHaveLength(3);
    for (const item of items) {
      expect(item.properties._bundle_display_properties).toBeDefined();
    }

    const displayProperties = JSON.parse(items[0].properties._bundle_display_properties);
    expect(displayProperties).toEqual({
      box: '1',
      items: '2 x 14k Dangling Obsidian Earrings, 1 x 14k Dangling Pendant Earrings, 1 x 18k Pedal Ring - 8 (8)',
      retailPrice: '$2676.00',
    });

    expect(ProductPageCartMethods.buildBundleDetailsDisplayProperties.call(context, items[0].properties)).toEqual({
      Box: '1',
      Items: '2 x 14k Dangling Obsidian Earrings, 1 x 14k Dangling Pendant Earrings, 1 x 18k Pedal Ring - 8 (8)',
      'Retail Price': '$2676.00',
    });

    const cartContext = ProductPageCartMethods.buildProductPageCartFormData.call(context, items, {
      bundleName: 'PPB Product List Fixture',
      offerId: 'MIX-894502',
      sessionKey: 'K1K',
      runtimeToken: 'runtime-token',
    });
    expect(cartContext.bundleDetailsKey).toBe('MIX-894502_K1K');
    expect((Array.from(cartContext.formData.entries()) as Array<[string, unknown]>).filter(([key]) => key.endsWith('[_wolfpackProductBundle:OfferId]'))).toEqual([
      ['items[0][properties][_wolfpackProductBundle:OfferId]', 'MIX-894502_K1K_1'],
      ['items[1][properties][_wolfpackProductBundle:OfferId]', 'MIX-894502_K1K_2'],
      ['items[2][properties][_wolfpackProductBundle:OfferId]', 'MIX-894502_K1K_3'],
    ]);
  });
});

describe('PPB Product List box selection checkout validation', () => {
  const boxSelection = {
    isEnabled: true,
    validateBoxSelectionQuantity: true,
    rules: [
      { ruleId: 'rule-1', boxQuantity: 3, isDefaultSelected: true },
    ],
  };

  it('does not block checkout when box selection validation is disabled', () => {
    const result = ProductPageCartMethods.validateProductPageBoxSelectionCheckout.call({
      selectedBundle: {
        boxSelection: {
          ...boxSelection,
          validateBoxSelectionQuantity: false,
        },
      },
      selectedProducts: [{ '101': 1 }],
    });

    expect(result).toEqual({ valid: true, totalQuantity: 1, targetQuantity: null, difference: 0 });
  });

  it('allows checkout when selected quantity exactly matches the active box quantity', () => {
    const result = ProductPageCartMethods.validateProductPageBoxSelectionCheckout.call({
      selectedBundle: { boxSelection },
      selectedProducts: [{ '101': 2, '102': 1 }],
    });

    expect(result).toEqual({ valid: true, totalQuantity: 3, targetQuantity: 3, difference: 0 });
  });

  it('blocks checkout when selected quantity is under the active box quantity', () => {
    const result = ProductPageCartMethods.validateProductPageBoxSelectionCheckout.call({
      selectedBundle: { boxSelection },
      selectedProducts: [{ '101': 2 }],
    });

    expect(result).toEqual({ valid: false, totalQuantity: 2, targetQuantity: 3, difference: 1 });
  });

  it('blocks checkout when selected quantity is over the active box quantity', () => {
    const result = ProductPageCartMethods.validateProductPageBoxSelectionCheckout.call({
      selectedBundle: { boxSelection },
      selectedProducts: [{ '101': 4 }],
    });

    expect(result).toEqual({ valid: false, totalQuantity: 4, targetQuantity: 3, difference: 1 });
  });

  it('stops add-to-cart before cart network calls when exact box quantity validation fails', async () => {
    const toastSpy = jest.spyOn(ToastManager, 'show').mockImplementation(() => {});
    const fetchSpy = jest.spyOn(global, 'fetch' as any).mockImplementation(jest.fn());

    try {
      await ProductPageCartMethods.addToCart.call({
        selectedProducts: [{ '101': 2 }],
        stepProductData: [[{ variantId: '101', price: 1000, available: true }]],
        selectedBundle: {
          steps: [{ id: 'productsData1' }],
          boxSelection,
        },
        validateStep: () => true,
        validateProductPageBoxSelectionCheckout: ProductPageCartMethods.validateProductPageBoxSelectionCheckout,
        _resolveText: (key: string) => (
          key === 'boxSelectionEligibilityToast_inPage'
            ? 'Select {{quantityDifference}} more item(s)'
            : ''
        ),
        hideLoadingOverlay: jest.fn(),
        updateAddToCartButton: jest.fn(),
      });

      expect(toastSpy).toHaveBeenCalledWith('Select 1 more item(s)');
      expect(fetchSpy).not.toHaveBeenCalled();
    } finally {
      toastSpy.mockRestore();
      fetchSpy.mockRestore();
    }
  });
});
