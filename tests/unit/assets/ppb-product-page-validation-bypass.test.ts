export {};

const { ProductPageFooterModalStateMethods } = require('../../../app/assets/widgets/product-page/methods/footer-modal-state-methods.js');
const { ProductPageCartMethods } = require('../../../app/assets/widgets/product-page/methods/cart-methods.js');
const { ProductPageModalStateMethods, formatProductPageStepValidationToast } = require('../../../app/assets/widgets/product-page/methods/modal-state-methods.js');
const { ProductPageWidgetMiscMethods } = require('../../../app/assets/widgets/product-page/methods/widget-misc-methods.js');
const { ProductPageSelectionMethods } = require('../../../app/assets/widgets/product-page/methods/selection-methods.js');
const { ToastManager } = require('../../../app/assets/bundle-widget-components.js');
const { CurrencyManager, PricingCalculator } = require('../../../app/assets/widgets/shared/currency-manager.js');

(globalThis as any).PricingCalculator = PricingCalculator;
(globalThis as any).CurrencyManager = CurrencyManager;
const MONEY_FORMAT = ['$','{{amount}}'].join('');
(globalThis as any).window = {
  Shopify: {
    currency: {
      active: 'USD',
      format: MONEY_FORMAT,
    },
  },
  shopMoneyFormat: MONEY_FORMAT,
};

function createButton() {
  return {
    disabled: false,
    textContent: '',
    classList: {
      add: jest.fn(),
      remove: jest.fn(),
      toggle: jest.fn(),
      contains: jest.fn(),
    },
  } as any;
}

function createFooterContext(overrides: Record<string, unknown> = {}) {
  return {
    selectedProducts: [{ v1: 1 }],
    stepProductData: [[{ variantId: 'v1', price: 1200 }]],
    selectedBundle: {
      steps: [{ conditionType: 'quantity', conditionOperator: 'greater_than_or_equal_to', conditionValue: 2 }],
    },
    elements: {
      addToCartButton: createButton(),
      modal: {
        querySelector: () => null,
      },
    },
    validateStep: () => false,
    _resolveText: (_key: string, fallback: string) => fallback,
    syncProductPagePrimaryCtaStyle: () => {},
    getDiscountInfoWithSelectedAddonDiscount: (value: Record<string, unknown>) => value,
    _usesCascadeStepFlow: () => false,
    _isConditionValidationEnabled: () => true,
    currentStepIndex: 0,
    updateAddToCartButton: jest.fn(),
    hideLoadingOverlay: jest.fn(),
    showLoadingOverlay: jest.fn(),
    ...overrides,
  } as any;
}

describe('PPB validation control disables step validation in Product Page CTA', () => {
  it('disables the CTA when control is enabled and steps are incomplete', () => {
    const context = createFooterContext();
    Object.assign(context, ProductPageFooterModalStateMethods);

    ProductPageFooterModalStateMethods.updateAddToCartButton.call(context);

    expect(context.elements.addToCartButton.disabled).toBe(true);
    expect(context.elements.addToCartButton.textContent).toBe('Complete All Steps to Continue');
  });

  it('enables the CTA for add-to-cart when control disables validation', () => {
    const context = createFooterContext({
      _isConditionValidationEnabled: () => false,
    });
    Object.assign(context, ProductPageFooterModalStateMethods);

    ProductPageFooterModalStateMethods.updateAddToCartButton.call(context);

    expect(context.elements.addToCartButton.disabled).toBe(false);
  });
});

