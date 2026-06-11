// eslint-disable-next-line @typescript-eslint/no-require-imports
const { renderSelectedProductRow } = require('../../../app/assets/widgets/shared/components/selected-product-row.js');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { renderSelectedProductSlots } = require('../../../app/assets/widgets/shared/components/selected-product-slots.js');

function readCssWithImports(filePath, seen = new Set()) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const fs = require('node:fs');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const path = require('node:path');
  const absolutePath = path.join(process.cwd(), filePath);
  if (seen.has(absolutePath)) return '';
  seen.add(absolutePath);

  const css = fs.readFileSync(absolutePath, 'utf8');
  return css.replace(/@import\s+["']([^"']+)["'];/g, (_statement, importPath) => {
    const resolvedPath = path.relative(
      process.cwd(),
      path.join(path.dirname(absolutePath), importPath),
    );
    return readCssWithImports(resolvedPath, seen);
  });
}

describe('shared selected product row contract', () => {
  it('renders a removable selected row from prepared data', () => {
    const html = renderSelectedProductRow({
      id: 'variant-1',
      title: 'The Complete Snowboard',
      variantTitle: 'Ice',
      imageUrl: 'https://cdn.example.com/snowboard.jpg',
      quantity: 2,
      priceText: '$699.95',
    });

    expect(html).toContain('data-bw-selected-row="true"');
    expect(html).toContain('bw-selected-row--filled');
    expect(html).toContain('data-action="remove-selected-product"');
    expect(html).toContain('data-variant-id="variant-1"');
    expect(html).toContain('The Complete Snowboard');
    expect(html).toContain('Ice');
    expect(html).toContain('2');
    expect(html).toContain('$699.95');
  });

  it('marks default rows as included and non-removable', () => {
    const html = renderSelectedProductRow({
      id: 'variant-1',
      title: 'Included product',
      quantity: 1,
      isDefault: true,
    });

    expect(html).toContain('bw-selected-row--default');
    expect(html).toContain('Included');
    expect(html).not.toContain('data-action="remove-selected-product"');
  });

  it('renders an empty skeleton row', () => {
    const html = renderSelectedProductRow(null, { emptyLabel: 'Choose an item' });

    expect(html).toContain('bw-selected-row--empty');
    expect(html).toContain('Choose an item');
    expect(html).not.toContain('data-action="remove-selected-product"');
  });

  it('escapes row text', () => {
    const html = renderSelectedProductRow({
      id: 'variant-1',
      title: '<strong>Snowboard</strong>',
      quantity: 1,
    });

    expect(html).toContain('&lt;strong&gt;Snowboard&lt;/strong&gt;');
    expect(html).not.toContain('<strong>Snowboard</strong>');
  });
});

describe('shared selected product slots contract', () => {
  it('renders empty, filled, default, and locked free-gift slots', () => {
    const html = renderSelectedProductSlots([
      { id: 'slot-1', label: 'Choose first item' },
      { id: 'slot-2', label: 'Selected item', product: { id: 'variant-2', title: 'Selected Snowboard', quantity: 1 } },
      { id: 'slot-3', label: 'Included item', product: { id: 'variant-3', title: 'Default Wax', isDefault: true } },
      { id: 'slot-4', label: 'Gift item', product: { id: 'variant-4', title: 'Free Gift', isFreeGift: true, isLocked: true } },
    ]);

    expect(html).toContain('data-bw-selected-slots="true"');
    expect(html).toContain('bw-selected-slot--empty');
    expect(html).toContain('bw-selected-slot--filled');
    expect(html).toContain('bw-selected-slot--default');
    expect(html).toContain('bw-selected-slot--free-gift');
    expect(html).toContain('bw-selected-slot--locked');
    expect(html).toContain('data-action="select-slot"');
    expect(html).toContain('data-action="remove-selected-product"');
    expect(html).toContain('Default Wax');
    expect(html).toContain('Free Gift');
  });

  it('supports vertical mode without changing slot data', () => {
    const html = renderSelectedProductSlots([
      { id: 'slot-1', label: 'Choose first item' },
    ], { mode: 'vertical' });

    expect(html).toContain('bw-selected-slots--mode-vertical');
  });
});

describe('shared selected summary CSS contract', () => {
  it('defines selected row and slot classes in FPB and PPB raw CSS', () => {
    const fpbCss = readCssWithImports('app/assets/widgets/full-page-css/bundle-widget-full-page.css');
    const ppbCss = readCssWithImports('app/assets/widgets/product-page-css/bundle-widget.css');

    for (const css of [fpbCss, ppbCss]) {
      expect(css).toContain('.bw-selected-row');
      expect(css).toContain('.bw-selected-row__action');
      expect(css).toContain('.bw-selected-slots');
      expect(css).toContain('.bw-selected-slot');
    }
  });
});
