/**
 * Jest Test Setup
 * Global test configuration and mocks for Shopify Bundle App
 */

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'file:./test.db';
process.env.SHOPIFY_API_KEY = 'test_api_key';
process.env.SHOPIFY_API_SECRET = 'test_api_secret';
process.env.SHOPIFY_APP_URL = 'https://test-app.example.com';
process.env.SCOPES = 'read_products,write_products,read_orders,write_orders';
process.env.SHOPIFY_BUNDLE_CART_TRANSFORM_TS_ID = 'test-function-id';

// Global test timeout
jest.setTimeout(30000);

// Mock Shopify Admin API
export const mockShopifyAdmin = {
  graphql: jest.fn(),
  rest: {
    resources: {
      Product: {
        all: jest.fn(),
        find: jest.fn(),
        save: jest.fn(),
        delete: jest.fn()
      },
      Metafield: {
        all: jest.fn(),
        find: jest.fn(),
        save: jest.fn(),
        delete: jest.fn()
      }
    }
  }
};

// Mock Shopify session
export const mockSession = {
  shop: 'test-shop.myshopify.com',
  accessToken: 'test-access-token',
  id: 'test-session-id',
  state: 'test-state',
  isOnline: false,
  scope: 'read_products,write_products'
};

// Mock Prisma client
export const mockPrismaClient = {
  bundle: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn()
  },
  bundleStep: {
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn()
  },
  stepProduct: {
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn()
  },
  bundlePricing: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn()
  },
  session: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn()
  },
  $transaction: jest.fn()
};

// Mock console methods for cleaner test output
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};

// Test utilities
export const createMockBundle = (overrides = {}) => ({
  id: 'test-bundle-1',
  name: 'Test Bundle',
  description: 'A test bundle for unit testing',
  shopId: 'test-shop.myshopify.com',
  shopifyProductId: null,
  bundleType: 'product_page',
  status: 'active',
  active: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides
});

export const createMockBundleStep = (overrides = {}) => ({
  id: 'test-step-1',
  name: 'Test Step',
  position: 0,
  minQuantity: 1,
  maxQuantity: 1,
  enabled: true,
  bundleId: 'test-bundle-1',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides
});

export const createMockStepProduct = (overrides = {}) => ({
  id: 'test-step-product-1',
  stepId: 'test-step-1',
  productId: 'gid://shopify/Product/1',
  title: 'Test Product',
  minQuantity: 1,
  maxQuantity: 1,
  position: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides
});

export const createMockBundlePricing = (overrides = {}) => ({
  id: 'test-pricing-1',
  bundleId: 'test-bundle-1',
  enableDiscount: true,
  discountMethod: 'percentage_off',
  rules: [
    {
      conditionType: 'quantity',
      value: 2,
      discountValue: 10
    }
  ],
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides
});

// Mock GraphQL responses
export const createMockGraphQLResponse = (data: any, errors: any[] = []) => ({
  json: jest.fn().mockResolvedValue({
    data,
    errors: errors.length > 0 ? errors : undefined
  })
});

// Mock cart transform input
export const createMockCartTransformInput = (overrides = {}) => ({
  cart: {
    lines: [
      {
        id: 'gid://shopify/CartLine/1',
        quantity: 1,
        bundleId: { value: 'test-bundle-1' },
        merchandise: {
          __typename: 'ProductVariant',
          id: 'gid://shopify/ProductVariant/1',
          product: {
            id: 'gid://shopify/Product/1',
            title: 'Test Product 1'
          }
        },
        cost: {
          amountPerQuantity: { amount: '10.00', currencyCode: 'USD' },
          totalAmount: { amount: '10.00', currencyCode: 'USD' }
        }
      }
    ]
  },
  shop: {
    all_bundles: {
      value: JSON.stringify([
        {
          id: 'test-bundle-1',
          name: 'Test Bundle',
          bundleParentVariantId: 'gid://shopify/ProductVariant/999',
          pricing: {
            enabled: true,
            method: 'percentage_off',
            rules: [{ conditionType: 'quantity', value: 2, discountValue: 10 }]
          }
        }
      ])
    }
  },
  ...overrides
});

// Reset all mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
});