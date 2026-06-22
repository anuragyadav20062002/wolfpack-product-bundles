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
  it('wires Cascade selected entries to the shared selector', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const fs = require('node:fs');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const path = require('node:path');
    const source = fs.readFileSync(path.join(process.cwd(), 'app/assets/widgets/product-page/templates/cascade-template.js'), 'utf8');

    expect(source).toContain("import { getSelectedProductEntries } from '../../shared/engine/bundle-selectors.js';");
    expect(source).toContain('return getSelectedProductEntries({');
  });
});
