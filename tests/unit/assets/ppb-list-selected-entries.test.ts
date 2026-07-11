// eslint-disable-next-line @typescript-eslint/no-require-imports
const { getSelectedProductEntries } = require('../../../app/assets/widgets/shared/engine/bundle-selectors.js');

describe('PPB List shared selected product entries selector', () => {
  it('returns selected entries with matching product data', () => {
    const entries = getSelectedProductEntries({
      selectedProducts: [{ variant_a: 2 }],
      stepProductData: [[
        { id: 'product_a', variantId: 'variant_a', title: 'A' },
        { id: 'product_b', variantId: 'variant_b', title: 'B' },
      ]],
    });

    expect(entries).toEqual([{
      stepIndex: 0,
      variantId: 'variant_a',
      quantity: 2,
      product: { id: 'product_a', variantId: 'variant_a', title: 'A' },
    }]);
  });

  it('uses the expansion hook per step', () => {
    const entries = getSelectedProductEntries({
      selectedProducts: [{ variant_a: 1 }],
      stepProductData: [[{ variants: [{ id: 'variant_a', title: 'A' }] }]],
    }, {
      expandProductsByStep: (products: any[]) => products.flatMap((product: any) => product.variants.map((variant: any) => ({
        ...variant,
        variantId: variant.id,
      }))),
    });

    expect(entries).toHaveLength(1);
    expect(entries[0].product.title).toBe('A');
  });

  it('skips entries when selected product data is missing', () => {
    const entries = getSelectedProductEntries({
      selectedProducts: [{ missing_variant: 1 }],
      stepProductData: [[{ id: 'product_a', variantId: 'variant_a' }]],
    });

    expect(entries).toEqual([]);
  });
});

