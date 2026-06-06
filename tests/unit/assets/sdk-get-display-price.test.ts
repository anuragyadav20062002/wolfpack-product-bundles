/**
 * Unit Tests — SDK getDisplayPrice helper
 */

export {};

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { getDisplayPrice } = require('../../../app/assets/sdk/get-display-price.js');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PricingCalculator } = require('../../../app/assets/widgets/shared/pricing-calculator.js');

function makeBundle(discountMethod: string | null, discountValue: number | null) {
  if (!discountMethod) return { id: 'b1', name: 'B', steps: [], pricing: { enabled: false, rules: [] } };
  return {
    id: 'b1',
    name: 'B',
    steps: [],
    pricing: {
      enabled: true,
      rules: [
        {
          condition: { type: 'quantity', operator: 'gte', value: 1 },
          discount: { method: discountMethod, value: discountValue },
        },
      ],
    },
  };
}

function makeState(bundle: object, stepProductData: object[][], selections: Record<string, Record<string, number>>) {
  return {
    isReady: true,
    bundleData: bundle,
    steps: (bundle as { steps: object[] }).steps,
    stepProductData,
    selections,
  };
}

describe('getDisplayPrice', () => {
  it('returns zero prices when no items selected', () => {
    const bundle = makeBundle(null, null);
    const state = makeState(bundle, [], {});
    const result = getDisplayPrice(state, PricingCalculator);
    expect(result.original).toBe(0);
    expect(result.discounted).toBe(0);
    expect(result.savings).toBe(0);
    expect(result.savingsPercent).toBe(0);
  });

  it('returns correct prices with no discount', () => {
    const bundle = makeBundle(null, null);
    const state = makeState(
      bundle,
      [[{ variantId: 'v1', price: 2000, available: true }]],
      { step_0: { v1: 2 } },
    );
    (state as { steps: object[] }).steps = [{ id: 'step_0', isFreeGift: false, isDefault: false }];
    const result = getDisplayPrice(state, PricingCalculator);
    expect(result.original).toBe(4000);
    expect(result.discounted).toBe(4000);
    expect(result.savings).toBe(0);
    expect(result.savingsPercent).toBe(0);
  });

  it('calculates 20% off correctly', () => {
    const bundle = makeBundle('percentage_off', 20);
    const state = makeState(
      bundle,
      [[{ variantId: 'v1', price: 5000, available: true }]],
      { step_0: { v1: 2 } },
    );
    (state as { steps: object[] }).steps = [{ id: 'step_0', isFreeGift: false, isDefault: false }];
    const result = getDisplayPrice(state, PricingCalculator);
    expect(result.original).toBe(10000);
    expect(result.discounted).toBe(8000);
    expect(result.savings).toBe(2000);
    expect(result.savingsPercent).toBeCloseTo(20, 1);
  });

  it('calculates fixed_amount_off correctly', () => {
    const bundle = makeBundle('fixed_amount_off', 500);
    const state = makeState(
      bundle,
      [[{ variantId: 'v1', price: 3000, available: true }]],
      { step_0: { v1: 1 } },
    );
    (state as { steps: object[] }).steps = [{ id: 'step_0', isFreeGift: false, isDefault: false }];
    const result = getDisplayPrice(state, PricingCalculator);
    expect(result.original).toBe(3000);
    expect(result.discounted).toBe(2500);
    expect(result.savings).toBe(500);
  });

  it('formatted is a non-empty string', () => {
    const bundle = makeBundle(null, null);
    const state = makeState(
      bundle,
      [[{ variantId: 'v1', price: 1999, available: true }]],
      { step_0: { v1: 1 } },
    );
    (state as { steps: object[] }).steps = [{ id: 'step_0', isFreeGift: false, isDefault: false }];
    const result = getDisplayPrice(state, PricingCalculator);
    expect(typeof result.formatted).toBe('string');
    expect(result.formatted.length).toBeGreaterThan(0);
  });

  it('clamps savingsPercent to 100 when discount equals total', () => {
    const bundle = makeBundle('percentage_off', 100);
    const state = makeState(
      bundle,
      [[{ variantId: 'v1', price: 1000, available: true }]],
      { step_0: { v1: 1 } },
    );
    (state as { steps: object[] }).steps = [{ id: 'step_0', isFreeGift: false, isDefault: false }];
    const result = getDisplayPrice(state, PricingCalculator);
    expect(result.discounted).toBe(0);
    expect(result.savingsPercent).toBeLessThanOrEqual(100);
  });
});
