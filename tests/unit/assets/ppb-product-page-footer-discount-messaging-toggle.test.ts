export {};

function createFakeElement() {
  return {
    _innerHTML: '',
    querySelector: () => null,
    querySelectorAll: () => [],
    style: {
      setProperty: () => {},
      display: '',
    },
    get innerHTML() {
      return this._innerHTML;
    },
    set innerHTML(value: string) {
      this._innerHTML = String(value || '');
    },
  } as any;
}

function withDocumentShim(body: () => void) {
  const originalDocument = (global as any).document;
  const originalWindow = (global as any).window;
  const originalGetComputedStyle = (global as any).getComputedStyle;

  const fakeDocument = {
    documentElement: {},
    querySelector: () => null,
    createElement: () => createFakeElement(),
  } as any;

  (global as any).document = fakeDocument;
  (global as any).window = {
    document: fakeDocument,
    Shopify: {
      locale: 'en',
      shop: {
        currency: 'USD',
      },
      currency: {
        active: 'USD',
      },
    },
  } as any;
  (global as any).getComputedStyle = () => ({ getPropertyValue: () => '' }) as any;

  try {
    body();
  } finally {
    (global as any).document = originalDocument;
    (global as any).window = originalWindow;
    (global as any).getComputedStyle = originalGetComputedStyle;
  }
}

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { ProductPageFooterModalStateMethods } = require('../../../app/assets/widgets/product-page/methods/footer-modal-state-methods.js');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { ProductPageConfigLifecycleMethods } = require('../../../app/assets/widgets/product-page/methods/config-lifecycle-methods.js');

describe('PPB product-page discount messaging rendering', () => {
  function createBaseContext() {
    return {
      elements: {
        footer: createFakeElement(),
      },
      selectedBundle: {
        messaging: {
          progressText: 'Add {conditionText} more to get {discountText}',
          displayOptions: {
            progressBar: {
              enabled: true,
              type: 'simple',
              progressText: 'Need {conditionText} for step',
              successText: 'You got {discountText}!',
            },
          },
        },
        pricing: {
          enabled: true,
          method: 'percentage_off',
          rules: [{
            id: 'rule-1',
            conditionType: 'quantity',
            conditionOperator: 'greater_than_or_equal_to',
            conditionValue: 2,
            discountValue: 15,
          }],
        },
      },
      selectedProducts: [{ v1: 1 }],
      stepProductData: [[{ variantId: 'v1', price: 1000 }]],
      config: {
        showDiscountMessaging: true,
      },
      getDiscountInfoWithSelectedAddonDiscount: (info: Record<string, unknown>) => info as Record<string, unknown>,
      _isProductPageGridTemplate: () => false,
      _renderCogniveFooter: () => {},
      _isProductPageCascadeTemplate: () => false,
    } as any;
  }

  function stripMarkup(value: string) {
    return String(value || '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]*>/g, '')
      .replace(/\\s+/g, ' ')
      .trim();
  }

  it('hides footer messaging when merchant toggle is off', () => {
    withDocumentShim(() => {
      const context = createBaseContext();
      context.config.showDiscountMessaging = false;

      ProductPageFooterModalStateMethods.renderFooter.call(context);

      expect(context.elements.footer.innerHTML).toHaveLength(0);
    });
  });

  it('renders templated progress text in simple mode', () => {
    withDocumentShim(() => {
      const context = createBaseContext();
      context.selectedBundle.messaging.displayOptions.progressBar.progressText = 'Need {conditionText} to unlock {discountText}';

      ProductPageFooterModalStateMethods.renderFooter.call(context);

      expect(context.elements.footer.innerHTML).not.toContain('{conditionText}');
      expect(context.elements.footer.innerHTML).toContain('Need');
      expect(context.elements.footer.innerHTML).toContain('to unlock');
    });
  });

  it('renders stepped markup when step_based is enabled', () => {
    withDocumentShim(() => {
      const context = createBaseContext();
      context.selectedBundle.messaging.displayOptions.progressBar.type = 'step_based';
      context.selectedBundle.pricing.rules = [
        {
          id: 'rule-1',
          conditionType: 'quantity',
          conditionOperator: 'greater_than_or_equal_to',
          conditionValue: 2,
          discountValue: 10,
        },
        {
          id: 'rule-2',
          conditionType: 'quantity',
          conditionOperator: 'greater_than_or_equal_to',
          conditionValue: 4,
          discountValue: 20,
        },
      ];

      ProductPageFooterModalStateMethods.renderFooter.call(context);
      expect(context.elements.footer.innerHTML).toContain('2 Pack');
      expect(context.elements.footer.innerHTML).toContain('4 Pack');
    });
  });
});

describe('PPB Product Page discount messaging config merge', () => {
  it('defaults discount messaging to enabled when pricing is enabled and messaging is missing', () => {
    const context = {
      selectedBundle: {
        pricing: {
          enabled: true,
        },
      },
      config: {},
    } as any;

    ProductPageConfigLifecycleMethods.updateMessagesFromBundle.call(context);

    expect(context.config.showDiscountMessaging).toBe(true);
  });
});
