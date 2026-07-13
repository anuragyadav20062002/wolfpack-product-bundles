import { readProductPageWidgetSources } from './widget-source-helpers';
import { resolveShowProductComparedAtPrice } from '../../../app/lib/bundle-config/product-page-display';
describe('PPB compare-at price visibility contract', () => {
  const widgetSource = readProductPageWidgetSources();

  it('maps the persisted compare-at setting into the product-page storefront flag', () => {
    expect(resolveShowProductComparedAtPrice({ showCompareAtPrices: true })).toBe(true);
    expect(resolveShowProductComparedAtPrice({ showCompareAtPrices: false })).toBe(false);
    expect(resolveShowProductComparedAtPrice({})).toBe(false);
  });

  it('gates compare-at strike prices behind the EB setting', () => {
    expect(widgetSource).toContain('_shouldShowProductComparedAtPrice()');
    expect(widgetSource).toContain('return this.selectedBundle?.showProductComparedAtPrice === true;');
    expect(widgetSource).toContain('this._shouldShowProductComparedAtPrice() && product.compareAtPrice');
  });
});
