// eslint-disable-next-line @typescript-eslint/no-require-imports
const { renderSharedProductCard } = require('../../../app/assets/widgets/shared/components/product-card.js');

export {};

describe('shared product card add button', () => {
  it('adds an explicit label for plus-only icon buttons', () => {
    const html = renderSharedProductCard(
      { id: 'variant-1', title: 'Test product', price: 1000 },
      0,
      { display: { format: '${{amount}}' } },
      { addButtonText: '+' }
    );

    expect(html).toContain('aria-label="Add"');
  });

  it('does not override text button labels', () => {
    const html = renderSharedProductCard(
      { id: 'variant-1', title: 'Test product', price: 1000 },
      0,
      { display: { format: '${{amount}}' } },
      { addButtonText: 'Add +' }
    );

    expect(html).not.toContain('aria-label=');
    expect(html).toContain('Add +');
  });
});
