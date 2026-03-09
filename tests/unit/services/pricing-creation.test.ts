/**
 * Unit Tests for Price Calculation During Bundle Creation
 * Tests that calculateBundlePrice handles all discount methods correctly
 */

import { createMockGraphQLResponse } from '../../setup';

// We need to test the actual calculateBundlePrice function
// Mock only the external dependencies (admin.graphql calls)

// Clear the module cache to get a fresh import with mocked console
jest.mock('../../../app/lib/logger', () => ({
  AppLogger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

import { calculateBundlePrice, clearPriceCache } from '../../../app/services/bundles/pricing-calculation.server';

describe('calculateBundlePrice — all discount methods', () => {
  const createMockAdmin = (...prices: string[]) => {
    const admin = { graphql: jest.fn() };
    for (const price of prices) {
      admin.graphql.mockResolvedValueOnce(createMockGraphQLResponse({
        product: {
          variants: {
            edges: [{ node: { price } }],
          },
        },
      }));
    }
    return admin;
  };

  const createBundleWithPricing = (
    method: string,
    rules: any[],
    steps: any[],
    enabled = true
  ) => ({
    steps,
    pricing: { enabled, method, rules },
  });

  const singleStepTwoProducts = [
    {
      StepProduct: [
        { productId: 'gid://shopify/Product/1' },
        { productId: 'gid://shopify/Product/2' },
      ],
      minQuantity: 1,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    clearPriceCache();
  });

  it('should calculate price with percentage_off discount', async () => {
    // Two products: $30.00 and $20.00, average = $25.00
    // 20% off → $25.00 * 0.80 = $20.00
    const admin = createMockAdmin('30.00', '20.00');
    const bundle = createBundleWithPricing(
      'percentage_off',
      [{ discount: { value: '20' } }],
      singleStepTwoProducts
    );

    const result = await calculateBundlePrice(admin, bundle);
    expect(result).toBe('20.00');
  });

  it('should calculate price with no discount (pricing disabled)', async () => {
    // Two products: $30.00 and $20.00, average = $25.00
    const admin = createMockAdmin('30.00', '20.00');
    const bundle = {
      steps: singleStepTwoProducts,
      pricing: null,
    };

    const result = await calculateBundlePrice(admin, bundle);
    expect(result).toBe('25.00');
  });

  it('should return default price when bundle has no steps', async () => {
    const admin = createMockAdmin();
    const bundle = { steps: [], pricing: null };

    const result = await calculateBundlePrice(admin, bundle);
    expect(result).toBe('1.00'); // DEFAULT_BUNDLE_PRICE
  });

  it('should return default price when steps is undefined', async () => {
    const admin = createMockAdmin();
    const bundle = { pricing: null };

    const result = await calculateBundlePrice(admin, bundle);
    expect(result).toBe('1.00');
  });

  it('should multiply by step minQuantity', async () => {
    // One product at $10.00, step requires quantity 3
    // Total = $10.00 * 3 = $30.00
    const admin = createMockAdmin('10.00');
    const bundle = {
      steps: [{
        StepProduct: [{ productId: 'gid://shopify/Product/1' }],
        minQuantity: 3,
      }],
      pricing: null,
    };

    const result = await calculateBundlePrice(admin, bundle);
    expect(result).toBe('30.00');
  });

  it('should enforce minimum price of 0.01', async () => {
    // Product at $1.00, 100% discount → $0.00 → clamped to $0.01
    const admin = createMockAdmin('1.00');
    const bundle = createBundleWithPricing(
      'percentage_off',
      [{ discount: { value: '100' } }],
      [{
        StepProduct: [{ productId: 'gid://shopify/Product/1' }],
        minQuantity: 1,
      }]
    );

    const result = await calculateBundlePrice(admin, bundle);
    expect(result).toBe('0.01');
  });

  it('should sum across multiple steps', async () => {
    // Step 1: Product at $10.00, qty 1
    // Step 2: Product at $20.00, qty 1
    // Total = $30.00
    const admin = createMockAdmin('10.00', '20.00');
    const bundle = {
      steps: [
        {
          StepProduct: [{ productId: 'gid://shopify/Product/1' }],
          minQuantity: 1,
        },
        {
          StepProduct: [{ productId: 'gid://shopify/Product/2' }],
          minQuantity: 1,
        },
      ],
      pricing: null,
    };

    const result = await calculateBundlePrice(admin, bundle);
    expect(result).toBe('30.00');
  });
});
