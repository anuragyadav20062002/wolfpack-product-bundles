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
    expect(widgetSource).toContain('showCompareAtPrices');
    expect(widgetSource).toContain('Display Compare At Price');
    expect(widgetSource).toContain('this._shouldShowProductComparedAtPrice() && product.compareAtPrice');
  });

  it('uses runtime control flags as a fallback when the bundle payload flag is absent', () => {
    const { ProductPageConfigLifecycleMethods } = require('../../../app/assets/widgets/product-page/methods/config-lifecycle-methods.js');
    const context = {
      selectedBundle: {
        showProductComparedAtPrice: false,
      },
      _getProductPageControls: () => ({
        showCompareAtPrices: 'true',
      }),
      _shouldShowProductComparedAtPrice: ProductPageConfigLifecycleMethods._shouldShowProductComparedAtPrice,
    };

    expect(context._shouldShowProductComparedAtPrice()).toBe(true);
  });
});
