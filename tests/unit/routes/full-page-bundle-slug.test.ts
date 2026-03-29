/**
 * Unit Tests for full-page bundle slug handlers
 *
 * Tests:
 *   - handleValidateWidgetPlacement with desiredSlug
 *   - handleRenamePageSlug happy path + error paths
 */

import { createMockGraphQLResponse } from '../../setup';

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('../../../app/lib/logger', () => ({
  AppLogger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    startTimer: jest.fn(() => jest.fn()),
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

jest.mock('../../../app/services/widget-installation.server', () => ({
  WidgetInstallationService: {
    createFullPageBundle: jest.fn(),
  },
}));

jest.mock('../../../app/services/widget-installation/widget-full-page-bundle.server', () => ({
  renamePageHandle: jest.fn(),
  writeBundleConfigPageMetafield: jest.fn(),
}));

jest.mock('../../../app/services/bundles/metafield-sync.server', () => ({
  updateBundleProductMetafields: jest.fn(),
  updateComponentProductMetafields: jest.fn(),
}));

jest.mock('../../../app/services/widget-installation/widget-theme-template.server', () => ({
  ensureProductBundleTemplate: jest.fn(),
}));

import { WidgetInstallationService } from '../../../app/services/widget-installation.server';
import { renamePageHandle } from '../../../app/services/widget-installation/widget-full-page-bundle.server';
import { updateBundleProductMetafields } from '../../../app/services/bundles/metafield-sync.server';
import { ensureProductBundleTemplate } from '../../../app/services/widget-installation/widget-theme-template.server';
import {
  handleValidateWidgetPlacement,
  handleRenamePageSlug,
} from '../../../app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/handlers/handlers.server';

const getDb = () => require('../../../app/db.server').default;
const mockCreateFullPageBundle = WidgetInstallationService.createFullPageBundle as jest.MockedFunction<typeof WidgetInstallationService.createFullPageBundle>;
const mockRenamePageHandle = renamePageHandle as jest.MockedFunction<typeof renamePageHandle>;
const mockUpdateBundleProductMetafields = updateBundleProductMetafields as jest.MockedFunction<typeof updateBundleProductMetafields>;
const mockEnsureProductBundleTemplate = ensureProductBundleTemplate as jest.MockedFunction<typeof ensureProductBundleTemplate>;

const mockAdmin = { graphql: jest.fn() } as any;
const mockSession = {
  shop: 'test-shop.myshopify.com',
  accessToken: 'test-token',
  id: 'session-id',
  state: 'test-state',
  isOnline: false,
  scope: '',
} as any;

const bundleId = 'bundle-abc123';

// ─── handleValidateWidgetPlacement with desiredSlug ──────────────────────────

describe('handleValidateWidgetPlacement', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockEnsureProductBundleTemplate.mockResolvedValue({
      success: true,
      templateCreated: false,
      templateAlreadyExists: true,
    });
  });

  it('passes desiredSlug to createFullPageBundle and updates DB with returned handle', async () => {
    (getDb().bundle.findUnique as jest.Mock).mockResolvedValue({
      id: bundleId,
      name: 'My Kit',
      shopId: 'test-shop.myshopify.com',
      shopifyPageId: null,
      shopifyPageHandle: null,
    });

    mockCreateFullPageBundle.mockResolvedValue({
      success: true,
      pageId: 'gid://shopify/Page/1',
      pageHandle: 'custom-slug',
      pageUrl: 'https://test-shop.myshopify.com/pages/custom-slug',
      slugAdjusted: false,
    });

    (getDb().bundle.update as jest.Mock).mockResolvedValue({});

    const response = await handleValidateWidgetPlacement(mockAdmin, mockSession, bundleId, 'custom-slug');
    const body: any = await response.json();

    expect(mockCreateFullPageBundle).toHaveBeenCalledWith(
      mockAdmin,
      mockSession,
      expect.any(String), // apiKey
      bundleId,
      'My Kit',
      'custom-slug'
    );
    expect(getDb().bundle.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ shopifyPageHandle: 'custom-slug' })
      })
    );
    expect(body.success).toBe(true);
    expect(body.pageHandle).toBe('custom-slug');
  });

  it('returns 404 when bundle is not found', async () => {
    (getDb().bundle.findUnique as jest.Mock).mockResolvedValue(null);

    const response = await handleValidateWidgetPlacement(mockAdmin, mockSession, bundleId);

    expect(response.status).toBe(404);
  });

  it('works without desiredSlug (backward compat)', async () => {
    (getDb().bundle.findUnique as jest.Mock).mockResolvedValue({
      id: bundleId,
      name: 'My Kit',
      shopId: 'test-shop.myshopify.com',
    });

    mockCreateFullPageBundle.mockResolvedValue({
      success: true,
      pageId: 'gid://shopify/Page/1',
      pageHandle: 'my-kit',
      pageUrl: 'https://test-shop.myshopify.com/pages/my-kit',
    });

    (getDb().bundle.update as jest.Mock).mockResolvedValue({});

    const response = await handleValidateWidgetPlacement(mockAdmin, mockSession, bundleId);
    const body: any = await response.json();

    expect(mockCreateFullPageBundle).toHaveBeenCalledWith(
      mockAdmin, mockSession, expect.any(String), bundleId, 'My Kit', undefined
    );
    expect(body.success).toBe(true);
  });

  it('syncs bundle product redirect metadata after page creation when a bundle product exists', async () => {
    (getDb().bundle.findUnique as jest.Mock).mockResolvedValue({
      id: bundleId,
      name: 'My Kit',
      description: 'Bundle description',
      status: 'draft',
      bundleType: 'full_page',
      shopId: 'test-shop.myshopify.com',
      shopifyProductId: 'gid://shopify/Product/99',
      steps: [
        {
          id: 'step-1',
          name: 'Step 1',
          position: 1,
          minQuantity: 1,
          maxQuantity: 1,
          enabled: true,
          StepProduct: [{ productId: 'gid://shopify/Product/123', title: 'Product 123' }],
          collections: [],
        },
      ],
      pricing: null,
    });

    mockCreateFullPageBundle.mockResolvedValue({
      success: true,
      pageId: 'gid://shopify/Page/1',
      pageHandle: 'fresh-slug',
      pageUrl: 'https://test-shop.myshopify.com/pages/fresh-slug',
      slugAdjusted: false,
    });

    (getDb().bundle.update as jest.Mock).mockResolvedValue({});
    mockAdmin.graphql.mockResolvedValue(
      createMockGraphQLResponse({
        productUpdate: {
          product: {
            id: 'gid://shopify/Product/99',
            status: 'ACTIVE',
            templateSuffix: 'product-page-bundle',
          },
          userErrors: [],
        },
      }),
    );

    await handleValidateWidgetPlacement(mockAdmin, mockSession, bundleId, 'fresh-slug');

    expect(mockEnsureProductBundleTemplate).toHaveBeenCalled();
    expect(mockUpdateBundleProductMetafields).toHaveBeenCalledWith(
      mockAdmin,
      'gid://shopify/Product/99',
      expect.objectContaining({
        shopifyPageHandle: 'fresh-slug',
        status: 'active',
      }),
    );
  });
});

