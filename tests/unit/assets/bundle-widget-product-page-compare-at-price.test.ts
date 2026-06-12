import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { readProductPageWidgetSources } from './widget-source-helpers';
describe('PPB compare-at price visibility contract', () => {
  const widgetSource = readProductPageWidgetSources();
  const metafieldSource = readFileSync(
    join(process.cwd(), 'app/services/bundles/metafield-sync/operations/bundle-product.server.ts'),
    'utf8'
  );

  it('writes the EB compare-at setting into the product-page storefront DTO', () => {
    expect(metafieldSource).toContain('showProductComparedAtPrice: bundleConfiguration.showProductComparedAtPrice ?? false');
  });

  it('gates compare-at strike prices behind the EB setting', () => {
    expect(widgetSource).toContain('_shouldShowProductComparedAtPrice()');
    expect(widgetSource).toContain('return this.selectedBundle?.showProductComparedAtPrice === true;');
    expect(widgetSource).toContain('this._shouldShowProductComparedAtPrice() && product.compareAtPrice');
  });
});
