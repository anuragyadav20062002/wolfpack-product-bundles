// eslint-disable-next-line @typescript-eslint/no-require-imports
const { renderSharedProductCard } = require('../../../app/assets/widgets/shared/components/product-card.js');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { renderQuantityControl } = require('../../../app/assets/widgets/shared/components/quantity-control.js');

describe('shared product card contract', () => {
  const currencyInfo = {
    display: { format: '${{amount}}' },
  };

  const product = {
    id: 'product-1',
    variantId: 'variant-1',
    title: 'Clean Tee',
    imageUrl: 'https://cdn.example.test/tee.jpg',
    price: 1500,
  };

  it('renders an unselected card with stable regions and add button in the action area', () => {
    const html = renderSharedProductCard(product, 0, currencyInfo, { mode: 'grid', addButtonText: 'Add +' });

    expect(html).toContain('data-bw-product-card="true"');
    expect(html).toContain('bw-product-card--mode-grid');
    expect(html).toContain('bw-product-card__media');
    expect(html).toContain('bw-product-card__title');
    expect(html).toContain('bw-product-card__price');
    expect(html).toContain('bw-product-card__action');
    expect(html).toContain('product-add-btn');
    expect(html).toContain('Add +');
  });

  it('renders selected quantity controls inside the same action area', () => {
    const html = renderSharedProductCard(product, 2, currencyInfo, { mode: 'grid' });

    expect(html).toContain('bw-product-card--selected');
    expect(html).toContain('bw-quantity-control');
    expect(html).toContain('inline-qty-display');
    expect(html).not.toContain('product-add-btn');
  });

  it('renders row mode for list-style templates', () => {
    const html = renderSharedProductCard(product, 0, currencyInfo, { mode: 'row' });

    expect(html).toContain('bw-product-card--mode-row');
  });

  it('renders a dedicated variant row when product variant text is present', () => {
    const html = renderSharedProductCard({
      ...product,
      parentTitle: '18k Pedal Ring',
      variantTitle: '11',
    }, 0, currencyInfo);

    expect(html).toContain('bw-product-card__title product-title');
    expect(html).toContain('18k Pedal Ring');
    expect(html).toContain('bw-product-card__variant product-variant-row');
    expect(html).toContain('data-bw-card-variant-row="true"');
    expect(html).toContain('11');
  });

  it('groups title and variant inside one text region separate from price', () => {
    const html = renderSharedProductCard({
      ...product,
      parentTitle: '18k Pedal Ring',
      variantTitle: '11',
    }, 0, currencyInfo);

    expect(html).toContain(`<div class="bw-product-card__text product-text-container bw-product-card__text--has-variant product-text-container--has-variant">
          <div class="bw-product-card__title product-title">18k Pedal Ring</div>
          <div class="bw-product-card__variant product-variant-row" data-bw-card-variant-row="true">11</div>
        </div>`);
    expect(html).toContain('<div class="bw-product-card__price product-price-row">');
  });

  it('keeps variant and price regions present when the card is selected', () => {
    const html = renderSharedProductCard({
      ...product,
      parentTitle: '18k Pedal Ring',
      variantTitle: '11',
    }, 1, currencyInfo);

    expect(html).toContain('bw-product-card--selected');
    expect(html).toContain('data-bw-card-variant-row="true"');
    expect(html).toContain('bw-product-card__price product-price-row');
    expect(html).toContain('bw-product-card__action product-card-action is-expanded');
  });

  it('does not render an empty variant row for default or missing variant text', () => {
    const defaultVariantHtml = renderSharedProductCard({
      ...product,
      variantTitle: 'Default Title',
    }, 0, currencyInfo);
    const missingVariantHtml = renderSharedProductCard(product, 0, currencyInfo);

    expect(defaultVariantHtml).not.toContain('data-bw-card-variant-row="true"');
    expect(missingVariantHtml).not.toContain('data-bw-card-variant-row="true"');
  });

  it('does not infer a variant row from an ordinary hyphenated product title', () => {
    const html = renderSharedProductCard({
      ...product,
      title: 'Pre-order - Limited Edition',
    }, 0, currencyInfo);

    expect(html).toContain('Pre-order - Limited Edition');
    expect(html).not.toContain('data-bw-card-variant-row="true"');
  });

  it('escapes product text used in title and image alt', () => {
    const html = renderSharedProductCard({
      ...product,
      title: '<img src=x onerror=alert(1)>',
    }, 0, currencyInfo);

    expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;');
    expect(html).not.toContain('<img src=x onerror=alert(1)>');
  });
});

describe('shared quantity control contract', () => {
  it('marks increase disabled when product cannot be incremented', () => {
    const html = renderQuantityControl({
      variantId: 'variant-1',
      quantity: 2,
      increaseDisabled: true,
    });

    expect(html).toContain('bw-quantity-control');
    expect(html).toContain('qty-decrease');
    expect(html).toContain('qty-increase');
    expect(html).toContain('disabled aria-disabled="true"');
  });
});