// ─── handleRenamePageSlug ─────────────────────────────────────────────────────

describe('handleRenamePageSlug', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls renamePageHandle and updates DB on success', async () => {
    (getDb().bundle.findUnique as jest.Mock).mockResolvedValue({
      id: bundleId,
      shopId: 'test-shop.myshopify.com',
      shopifyPageId: 'gid://shopify/Page/1',
      shopifyPageHandle: 'old-slug',
    });

    mockRenamePageHandle.mockResolvedValue({
      success: true,
      newHandle: 'new-slug',
      adjusted: false,
    });

    (getDb().bundle.update as jest.Mock).mockResolvedValue({});

    const response = await handleRenamePageSlug(mockAdmin, mockSession, bundleId, 'new-slug');
    const body: any = await response.json();

    expect(mockRenamePageHandle).toHaveBeenCalledWith(
      mockAdmin,
      'gid://shopify/Page/1',
      'new-slug',
      'old-slug'
    );
    expect(getDb().bundle.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ shopifyPageHandle: 'new-slug' })
      })
    );
    expect(body.success).toBe(true);
    expect(body.newHandle).toBe('new-slug');
  });

  it('returns 404 when bundle is not found', async () => {
    (getDb().bundle.findUnique as jest.Mock).mockResolvedValue(null);

    const response = await handleRenamePageSlug(mockAdmin, mockSession, bundleId, 'new-slug');

    expect(response.status).toBe(404);
  });

  it('returns 400 and does NOT update DB when renamePageHandle fails', async () => {
    (getDb().bundle.findUnique as jest.Mock).mockResolvedValue({
      id: bundleId,
      shopId: 'test-shop.myshopify.com',
      shopifyPageId: 'gid://shopify/Page/1',
      shopifyPageHandle: 'old-slug',
    });

    mockRenamePageHandle.mockResolvedValue({
      success: false,
      error: 'Handle is already taken',
    });

    const response = await handleRenamePageSlug(mockAdmin, mockSession, bundleId, 'new-slug');
    const body: any = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toContain('Handle is already taken');
    expect(getDb().bundle.update).not.toHaveBeenCalled();
  });

  it('returns 400 when bundle has no shopifyPageId (not yet placed)', async () => {
    (getDb().bundle.findUnique as jest.Mock).mockResolvedValue({
      id: bundleId,
      shopId: 'test-shop.myshopify.com',
      shopifyPageId: null,
      shopifyPageHandle: null,
    });

    const response = await handleRenamePageSlug(mockAdmin, mockSession, bundleId, 'new-slug');

    expect(response.status).toBe(400);
    expect(mockRenamePageHandle).not.toHaveBeenCalled();
  });

  it('refreshes bundle product redirect metadata after slug rename when a bundle product exists', async () => {
    (getDb().bundle.findUnique as jest.Mock).mockResolvedValue({
      id: bundleId,
      shopId: 'test-shop.myshopify.com',
      shopifyPageId: 'gid://shopify/Page/1',
      shopifyPageHandle: 'old-slug',
      shopifyProductId: 'gid://shopify/Product/42',
      name: 'My Kit',
      description: 'Bundle description',
      status: 'active',
      bundleType: 'full_page',
      steps: [
        {
          id: 'step-1',
          name: 'Step 1',
          position: 1,
          minQuantity: 1,
          maxQuantity: 1,
          enabled: true,
          StepProduct: [{ productId: 'gid://shopify/Product/123', title: 'Product 123' }],
          collections: [],
        },
      ],
      pricing: null,
    });

    mockRenamePageHandle.mockResolvedValue({
      success: true,
      newHandle: 'renamed-slug',
      adjusted: false,
    });

    (getDb().bundle.update as jest.Mock).mockResolvedValue({});

    await handleRenamePageSlug(mockAdmin, mockSession, bundleId, 'renamed-slug');

    expect(mockUpdateBundleProductMetafields).toHaveBeenCalledWith(
      mockAdmin,
      'gid://shopify/Product/42',
      expect.objectContaining({
        shopifyPageHandle: 'renamed-slug',
      }),
    );
  });
});