describe('PPB validation control disables cart gating when disabled', () => {
  it('continues to /cart/add when control is disabled and step validation fails', async () => {
    const toastSpy = jest.spyOn(ToastManager, 'show').mockImplementation(() => {});
    const fetchSpy = jest.spyOn(global, 'fetch' as any).mockResolvedValue({
      ok: true,
      text: async () => '{}',
    } as any);

    try {
      const context = {
        ...ProductPageCartMethods,
        selectedProducts: [{ v1: 1 }],
        stepProductData: [[{ variantId: 'v1', price: 1200, available: true }]],
        hideLoadingOverlay: jest.fn(),
        showLoadingOverlay: jest.fn(),
        updateAddToCartButton: jest.fn(),
        _handlePostAddToCartAction: jest.fn(),
        _getProductPageControls: () => ({}),
        selectedBundle: {
          id: 'bundle-1',
          steps: [{}],
          pricing: { enabled: false },
        },
        config: {},
        validateStep: () => false,
        _isConditionValidationEnabled: () => false,
        validateProductPageBoxSelectionCheckout: () => ({ valid: true, totalQuantity: 1, targetQuantity: 1, difference: 0 }),
        updateAddToCartButton: jest.fn(),
        buildCartItems: () => [{ id: 101, quantity: 1, properties: {} }],
        getDiscountInfoWithSelectedAddonDiscount(value: Record<string, unknown>) {
          return value;
        },
        requestCartTransformRuntimeToken: jest.fn().mockResolvedValue('runtime-token'),
        buildProductPageCartFormData() {
          return {
            formData: new FormData(),
            bundleDetailsKey: 'MIX-1_K1K',
            sourceProperties: {},
          };
        },
        syncBundleDetailsCartMetafield: jest.fn(),
        resolveProductPageOfferId: () => 'MIX-1',
        generateBundleSessionKey: () => 'K1K',
        hideLoadingOverlay: jest.fn(),
        showLoadingOverlay: jest.fn(),
        _handlePostAddToCartAction: jest.fn(),
        elements: {
          addToCartButton: { disabled: false, textContent: '' },
        },
        _resolveText: (_key: string, fallback: string) => fallback,
      } as any;

      await ProductPageCartMethods.addToCart.call(context);

      expect(fetchSpy).toHaveBeenCalledTimes(1);
      expect(context.syncBundleDetailsCartMetafield).toHaveBeenCalled();
      expect(context.requestCartTransformRuntimeToken).toHaveBeenCalled();
      expect(toastSpy).not.toHaveBeenCalledWith('Please complete all bundle steps before adding to cart.');
    } finally {
      toastSpy.mockRestore();
      fetchSpy.mockRestore();
    }
  });

  it('blocks cart add when validation is enabled and a required step is incomplete', async () => {
    const toastSpy = jest.spyOn(ToastManager, 'show').mockImplementation(() => {});
    const fetchSpy = jest.spyOn(global, 'fetch' as any).mockResolvedValue({
      ok: true,
      text: async () => '{}',
    } as any);

    try {
      const context = {
        ...ProductPageCartMethods,
        selectedProducts: [{ v1: 1 }],
        stepProductData: [[{ variantId: 'v1', price: 1200, available: true }]],
        hideLoadingOverlay: jest.fn(),
        showLoadingOverlay: jest.fn(),
        updateAddToCartButton: jest.fn(),
        _handlePostAddToCartAction: jest.fn(),
        _getProductPageControls: () => ({}),
        selectedBundle: {
          id: 'bundle-1',
          steps: [{}],
          pricing: { enabled: false },
        },
        config: {},
        validateStep: () => false,
        _isConditionValidationEnabled: () => true,
        validateProductPageBoxSelectionCheckout: () => ({ valid: true, totalQuantity: 1, targetQuantity: 1, difference: 0 }),
        hideLoadingOverlay: jest.fn(),
        showLoadingOverlay: jest.fn(),
        updateAddToCartButton: jest.fn(),
        elements: {
          addToCartButton: { disabled: false, textContent: '' },
        },
        _resolveText: (_key: string, fallback: string) => fallback,
      } as any;

      await ProductPageCartMethods.addToCart.call(context);

      expect(fetchSpy).not.toHaveBeenCalled();
      expect(toastSpy).toHaveBeenCalledWith('Please complete all bundle steps before adding to cart.');
    } finally {
      toastSpy.mockRestore();
      fetchSpy.mockRestore();
    }
  });
});

