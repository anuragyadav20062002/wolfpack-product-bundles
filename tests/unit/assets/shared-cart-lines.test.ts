import { readFullPageWidgetSources, readProductPageWidgetSources } from './widget-source-helpers';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const {
  buildCartLineDisplayProperties,
  buildCartLineSourceProperties,
} = require('../../../app/assets/widgets/shared/engine/cart-lines.js');

describe('shared cart-line metadata helpers', () => {
  it('builds source properties with EB-compatible display metadata', () => {
    const sourceProperties = buildCartLineSourceProperties({
      selectedLines: [
        { product: { title: 'Product A' }, quantity: 2 },
        { product: { id: 'variant_b' }, quantity: 1 },
      ],
      retailPrice: '$20.00',
      discountAmount: '$5.00',
      discountPercentage: 25,
    });

    const displayProperties = JSON.parse(sourceProperties._bundle_display_properties);

    expect(displayProperties).toEqual({
      box: '1',
      items: '2 x Product A, 1 x variant_b',
      retailPrice: '$20.00',
      youSave: {
        amount: '$5.00',
        percentage: '25%',
        amountPercentage: '$5.00 (25%)',
      },
    });
  });

  it('can omit box display metadata when the storefront hides bundle quantity options', () => {
    const sourceProperties = buildCartLineSourceProperties({
      selectedLines: [
        { product: { title: 'Product A' }, quantity: 1 },
        { product: { title: 'Product B' }, quantity: 1 },
      ],
      retailPrice: '$20.00',
      includeBox: false,
    });

    const displayProperties = JSON.parse(sourceProperties._bundle_display_properties);

    expect(displayProperties).toEqual({
      items: '1 x Product A, 1 x Product B',
      retailPrice: '$20.00',
    });
  });

  it('maps source display metadata to visible cart-line labels', () => {
    const properties = buildCartLineDisplayProperties({
      box: '1',
      items: '2 x Product A',
      retailPrice: '$20.00',
      youSave: {
        amountPercentage: '$5.00 (25%)',
      },
    }, {
      items: 'Bundle Includes',
      retailPrice: 'Original Price',
      youSave: 'Bundle Savings',
    });

    expect(properties).toEqual({
      Box: '1',
      'Bundle Includes': '2 x Product A',
      'Original Price': '$20.00',
      'Bundle Savings': '$5.00 (25%)',
      _bundle_display_properties: JSON.stringify({
        box: '1',
        items: '2 x Product A',
        retailPrice: '$20.00',
        youSave: {
          amountPercentage: '$5.00 (25%)',
        },
      }),
    });
  });

  it('is included in widget shared modules before widget sources', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const fs = require('node:fs');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const path = require('node:path');
    const script = fs.readFileSync(path.join(process.cwd(), 'scripts/build-widget-bundles.js'), 'utf8');
    const modulesStart = script.indexOf('const WIDGET_SHARED_MODULES = [');
    const modulesEnd = script.indexOf('];', modulesStart);
    const modules = script.slice(modulesStart, modulesEnd);

    expect(modules).toContain('app/assets/widgets/shared/engine/cart-lines.js');
  });

  it('is used by both storefront widget controllers', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const fs = require('node:fs');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const path = require('node:path');
    const fullPageSource = readFullPageWidgetSources();
    const productPageSource = readProductPageWidgetSources();

    expect(fullPageSource).toContain("from './widgets/shared/engine/cart-lines.js';");
    expect(productPageSource).toContain("from '../../shared/engine/cart-lines.js';");
    expect(fullPageSource).toContain('buildSharedCartLineSourceProperties({');
    expect(fullPageSource).toContain('buildSharedCartLineDisplayProperties(displayProperties, this.getCartLineLabels())');
    expect(productPageSource).toContain('buildCartLineSourceProperties({');
  });
});
