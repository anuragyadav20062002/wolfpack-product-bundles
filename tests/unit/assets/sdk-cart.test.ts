/**
 * Unit Tests — SDK cart module (buildCartItems)
 */

export {};

// eslint-disable-next-line @typescript-eslint/no-require-imports
const {
  buildCartItems,
  buildBundleDetailsDisplayProperties,
} = require('../../../app/assets/sdk/cart.js');

function makeState(overrides: object = {}) {
  return {
    bundleId: 'bundle_1',
    offerId: 'MIX-894502',
    bundleName: 'Test Bundle',
    isReady: true,
    steps: [
      { id: 'step_1', isFreeGift: false, isDefault: false },
      { id: 'step_2', isFreeGift: true, isDefault: false },
    ],
    selections: {
      step_1: { '123456': 2 },
      step_2: { '789012': 1 },
    },
    stepProductData: [
      [{ variantId: '123456', title: 'Product A', price: 1000, available: true }],
      [{ variantId: '789012', title: 'Product B (Gift)', price: 500, available: true }],
    ],
    formatMoney: (cents: number) => `$${(cents / 100).toFixed(2)}`,
    ...overrides,
  };
}

describe('buildCartItems', () => {
  it('produces EB-compatible product-page cart line properties', () => {
    const state = makeState();
    const { items } = buildCartItems(state);
    expect(items).toHaveLength(2);

    const itemA = items.find((i: { id: number }) => i.id === 123456);
    expect(itemA).toBeDefined();
    expect(itemA.quantity).toBe(2);
    expect(itemA.properties.Box).toBe('1');
    expect(itemA.properties._bundleName).toBe('Test Bundle');
    expect(itemA.properties['_easyBundle:OfferId']).toMatch(/^MIX-894502_[A-Z0-9]{3}_1$/);
    expect(itemA.properties['_easyBundle:prodQty']).toBe('2');
    expect(itemA.properties).not.toHaveProperty('_bundle_id');
    expect(itemA.properties).not.toHaveProperty('_bundle_name');
    expect(itemA.properties).not.toHaveProperty('_step_index');
  });

  it('all items in one call share the same EB offer-session key with unique item indexes', () => {
    const state = makeState();
    const { items } = buildCartItems(state);
    const offerIds = items.map((i: { properties: { '_easyBundle:OfferId': string } }) => i.properties['_easyBundle:OfferId']);
    const bases = offerIds.map((value: string) => value.replace(/_[0-9]+$/, ''));
    expect(new Set(bases).size).toBe(1);
    expect(offerIds).toEqual([
      `${bases[0]}_1`,
      `${bases[0]}_2`,
    ]);
  });

  it('tags free gift steps with _bundle_step_type = free_gift', () => {
    const state = makeState();
    const { items } = buildCartItems(state);
    const giftItem = items.find((i: { id: number }) => i.id === 789012);
    expect(giftItem.properties['_bundle_step_type']).toBe('free_gift');
  });

  it('skips unavailable products and reports them', () => {
    const state = makeState({
      stepProductData: [
        [{ variantId: '123456', title: 'Product A', price: 1000, available: false }],
        [{ variantId: '789012', title: 'Product B (Gift)', price: 500, available: true }],
      ],
    });
    expect(() => buildCartItems(state)).toThrow(/unavailable/i);
  });

  it('returns empty items array when no selections', () => {
    const state = makeState({ selections: { step_1: {}, step_2: {} } });
    const { items } = buildCartItems(state);
    expect(items).toHaveLength(0);
  });

  it('prefixes numeric product-page offers with MIX-', () => {
    const state = makeState({ offerId: '894502' });
    const { items } = buildCartItems(state);
    expect(items[0].properties['_easyBundle:OfferId']).toMatch(/^MIX-894502_[A-Z0-9]{3}_1$/);
  });

  it('adds preformatted private source properties for cart-line messaging', () => {
    const state = makeState({
      discountAmount: 500,
      discountPercentage: 25,
    });
    const { items } = buildCartItems(state);

    expect(items[0].properties).not.toHaveProperty('_bundle_box');
    expect(items[0].properties).not.toHaveProperty('_bundle_items');
    expect(items[0].properties).not.toHaveProperty('_bundle_retail_price');
    expect(items[0].properties).not.toHaveProperty('_bundle_you_save');
    expect(items[0].properties).not.toHaveProperty('_bundle_you_save_amount');
    expect(items[0].properties).not.toHaveProperty('_bundle_you_save_percentage');

    const displayProperties = JSON.parse(items[0].properties['_bundle_display_properties']);
    expect(displayProperties).toEqual({
      box: '1',
      items: '2 x Product A, 1 x Product B (Gift)',
      retailPrice: '$20.00',
      youSave: {
        amount: '$5.00',
        percentage: '25%',
        amountPercentage: '$5.00 (25%)',
      },
    });
  });

  it('builds bundle_details display properties from SDK source metadata', () => {
    const state = makeState({
      discountAmount: 500,
      discountPercentage: 25,
    });
    const { sourceProperties } = buildCartItems(state);

    expect(buildBundleDetailsDisplayProperties(sourceProperties)).toEqual({
      Box: '1',
      Items: '2 x Product A, 1 x Product B (Gift)',
      'Retail Price': '$20.00',
      'You Save': '$5.00 (25%)',
    });
  });
});
