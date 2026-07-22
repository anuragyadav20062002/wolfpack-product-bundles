export {};

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { getInlineVariantSelectorPresentation } = require('../../../app/assets/widgets/shared/variant-selector-policy.js');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { VariantSelectorComponent } = require('../../../app/assets/widgets/shared/variant-selector.js');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { fullPageProductCardFooterMethods } = require('../../../app/assets/widgets/full-page/methods/product-card-footer-methods.js');

describe('FPB Horizontal grouped variant selector', () => {
  const product = {
    id: 'product-1',
    title: 'Fragrance Candle',
    variantId: 'variant-cherry',
    options: ['Scent'],
    variants: [
      { id: 'variant-cherry', title: 'Cherry', option1: 'Cherry', price: 3000, available: true },
      { id: 'variant-vanilla', title: 'Vanilla', option1: 'Vanilla', price: 3000, available: true },
      { id: 'variant-peach', title: 'Peach', option1: 'Peach', price: 3000, available: false },
    ],
  };

  it('uses a dropdown with inline mobile behavior only for Horizontal', () => {
    expect(getInlineVariantSelectorPresentation('HORIZONTAL')).toEqual({
      type: 'dropdown',
      mobileMode: 'inline',
    });
    expect(getInlineVariantSelectorPresentation('STANDARD')).toEqual({
      type: 'dropdown',
      mobileMode: 'drawer',
    });
    expect(getInlineVariantSelectorPresentation('CLASSIC')).toEqual({
      type: 'dropdown',
      mobileMode: 'drawer',
    });
    expect(getInlineVariantSelectorPresentation('COMPACT')).toEqual({
      type: 'buttons',
      mobileMode: null,
    });
  });

  it('marks Horizontal dropdowns for inline mobile interaction and retains variant identities', () => {
    const view = VariantSelectorComponent.renderDropdownHtml(product, 'Scent', {
      placeholder: 'Cherry',
      mobileMode: 'inline',
      hideUnavailable: true,
    });

    expect(view).toContain('data-vs-mobile-mode="inline"');
    expect(view).toContain('data-variant-id="variant-cherry"');
    expect(view).toContain('data-variant-id="variant-vanilla"');
    expect(view).not.toContain('data-variant-id="variant-peach"');
  });

  it.each(['STANDARD', 'CLASSIC', 'COMPACT', 'HORIZONTAL'])(
    'omits unavailable grouped variants from %s cards',
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
              variantSelectorEnabled: true,
              showProductComparedAtPrice: false,
              steps: [{ displayVariantsAsIndividualProducts: false }],
            },
            getFullPageDesignPreset: () => designPreset,
            buildPaidAddonProductDisplayData: (value: unknown) => value,
            isVariantOutOfStock: () => false,
            getProductCardAddButtonText: () => 'Add',
            _resolveText: () => 'Choose Options',
            applyStandardExpandedVariantTitle: () => undefined,
            attachProductCardListeners: () => undefined,
          },
          product,
          0,
        ) as { html: string };

        expect(card.html).toContain('variant-cherry');
        expect(card.html).not.toContain('variant-peach');
      } finally {
        (global as { document?: unknown }).document = originalDocument;
      }
    },
  );
});
