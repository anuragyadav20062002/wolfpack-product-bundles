export {};

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { getInlineVariantSelectorPresentation } = require('../../../app/assets/widgets/shared/variant-selector-policy.js');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { VariantSelectorComponent } = require('../../../app/assets/widgets/shared/variant-selector.js');

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
});
