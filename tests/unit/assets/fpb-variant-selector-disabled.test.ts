export {};

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { fullPageProductCardFooterMethods } = require('../../../app/assets/widgets/full-page/methods/product-card-footer-methods.js');

class FakeTarget {
  classList = { contains: (name: string) => name === 'product-add-btn' };
  dataset = { productId: 'variant-cherry' };

  closest(selector: string) {
    return selector === '.product-add-btn' ? this : null;
  }
}

class FakeCard {
  dataset: Record<string, string> = {};
  private listeners: Array<(event: any) => void> = [];

  addEventListener(eventName: string, listener: (event: any) => void) {
    if (eventName === 'click') this.listeners.push(listener);
  }

  querySelector() {
    return null;
  }

  dispatchAdd() {
    const event = { target: new FakeTarget(), stopPropagation: jest.fn() };
    this.listeners.forEach((listener) => listener(event));
    return event;
  }
}

const groupedProduct = {
  id: 'product-candle',
  variantId: 'variant-cherry',
  title: 'Fragrance Candle',
  price: 3000,
  options: ['Scent'],
  variants: [
    { id: 'variant-cherry', option1: 'Cherry', available: true },
    { id: 'variant-vanilla', option1: 'Vanilla', available: true },
    { id: 'variant-peach', option1: 'Peach', available: false },
  ],
};

describe('FPB disabled variant-selector behavior', () => {
  it.each(['STANDARD', 'CLASSIC', 'COMPACT', 'HORIZONTAL'])(
    'renders the configured quick-look action for grouped %s cards',
    (designPreset) => {
      const originalDocument = (global as { document?: unknown }).document;
      let renderedHtml = '';
      (global as { document?: unknown }).document = {
        createElement: () => ({
          firstChild: null as null | { html: string },
          get innerHTML() { return renderedHtml; },
          set innerHTML(value: string) {
            renderedHtml = value;
            this.firstChild = { html: value };
          },
        }),
      };

      try {
        const card = fullPageProductCardFooterMethods.createProductCard.call(
          {
            selectedProducts: [{}],
            selectedBundle: {
              variantSelectorEnabled: false,
              showProductComparedAtPrice: false,
              steps: [{ displayVariantsAsIndividualProducts: false }],
            },
            getFullPageDesignPreset: () => designPreset,
            buildPaidAddonProductDisplayData: (value: unknown) => value,
            isVariantOutOfStock: () => false,
            getProductCardAddButtonText: () => 'Add To Box',
            _resolveText: (key: string, fallback: string) =>
              key === 'chooseOptionsButton' ? 'Choose Options' : fallback,
            applyStandardExpandedVariantTitle: () => undefined,
            attachProductCardListeners: () => undefined,
          },
          { ...groupedProduct, variants: [...groupedProduct.variants] },
          0,
        ) as { html: string };

        expect(card.html).toContain('Choose Options');
        expect(card.html).not.toContain('vs-wrapper');
      } finally {
        (global as { document?: unknown }).document = originalDocument;
      }
    },
  );

  it('opens variant selection instead of adding the default variant', () => {
    const card = new FakeCard();
    const updateProductSelection = jest.fn();
    const open = jest.fn();

    fullPageProductCardFooterMethods.attachProductCardListeners.call(
      {
        selectedBundle: { variantSelectorEnabled: false, steps: [{}] },
        selectedProducts: [{}],
        productModal: { open },
        getFullPageDesignPreset: () => 'STANDARD',
        updateProductSelection,
      },
      card,
      groupedProduct,
      0,
      { openVariantModalOnAdd: true },
    );

    card.dispatchAdd();

    expect(open).toHaveBeenCalledWith(groupedProduct, {}, {
      initialImageIndex: 0,
      readOnly: false,
    });
    expect(updateProductSelection).not.toHaveBeenCalled();
  });
});
