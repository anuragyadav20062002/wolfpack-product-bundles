export {};

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { VariantSelectorComponent } = require('../../../app/assets/widgets/shared/variant-selector.js');

describe('FPB Standard mobile variant drawer', () => {
  it('renders drawer content from variant data and formatted prices', () => {
    const view = VariantSelectorComponent.renderStandardMobileDrawerHtml({
      title: 'Keto Fresh Meal Subscription',
      imageUrl: 'https://cdn.example.com/product.jpg',
      variantId: 'variant-6',
      price: 9540,
      variants: [
        {
          id: 'variant-6',
          title: '6 meals',
          option1: '6 meals',
          price: 9540,
          available: true,
          imageUrl: 'https://cdn.example.com/6.jpg',
        },
        {
          id: 'variant-7',
          title: '7 meals',
          option1: '7 meals',
          price: 11130,
          available: false,
          imageUrl: 'https://cdn.example.com/7.jpg',
        },
      ],
    }, {
      placeholder: 'Choose Options',
      formatPrice: (value: number) => `$${(value / 100).toFixed(2)}`,
    });

    expect(view).toContain('Keto Fresh Meal Subscription');
    expect(view).toContain('Choose Options');
    expect(view).toContain('6 meals');
    expect(view).toContain('$95.40');
    expect(view).toContain('7 meals');
    expect(view).toContain('$111.30');
    expect(view).toContain('aria-disabled="true"');
    expect(view).not.toContain('undefined');
  });
});
