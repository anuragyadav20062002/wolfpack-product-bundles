/**
 * Unit Tests — shopifyProductHandle persistence in configure handlers
 *
 * Tests the fix applied to both the first-create and re-create paths:
 * when a Shopify product is created in the configure handler, db.bundle.update
 * must write shopifyProductHandle: `bundle-${bundleId}` alongside shopifyProductId.
 *
 * Covers:
 *  - handleSyncBundle (PDP): archive → delete → re-create → DB update
 *  - handleSyncProduct (PDP): first-time product creation → DB update
 */

// ─── Imports (must precede jest.mock for import/first; Jest hoists mocks at runtime) ──

import {
  handleSyncBundle,
  handleSyncProduct,
} from '../../../app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/handlers/handlers.server';

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('../../../app/lib/logger', () => ({
  AppLogger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    startTimer: jest.fn(() => jest.fn()), // returns a no-op endTimer
  },
}));

jest.mock('../../../app/db.server', () => ({
  __esModule: true,
  default: {
    bundle: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

jest.mock('../../../app/services/bundles/pricing-calculation.server', () => ({
  calculateBundlePrice: jest.fn().mockResolvedValue('29.99'),
  updateBundleProductPrice: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../../../app/services/bundles/metafield-sync.server', () => ({
  updateBundleProductMetafields: jest.fn().mockResolvedValue(undefined),
  updateComponentProductMetafields: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../../../app/services/bundles/standard-metafields.server', () => ({
  convertBundleToStandardMetafields: jest.fn().mockResolvedValue({ metafields: {} }),
  updateProductStandardMetafields: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../../../app/services/theme-colors.server', () => ({
  syncThemeColors: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../../../app/services/widget-installation.server', () => ({
  WidgetInstallationService: {
    validateProductBundleWidgetSetup: jest.fn().mockResolvedValue({ widgetInstalled: true }),
  },
}));

jest.mock('../../../app/services/bundles/bundle-configure-handlers.server', () => ({
  normaliseShopifyProductId: jest.fn((id: string) => id),
  safeJsonParse: jest.fn((val: any, def: any) => {
    try { return JSON.parse(val); } catch { return def; }
  }),
  handleUpdateBundleStatus: jest.fn(),
  handleUpdateBundleProduct: jest.fn(),
  handleGetPages: jest.fn(),
  handleGetThemeTemplates: jest.fn(),
  handleGetCurrentTheme: jest.fn(),
  handleEnsureBundleTemplates: jest.fn(),
}));

jest.mock('../../../app/utils/variant-lookup.server', () => ({
  getBundleProductVariantId: jest.fn().mockResolvedValue({ success: true, variantId: 'gid://shopify/ProductVariant/1' }),
}));

jest.mock('../../../app/utils/discount-mappers', () => ({
  mapDiscountMethod: jest.fn((t: string) => t),
}));

const getDb = () => require('../../../app/db.server').default;

// ─── Shared fixtures ──────────────────────────────────────────────────────────

const bundleId = 'cmnrv4f1m0000a63geuvef3f5';
const oldProductId = 'gid://shopify/Product/100';
const newProductId = 'gid://shopify/Product/200';
const newVariantId = 'gid://shopify/ProductVariant/201';

const mockAdmin = { graphql: jest.fn() } as any;
const mockSession = { shop: 'wolfpack-store-test-1.myshopify.com' } as any;

function makeBundle(overrides: Record<string, any> = {}) {
  return {
    id: bundleId,
    name: 'Hello',
    shopId: mockSession.shop,
    bundleType: 'product_page',
    status: 'active',
    description: 'Test bundle',
    templateName: null,
    loadingGif: null,
    shopifyProductId: oldProductId,
    shopifyProductHandle: 'hello-1', // stale handle — what was stored before the fix
    steps: [],
    pricing: null,
    ...overrides,
  };
}

// ─── handleSyncBundle ─────────────────────────────────────────────────────────

describe('handleSyncBundle — shopifyProductHandle persistence', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Archive → success
    // Delete → success
    // Create → returns new product
    // Variant update → success
    let callCount = 0;
    mockAdmin.graphql.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        // Archive
        return Promise.resolve({ json: () => Promise.resolve({ data: { productUpdate: { product: { id: oldProductId, status: 'ARCHIVED' }, userErrors: [] } } }) });
      }
      if (callCount === 2) {
        // Delete
        return Promise.resolve({ json: () => Promise.resolve({ data: { productDelete: { deletedProductId: oldProductId, userErrors: [] } } }) });
      }
      if (callCount === 3) {
        // Create
        return Promise.resolve({ json: () => Promise.resolve({
          data: {
            productCreate: {
              product: {
                id: newProductId,
                title: 'Hello',
                handle: `bundle-${bundleId}`,
                status: 'ACTIVE',
                variants: { edges: [{ node: { id: newVariantId } }] },
              },
              userErrors: [],
            },
          },
        })});
      }
      // Variant price update
      return Promise.resolve({ json: () => Promise.resolve({ data: { productVariantsBulkUpdate: { productVariants: [{ id: newVariantId }], userErrors: [] } } }) });
    });

    getDb().bundle.findUnique.mockResolvedValue(makeBundle());
    getDb().bundle.update.mockResolvedValue({});
  });

  it('writes shopifyProductHandle = `bundle-{id}` to DB after re-creating the Shopify product', async () => {
    const response = await handleSyncBundle(mockAdmin, mockSession, bundleId);
    const body = await response.json();

    expect(body.success).toBe(true);

    // db.bundle.update is called twice: once to clear productId, once to set the new id+handle
    const allUpdateCalls = (getDb().bundle.update as jest.Mock).mock.calls;
    const productIdRestore = allUpdateCalls.find(
      ([args]: [any]) => args?.data?.shopifyProductId === newProductId
    );

    expect(productIdRestore).toBeDefined();
    expect(productIdRestore[0]).toMatchObject({
      where: { id: bundleId },
      data: {
        shopifyProductId: newProductId,
        shopifyProductHandle: `bundle-${bundleId}`,
      },
    });
  });

  it('does not write the stale handle (e.g. hello-1) to DB on re-create', async () => {
    await handleSyncBundle(mockAdmin, mockSession, bundleId);

    const allUpdateCalls = (getDb().bundle.update as jest.Mock).mock.calls;
    const staleHandleCall = allUpdateCalls.find(
      ([args]: [any]) => args?.data?.shopifyProductHandle === 'hello-1'
    );
    expect(staleHandleCall).toBeUndefined();
  });

  it('returns 404 when bundle is not found', async () => {
    getDb().bundle.findUnique.mockResolvedValue(null);
    const response = await handleSyncBundle(mockAdmin, mockSession, bundleId);
    expect(response.status).toBe(404);
  });

  it('returns 400 when bundle has no existing Shopify product', async () => {
    getDb().bundle.findUnique.mockResolvedValue(makeBundle({ shopifyProductId: null }));
    const response = await handleSyncBundle(mockAdmin, mockSession, bundleId);
    expect(response.status).toBe(400);
  });

  it('returns 400 when Shopify archive mutation returns userErrors', async () => {
    mockAdmin.graphql.mockResolvedValueOnce({
      json: () => Promise.resolve({ data: { productUpdate: { userErrors: [{ message: 'Not found' }] } } }),
    });
    const response = await handleSyncBundle(mockAdmin, mockSession, bundleId);
    expect(response.status).toBe(400);
  });

  it('returns 400 when Shopify delete mutation returns userErrors', async () => {
    mockAdmin.graphql
      .mockResolvedValueOnce({ json: () => Promise.resolve({ data: { productUpdate: { product: { id: oldProductId, status: 'ARCHIVED' }, userErrors: [] } } }) })
      .mockResolvedValueOnce({ json: () => Promise.resolve({ data: { productDelete: { userErrors: [{ message: 'Cannot delete' }] } } }) });

    const response = await handleSyncBundle(mockAdmin, mockSession, bundleId);
    expect(response.status).toBe(400);
  });
});