describe('PPB validation control affects modal step progression', () => {
  it('allows modal tab navigation when validation is disabled', async () => {
    const context = {
      ...ProductPageModalStateMethods,
      ...ProductPageWidgetMiscMethods,
      selectedBundle: {
        steps: [{}, {}],
      },
      selectedProducts: [{ v1: 1 }, {}],
      currentStepIndex: 0,
      elements: {
        modal: {
          querySelector: (selector: string) => {
            if (selector === '.modal-step-title') return { innerHTML: '' };
            return {};
          },
        },
      },
      validateStep: () => false,
      _isConditionValidationEnabled: () => false,
      renderModalTabs: jest.fn(),
      renderModalProductsLoading: jest.fn(),
      renderModalProducts: jest.fn(),
      updateModalNavigation: jest.fn(),
      updateModalFooterMessaging: jest.fn(),
      preloadNextStep: jest.fn(),
      loadStepProducts: jest.fn().mockResolvedValue(undefined),
      getFormattedHeaderText: () => 'Step 1',
    } as any;

    const formatSpy = jest.spyOn(ToastManager, 'show').mockImplementation(() => {});

    await ProductPageWidgetMiscMethods.navigateModal.call(context, 1);

    expect(context.currentStepIndex).toBe(1);
    expect(context.preloadNextStep).toHaveBeenCalled();
    expect(formatSpy).not.toHaveBeenCalled();

    formatSpy.mockRestore();
  });

  it('blocks modal tab progression when validation is enabled', async () => {
    const context = {
      ...ProductPageModalStateMethods,
      ...ProductPageWidgetMiscMethods,
      selectedBundle: {
        steps: [{}, {}],
      },
      selectedProducts: [{ v1: 1 }, {}],
      currentStepIndex: 0,
      elements: {
        modal: {
          querySelector: (selector: string) => {
            if (selector === '.modal-step-title') return { innerHTML: '' };
            return {};
          },
        },
      },
      validateStep: () => false,
      _isConditionValidationEnabled: () => true,
      renderModalTabs: jest.fn(),
      renderModalProductsLoading: jest.fn(),
      renderModalProducts: jest.fn(),
      updateModalNavigation: jest.fn(),
      updateModalFooterMessaging: jest.fn(),
      preloadNextStep: jest.fn(),
      loadStepProducts: jest.fn().mockResolvedValue(undefined),
      getFormattedHeaderText: () => 'Step 1',
    } as any;

    const formatSpy = jest.spyOn(ToastManager, 'show').mockImplementation(() => {});
    formatProductPageStepValidationToast({ conditionType: 'quantity', conditionOperator: 'greater_than_or_equal_to', conditionValue: 1 });

    await ProductPageWidgetMiscMethods.navigateModal.call(context, 1);

    expect(context.currentStepIndex).toBe(0);
    expect(formatSpy).toHaveBeenCalled();

    formatSpy.mockRestore();
  });
});

describe('PPB validation control affects auto-add-after-last-step behavior', () => {
  it('skips step-validation check when control is disabled during auto-add', async () => {
    const addToCart = jest.fn().mockResolvedValue(undefined);
    const context = {
      ...ProductPageSelectionMethods,
      ...ProductPageWidgetMiscMethods,
      selectedBundle: {
        steps: [{ conditionType: 'quantity', isDefault: false, isFreeGift: false, conditionValue: 1 }],
      },
      selectedProducts: [{ v1: 0 }],
      _autoAddingFromControls: false,
      _isConditionValidationEnabled: () => false,
      _getProductPageControls() {
        return { addBundleToCartAfterLastStepCompleted: true };
      },
      validateStep: () => false,
      addToCart,
      currentStepIndex: 0,
      _isProductPageCascadeTemplate: () => false,
    } as any;

    await context._maybeAutoAddAfterLastStep.call(context);

    expect(addToCart).toHaveBeenCalledTimes(1);
  });

  it('blocks auto-add when validation remains enabled and completion test fails', async () => {
    const addToCart = jest.fn().mockResolvedValue(undefined);
    const context = {
      ...ProductPageSelectionMethods,
      ...ProductPageWidgetMiscMethods,
      selectedBundle: {
        steps: [{ conditionType: 'quantity', isDefault: false, isFreeGift: false, conditionValue: 1 }],
      },
      selectedProducts: [{ v1: 0 }],
      _autoAddingFromControls: false,
      _isConditionValidationEnabled: () => true,
      _getProductPageControls() {
        return { addBundleToCartAfterLastStepCompleted: true };
      },
      validateStep: () => false,
      addToCart,
      currentStepIndex: 0,
      _isProductPageCascadeTemplate: () => false,
    } as any;

    await context._maybeAutoAddAfterLastStep.call(context);

    expect(addToCart).not.toHaveBeenCalled();
  });

  it('supports EB alias addBundleToCartOnDone for auto-add gate', async () => {
    const addToCart = jest.fn().mockResolvedValue(undefined);
    const context = {
      ...ProductPageSelectionMethods,
      ...ProductPageWidgetMiscMethods,
      selectedBundle: {
        steps: [{ conditionType: 'quantity', isDefault: false, isFreeGift: false, conditionValue: 1 }],
      },
      selectedProducts: [{ v1: 1 }],
      _autoAddingFromControls: false,
      _isConditionValidationEnabled: () => false,
      _getProductPageControls() {
        return { addBundleToCartOnDone: true };
      },
      validateStep: () => true,
      addToCart,
      currentStepIndex: 0,
      _isProductPageCascadeTemplate: () => false,
    } as any;

    await context._maybeAutoAddAfterLastStep.call(context);

    expect(addToCart).toHaveBeenCalledTimes(1);
  });
});
