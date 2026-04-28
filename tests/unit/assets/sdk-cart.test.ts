/**
 * Unit Tests — SDK cart module (buildCartItems)
 */

export {};

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { buildCartItems } = require('../../../app/assets/sdk/cart.js');

function makeState(overrides: object = {}) {
  return {
    bundleId: 'bundle_1',
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
    ...overrides,
  };
}

describe('buildCartItems', () => {
  it('produces correct id, quantity, and _bundle_id property', () => {
    const state = makeState();
    const { items } = buildCartItems(state);
    expect(items).toHaveLength(2);

    const itemA = items.find((i: { id: number }) => i.id === 123456);
    expect(itemA).toBeDefined();
    expect(itemA.quantity).toBe(2);
    expect(itemA.properties['_bundle_id']).toBeTruthy();
    expect(itemA.properties['_bundle_name']).toBe('Test Bundle');
  });

  it('all items in one call share the same _bundle_id', () => {
    const state = makeState();
    const { items } = buildCartItems(state);
    const ids = items.map((i: { properties: { _bundle_id: string } }) => i.properties['_bundle_id']);
    expect(new Set(ids).size).toBe(1);
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

  it('_bundle_id includes bundle id prefix', () => {
    const state = makeState();
    const { items } = buildCartItems(state);
    expect(items[0].properties['_bundle_id']).toMatch(/^bundle_1_/);
  });
});
