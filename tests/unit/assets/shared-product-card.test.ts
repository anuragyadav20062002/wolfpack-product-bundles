import fs from 'node:fs';
import path from 'node:path';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { renderSharedProductCard } = require('../../../app/assets/widgets/shared/components/product-card.js');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { renderQuantityControl } = require('../../../app/assets/widgets/shared/components/quantity-control.js');

function readCssWithImports(filePath: string, seen = new Set<string>()): string {
  const absolutePath = path.join(process.cwd(), filePath);
  if (seen.has(absolutePath)) return '';
  seen.add(absolutePath);

  const css = fs.readFileSync(absolutePath, 'utf8');
  return css.replace(/@import\s+["']([^"']+)["'];/g, (_statement, importPath: string) => {
    const resolvedPath = path.relative(
      process.cwd(),
      path.join(path.dirname(absolutePath), importPath),
    );
    return readCssWithImports(resolvedPath, seen);
  });
}

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

    const actionStart = html.indexOf('bw-product-card__action');
    const addButtonStart = html.indexOf('product-add-btn');
    expect(addButtonStart).toBeGreaterThan(actionStart);
  });

  it('renders selected quantity controls inside the same action area', () => {
    const html = renderSharedProductCard(product, 2, currencyInfo, { mode: 'grid' });

    expect(html).toContain('bw-product-card--selected');
    expect(html).toContain('bw-quantity-control');
    expect(html).toContain('inline-qty-display');
    expect(html).not.toContain('product-add-btn');

    const actionStart = html.indexOf('bw-product-card__action');
    const quantityStart = html.indexOf('bw-quantity-control');
    expect(quantityStart).toBeGreaterThan(actionStart);
  });

  it('renders row mode for list-style templates', () => {
    const html = renderSharedProductCard(product, 0, currencyInfo, { mode: 'row' });

    expect(html).toContain('bw-product-card--mode-row');
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

describe('shared product card CSS contract', () => {
  it('reserves the product card action area in FPB and PPB raw CSS', () => {
    const fpbCss = readCssWithImports('app/assets/widgets/full-page-css/bundle-widget-full-page.css');
    const ppbCss = readCssWithImports('app/assets/widgets/product-page-css/bundle-widget.css');

    expect(fpbCss).toContain('.bw-product-card__action');
    expect(fpbCss).toContain('min-height:var(--bundle-product-card-action-min-height');
    expect(ppbCss).toContain('.bw-product-card__action');
    expect(ppbCss).toContain('min-height:var(--bundle-product-card-action-min-height');
  });
});
