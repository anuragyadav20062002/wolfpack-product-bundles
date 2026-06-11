import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('PPB List selected drawer shared row migration', () => {
  it('renders Cascade selected drawer items through the shared selected-row renderer', () => {
    const source = readFileSync(
      join(process.cwd(), 'app/assets/widgets/product-page/templates/cascade-template.js'),
      'utf8',
    );

    expect(source).toContain("import { renderSelectedProductRow } from '../../shared/components/selected-product-row.js';");
    expect(source).toContain('renderSelectedProductRow({');
    expect(source).toContain("className: 'bw-ppb-cascade-selected-item gbbMixCascadeBundleCartItem'");
    expect(source).toContain('[data-action=\"remove-selected-product\"]');
    expect(source).toContain('this.removeProductFromSelection(stepIndex, variantId)');
  });
});
