export {};

const { ProductPageConfigLifecycleMethods } = require('../../../app/assets/widgets/product-page/methods/config-lifecycle-methods.js');
const { ProductPageInpageRenderMethods } = require('../../../app/assets/widgets/product-page/methods/inpage-render-methods.js');
const { renderSharedProductCard } = require('../../../app/assets/widgets/shared/components/product-card.js');

function createTarget() {
  const classList = {
    toggle: jest.fn(),
  } as any;
  return {
    innerHTML: '',
    classList,
    setAttribute: jest.fn(),
    isConnected: true,
  } as any;
}

function createBaseContext(overrides: Record<string, unknown> = {}) {
  return {
    config: {},
    container: { dataset: {} },
    selectedBundle: {
      steps: [{}],
      validateQuantityPerProduct: null,
    },
    stepProductData: [[{ id: 'variant-1', price: 1200, title: 'Card product' }]],
    selectedProducts: [{}],
    selectedProductCategoryIndexes: {},
    activeInpageCategoryIndexes: {},
    normalizeSelectionKey: (value: unknown) => String(value || ''),
    getSelectedQuantity: () => 0,
    getVariantAvailable: () => ({ available: null, outOfStock: false }),
    _filterProductsForInpageCategory: (_currentStep: Record<string, unknown>, products: unknown[]) => products,
    _isProductPageCascadeTemplate: () => false,
    _isProductPageGridTemplate: () => false,
    _usesCompactInpageProductCards: () => false,
    _shouldShowProductComparedAtPrice: () => false,
    renderInlineCardVariantSelector: () => '',
    attachProductEventHandlers: jest.fn(),
    normalizeTitle: (value: unknown) => String(value || ''),
    ...overrides,
  };
}

describe('PPB card control setting parsing', () => {
  it('prefers explicit controls for quantity-input visibility and defaults to dataset when absent', () => {
    const context = {
      ...ProductPageConfigLifecycleMethods,
      container: {
        dataset: {},
      },
      config: {
        controlsSettings: {
          activeControls: {
            displayQuantityInput: 'false',
          },
        },
      },
    } as any;

    context.parseConfiguration();
    expect(context.config.showQuantitySelectorOnCard).toBe(false);

    context.config.controlsSettings.activeControls.displayQuantityInput = 'true';
    context.parseConfiguration();
    expect(context.config.showQuantitySelectorOnCard).toBe(true);
  });

  it('maps displaySeeMore and hover aliases from active controls', () => {
    const context = {
      ...ProductPageConfigLifecycleMethods,
      container: {
        dataset: {},
      },
      config: {
        controlsSettings: {
          activeControls: {
            displaySeeMore: 'true',
            productCardHoverExpansion: '1',
          },
        },
      },
    } as any;

    context.parseConfiguration();
    expect(context.config.displaySeeMoreLink).toBe(true);
    expect(context.config.expandProductCardOnHover).toBe(true);
  });

  it('falls back to dataset quantity setting when controls are absent', () => {
    const context = {
      ...ProductPageConfigLifecycleMethods,
      container: {
        dataset: { showQuantitySelectorOnCard: 'false' },
      },
      config: {
        controlsSettings: {},
      },
    } as any;

    context.parseConfiguration();
    expect(context.config.showQuantitySelectorOnCard).toBe(false);
  });
});

describe('PPB in-page rendering control wiring', () => {
  it('omits row quantity selectors when the showQuantityInput control is disabled', () => {
    const target = createTarget();
    const context = {
      ...ProductPageInpageRenderMethods,
      ...createBaseContext({
        config: {
          showQuantitySelectorOnCard: false,
        },
      }),
    } as any;

    ProductPageInpageRenderMethods._renderInpageStepProducts.call(context, 0, target);

    expect(target.innerHTML).toContain('product-add-btn');
    expect(target.innerHTML).not.toContain('product-quantity-wrapper');
  });

  it('renders row quantity selectors when the showQuantityInput control is enabled', () => {
    const target = createTarget();
    const context = {
      ...ProductPageInpageRenderMethods,
      ...createBaseContext({
        config: {
          showQuantitySelectorOnCard: true,
        },
      }),
    } as any;

    ProductPageInpageRenderMethods._renderInpageStepProducts.call(context, 0, target);

    expect(target.innerHTML).toContain('product-quantity-wrapper');
  });
});

describe('PPB shared product card control classes', () => {
  it('adds see-more rendering for long descriptions when display toggle is on', () => {
    const html = renderSharedProductCard({
      id: 'variant-1',
      title: 'Widget',
      price: 1200,
      description: 'A'.repeat(200),
    }, 0, { display: { format: '$ {{amount}}' } }, {
      displaySeeMoreLink: true,
      expandProductCardOnHover: false,
    });

    expect(html).toContain('bw-product-card--see-more');
    expect(html).toContain('bw-product-card__see-more');
  });

  it('adds hover-expand class when the option is enabled', () => {
    const html = renderSharedProductCard({
      id: 'variant-2',
      title: 'Widget Hover',
      price: 1200,
      description: 'Short desc',
    }, 0, { display: { format: '$ {{amount}}' } }, {
      expandProductCardOnHover: true,
      description: '',
    });

    expect(html).toContain('bw-product-card--hover-expand');
  });
});