describe('PPB List Cascade selected entries integration', () => {
  it('preserves an open Cascade drawer before footer replacement', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { ProductPageFooterModalStateMethods } = require('../../../app/assets/widgets/product-page/methods/footer-modal-state-methods.js');
    const openDrawer = {
      className: 'bw-ppb-cascade-selected-drawer--open',
      getBoundingClientRect: () => ({ height: 115 }),
    };
    const footer = {
      innerHTML: 'existing drawer',
      querySelector: jest.fn(() => openDrawer),
    };
    const renderCascadeFooter = jest.fn();
    const context: {
      elements: { footer: typeof footer };
      cascadeSelectedDrawerState: { isOpen: boolean; height?: number };
      _isProductPageCascadeTemplate: () => boolean;
      _renderCascadeFooter: typeof renderCascadeFooter;
    } = {
      elements: { footer },
      cascadeSelectedDrawerState: { isOpen: false },
      _isProductPageCascadeTemplate: () => true,
      _renderCascadeFooter: renderCascadeFooter,
    };

    ProductPageFooterModalStateMethods.renderFooter.call(context);

    expect(footer.querySelector).toHaveBeenCalledWith('.bw-ppb-cascade-selected-drawer--open, .gbbMixCascadeCartDrawerContainer--open');
    expect(context.cascadeSelectedDrawerState.isOpen).toBe(true);
    expect(context.cascadeSelectedDrawerState.height).toBe(115);
    expect(footer.innerHTML).toBe('');
    expect(renderCascadeFooter).toHaveBeenCalledWith(footer);
  });

  it('keeps the selected drawer collapsed by default when Cascade has selected entries', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getCascadeSelectedDrawerState } = require('../../../app/assets/widgets/product-page/templates/cascade-template.js');

    expect(getCascadeSelectedDrawerState([{ variantId: 'variant_a', quantity: 1 }])).toEqual({
      isOpen: false,
      selectedQuantity: 1,
      hasSelectedProducts: true,
    });
  });

  it('preserves the selected drawer open state across Cascade footer re-renders', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getCascadeSelectedDrawerState } = require('../../../app/assets/widgets/product-page/templates/cascade-template.js');

    expect(getCascadeSelectedDrawerState([{ variantId: 'variant_a', quantity: 1 }], true)).toEqual({
      isOpen: true,
      selectedQuantity: 1,
      hasSelectedProducts: true,
    });
  });

  it('keeps the selected drawer closed when Cascade has no selected entries', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getCascadeSelectedDrawerState } = require('../../../app/assets/widgets/product-page/templates/cascade-template.js');

    expect(getCascadeSelectedDrawerState([], true)).toEqual({
      isOpen: false,
      selectedQuantity: 0,
      hasSelectedProducts: false,
    });
  });

  it('toggles the selected drawer only when selected entries exist', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getNextCascadeSelectedDrawerExpandedState } = require('../../../app/assets/widgets/product-page/templates/cascade-template.js');
    const onEmpty = jest.fn();

    expect(getNextCascadeSelectedDrawerExpandedState({
      hasSelectedProducts: true,
      isExpanded: false,
      onEmpty,
    })).toBe(true);
    expect(getNextCascadeSelectedDrawerExpandedState({
      hasSelectedProducts: true,
      isExpanded: true,
      onEmpty,
    })).toBe(false);
    expect(getNextCascadeSelectedDrawerExpandedState({
      hasSelectedProducts: false,
      isExpanded: false,
      onEmpty,
    })).toBe(false);
    expect(onEmpty).toHaveBeenCalledTimes(1);
  });

  it('sizes the selected drawer from list content plus the drawer border', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getCascadeSelectedDrawerHeight } = require('../../../app/assets/widgets/product-page/templates/cascade-template.js');
    const list = { scrollHeight: 185 };
    const drawer = {};
    const previousGetComputedStyle = global.getComputedStyle;
    global.getComputedStyle = jest.fn(() => ({ borderTopWidth: '1px' })) as any;

    try {
      expect(getCascadeSelectedDrawerHeight({ list, drawer, viewportHeight: 800 })).toBe(186);
    } finally {
      global.getComputedStyle = previousGetComputedStyle;
    }
  });

  it('prepares EB-style Cascade selected row display data', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { prepareCascadeSelectedProductDisplay } = require('../../../app/assets/widgets/product-page/templates/cascade-template.js');

    const product = prepareCascadeSelectedProductDisplay({
      product: {
        title: '14k Dangling Obsidian Earrings',
        price: 82900,
      },
      variantId: 'variant_a',
      quantity: 2,
      formatPrice: (amount: number) => `$${(amount / 100).toFixed(2)}`,
    });

    expect(product).toMatchObject({
      title: '14k Dangling Obsidian Earrings x 2',
      priceText: '$829.00',
      quantityLabel: 'x 2',
      quantity: 2,
      variantId: 'variant_a',
    });
  });

  it('renders a caller-provided selected row quantity label', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { renderSelectedProductRow } = require('../../../app/assets/widgets/shared/components/selected-product-row.js');

    const view = renderSelectedProductRow({
      title: '14k Dangling Obsidian Earrings x 2',
      variantId: 'variant_a',
      quantity: 2,
      quantityLabel: 'x 2',
      priceText: '$829.00',
    }, {
      className: 'bw-ppb-cascade-selected-item',
    });

    expect(view).toContain('14k Dangling Obsidian Earrings x 2');
    expect(view).toContain('$829.00');
    expect(view).toContain('>x 2</span>');
  });

  it('mounts the Cascade add-to-cart button into the Cascade footer when it is outside', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { shouldMountCascadeAddToCartInFooter } = require('../../../app/assets/widgets/product-page/templates/cascade-template.js');
    const footer = {};

    expect(shouldMountCascadeAddToCartInFooter({ parentElement: {} }, footer)).toBe(true);
    expect(shouldMountCascadeAddToCartInFooter({ parentElement: footer }, footer)).toBe(false);
    expect(shouldMountCascadeAddToCartInFooter(null, footer)).toBe(false);
  });
});
