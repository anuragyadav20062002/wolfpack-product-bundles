export {};

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { ProductPageCartMethods } = require('../../../app/assets/widgets/product-page/methods/cart-methods.js');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { fullPageRuntimeCartSettingsMethods } = require('../../../app/assets/widgets/full-page/methods/runtime-cart-settings-methods.js');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { buildCartItems } = require('../../../app/assets/sdk/cart.js');

function makeSdkState() {
  return {
    bundleId: 'bundle_1',
    offerId: 'MIX-894502',
    bundleName: 'Test Bundle',
    steps: [{ id: 'step_1', isFreeGift: false, isDefault: false }],
    selections: {
      step_1: { '123456': 1 },
    },
    stepProductData: [
      [{ variantId: '123456', title: 'Product A', price: 1000, available: true }],
    ],
    formatMoney: (cents: number) => `$${(cents / 100).toFixed(2)}`,
  };
}

describe('bundle session key generation', () => {
  it('generates a 12-character cart-safe key for product-page bundles', () => {
    expect(ProductPageCartMethods.generateBundleSessionKey()).toMatch(/^[A-Z0-9]{12}$/);
  });

  it('generates a 12-character cart-safe key for full-page bundles', () => {
    expect(fullPageRuntimeCartSettingsMethods.generateBundleSessionKey()).toMatch(/^[A-Z0-9]{12}$/);
  });

  it('uses the 12-character session key in SDK offer grouping properties', () => {
    const { items } = buildCartItems(makeSdkState());

    expect(items[0].properties['_wolfpackProductBundle:OfferId']).toMatch(/^MIX-894502_[A-Z0-9]{12}_1$/);
  });
});
