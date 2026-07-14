export {};

const { ProductPageFooterModalStateMethods } = require('../../../app/assets/widgets/product-page/methods/footer-modal-state-methods.js');

function createClassList() {
  const classes = new Set<string>();
  return {
    add: (value: string) => classes.add(value),
    remove: (value: string) => classes.delete(value),
    toggle: (value: string, force?: boolean) => {
      const next = force === undefined ? !classes.has(value) : force;
      if (next) {
        classes.add(value);
      } else {
        classes.delete(value);
      }
      return next;
    },
    contains: (value: string) => classes.has(value),
  };
}

function createButton() {
  return {
    disabled: false,
    textContent: '',
    classList: createClassList(),
  } as any;
}

(globalThis as any).window = {
  Shopify: {
    currency: {
      active: 'USD',
      format: '$ {{amount}}',
    },
  },
  shopMoneyFormat: '$ {{amount}}',
};

function createBaseContext(overrides: Record<string, unknown> = {}) {
  return {
    selectedProducts: [{ v1: 2 }],
    stepProductData: [[{ variantId: 'v1', price: 1200 }]],
    selectedBundle: {
      steps: [{}, {}],
      boxSelection: {
        validateBoxSelectionQuantity: true,
        rules: [{ boxQuantity: 3, boxLabel: 'Box of 3' }],
      },
      pricing: { enabled: false },
    },
    elements: {
      addToCartButton: createButton(),
      modal: {
        querySelector: () => null,
      },
    },
    validateStep: () => true,
    _resolveText: (_key: string, fallback: string) => fallback,
    syncProductPagePrimaryCtaStyle: () => {},
    getDiscountInfoWithSelectedAddonDiscount: (value: Record<string, unknown>) => value,
    _usesCascadeStepFlow: () => false,
    currentStepIndex: 0,
    _isProductPageGridTemplate: () => false,
    ...overrides,
  } as any;
}

describe('PPB Product Page box selection validation in CTA enablement', () => {
  it('disables the CTA when box-selection validation is enabled and the target count is not met', () => {
    const context = createBaseContext({
      validateProductPageBoxSelectionCheckout: () => ({
        valid: false,
        totalQuantity: 2,
        targetQuantity: 3,
        difference: 1,
      }),
    });

    ProductPageFooterModalStateMethods.updateAddToCartButton.call(context);

    expect(context.elements.addToCartButton.disabled).toBe(true);
    expect(context.elements.addToCartButton.classList.contains('disabled')).toBe(true);
  });

  it('keeps the CTA enabled when box-selection validation is disabled even if count is not met', () => {
    const context = createBaseContext({
      validateProductPageBoxSelectionCheckout: () => ({
        valid: true,
        totalQuantity: 2,
        targetQuantity: null,
        difference: 0,
      }),
    });

    ProductPageFooterModalStateMethods.updateAddToCartButton.call(context);

    expect(context.elements.addToCartButton.disabled).toBe(false);
    expect(context.elements.addToCartButton.classList.contains('disabled')).toBe(false);
  });
});