// ─── handleSyncProduct (first-create path) ────────────────────────────────────

describe('handleSyncProduct — shopifyProductHandle persistence on first product create', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Sequence: productCreate → variantUpdate → (metafields skipped — pricing null)
    let graphqlCall = 0;
    mockAdmin.graphql.mockImplementation(() => {
      graphqlCall++;
      if (graphqlCall === 1) {
        // CREATE_PRODUCT
        return Promise.resolve({ json: () => Promise.resolve({
          data: {
            productCreate: {
              product: {
                id: newProductId,
                title: 'Hello',
                handle: `bundle-${bundleId}`,
                status: 'ACTIVE',
                variants: { edges: [{ node: { id: newVariantId } }] },
              },
              userErrors: [],
            },
          },
        })});
      }
      // UPDATE_VARIANT
      return Promise.resolve({ json: () => Promise.resolve({ data: { productVariantsBulkUpdate: { productVariants: [], userErrors: [] } } }) });
    });

    // No existing product — triggers creation path. Include steps/pricing as handleSyncProduct includes them.
    getDb().bundle.findUnique.mockResolvedValue(
      makeBundle({ shopifyProductId: null, shopifyProductHandle: null })
    );
    getDb().bundle.update.mockResolvedValue({});
  });

  it('writes shopifyProductHandle = `bundle-{id}` to DB when no Shopify product exists', async () => {
    const response = await handleSyncProduct(mockAdmin, mockSession, bundleId, new FormData());
    const body = await response.json();

    expect(body.success).toBe(true);

    const allUpdateCalls = (getDb().bundle.update as jest.Mock).mock.calls;
    const productCreateUpdate = allUpdateCalls.find(
      ([args]: [any]) => args?.data?.shopifyProductId === newProductId
    );

    expect(productCreateUpdate).toBeDefined();
    expect(productCreateUpdate[0]).toMatchObject({
      where: { id: bundleId },
      data: {
        shopifyProductId: newProductId,
        shopifyProductHandle: `bundle-${bundleId}`,
      },
    });
  });

  it('does not persist a stale handle when creating a new product', async () => {
    await handleSyncProduct(mockAdmin, mockSession, bundleId, new FormData());

    const allUpdateCalls = (getDb().bundle.update as jest.Mock).mock.calls;
    const staleHandleCall = allUpdateCalls.find(
      ([args]: [any]) =>
        args?.data?.shopifyProductId === newProductId &&
        args?.data?.shopifyProductHandle !== `bundle-${bundleId}`
    );
    expect(staleHandleCall).toBeUndefined();
  });

  it('returns success with productId when product is created', async () => {
    const response = await handleSyncProduct(mockAdmin, mockSession, bundleId, new FormData());
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.productId).toBe(newProductId);
  });

  it('returns 404 when bundle is not found', async () => {
    getDb().bundle.findUnique.mockResolvedValue(null);
    const response = await handleSyncProduct(mockAdmin, mockSession, bundleId, new FormData());
    expect(response.status).toBe(404);
  });
});
