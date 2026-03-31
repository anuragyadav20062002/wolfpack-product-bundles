/**
 * Unit Tests — FPB configure preview handlers
 *
 * Tests: handleCreatePreviewPage(), handleValidateWidgetPlacement() draft-promotion path
 */

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
  writeBundleConfigPageMetafield: jest.fn().mockResolvedValue(undefined),
  publishPreviewPage: jest.fn(),
  getPreviewPageUrl: jest.fn(),
}));

jest.mock('../../../app/services/bundles/metafield-sync.server', () => ({
  updateBundleProductMetafields: jest.fn().mockResolvedValue(undefined),
  updateComponentProductMetafields: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../../../app/services/widget-installation/widget-theme-template.server', () => ({
  ensureProductBundleTemplate: jest.fn().mockResolvedValue({ success: true }),
  syncFullPageBundleProductTemplate: jest.fn().mockResolvedValue(undefined),
}));

// ─── Imports ──────────────────────────────────────────────────────────────────

import { WidgetInstallationService } from '../../../app/services/widget-installation.server';
import {
  writeBundleConfigPageMetafield,
  publishPreviewPage,
  getPreviewPageUrl,
} from '../../../app/services/widget-installation/widget-full-page-bundle.server';
import {
  handleCreatePreviewPage,
  handleValidateWidgetPlacement,
} from '../../../app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/handlers/handlers.server';

const getDb = () => require('../../../app/db.server').default;

const mockCreateFullPageBundle = WidgetInstallationService.createFullPageBundle as jest.MockedFunction<typeof WidgetInstallationService.createFullPageBundle>;
const mockPublishPreviewPage = publishPreviewPage as jest.MockedFunction<typeof publishPreviewPage>;
const mockGetPreviewPageUrl = getPreviewPageUrl as jest.MockedFunction<typeof getPreviewPageUrl>;
const mockWriteBundleConfigPageMetafield = writeBundleConfigPageMetafield as jest.MockedFunction<typeof writeBundleConfigPageMetafield>;

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
const previewPageId = 'gid://shopify/Page/999';
const previewPageHandle = 'preview-my-kit';
const PREVIEW_URL = 'https://test-shop.myshopify.com/pages/preview-my-kit?preview_key=abc';

function makeBundle(overrides: Record<string, any> = {}) {
  return {
    id: bundleId,
    name: 'My Kit',
    shopId: 'test-shop.myshopify.com',
    shopifyPageHandle: null,
    shopifyPageId: null,
    shopifyPreviewPageId: null,
    shopifyPreviewPageHandle: null,
    shopifyProductId: null,
    steps: [],
    pricing: null,
    ...overrides,
  };
}

// ─── handleCreatePreviewPage ──────────────────────────────────────────────────

describe('handleCreatePreviewPage', () => {
  beforeEach(() => { jest.clearAllMocks(); });

  it('returns 404 when bundle is not found', async () => {
    (getDb().bundle.findUnique as jest.Mock).mockResolvedValue(null);

    const response = await handleCreatePreviewPage(mockAdmin, mockSession, bundleId);

    expect(response.status).toBe(404);
  });

  it('creates a draft page and saves preview fields when no existing draft', async () => {
    (getDb().bundle.findUnique as jest.Mock).mockResolvedValue(makeBundle());
    mockCreateFullPageBundle.mockResolvedValue({
      success: true,
      pageId: previewPageId,
      pageHandle: previewPageHandle,
      shareablePreviewUrl: PREVIEW_URL,
    });
    (getDb().bundle.update as jest.Mock).mockResolvedValue({});

    const response = await handleCreatePreviewPage(mockAdmin, mockSession, bundleId);
    const body: any = await response.json();

    expect(mockCreateFullPageBundle).toHaveBeenCalledWith(
      mockAdmin,
      mockSession,
      expect.any(String),
      bundleId,
      '[Preview] My Kit',
      undefined,
      false
    );
    expect(getDb().bundle.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          shopifyPreviewPageId: previewPageId,
          shopifyPreviewPageHandle: previewPageHandle,
        }),
      })
    );
    expect(body.success).toBe(true);
    expect(body.shareablePreviewUrl).toBe(PREVIEW_URL);
  });

  it('returns shareablePreviewUrl from existing draft without creating a new page', async () => {
    (getDb().bundle.findUnique as jest.Mock).mockResolvedValue(
      makeBundle({ shopifyPreviewPageId: previewPageId, shopifyPreviewPageHandle: previewPageHandle })
    );
    mockGetPreviewPageUrl.mockResolvedValue({ success: true, shareablePreviewUrl: PREVIEW_URL });

    const response = await handleCreatePreviewPage(mockAdmin, mockSession, bundleId);
    const body: any = await response.json();

    expect(mockGetPreviewPageUrl).toHaveBeenCalledWith(mockAdmin, previewPageId);
    expect(mockCreateFullPageBundle).not.toHaveBeenCalled();
    expect(getDb().bundle.update).not.toHaveBeenCalled();
    expect(body.success).toBe(true);
    expect(body.shareablePreviewUrl).toBe(PREVIEW_URL);
  });

  it('creates new draft when existing draft page was deleted externally', async () => {
    (getDb().bundle.findUnique as jest.Mock).mockResolvedValue(
      makeBundle({ shopifyPreviewPageId: previewPageId, shopifyPreviewPageHandle: previewPageHandle })
    );
    // Page not found in Shopify
    mockGetPreviewPageUrl.mockResolvedValue({ success: false, pageNotFound: true });
    // New draft creation succeeds
    mockCreateFullPageBundle.mockResolvedValue({
      success: true,
      pageId: 'gid://shopify/Page/888',
      pageHandle: 'preview-my-kit-2',
      shareablePreviewUrl: 'https://test-shop.myshopify.com/pages/preview-my-kit-2?preview_key=xyz',
    });
    (getDb().bundle.update as jest.Mock).mockResolvedValue({});

    const response = await handleCreatePreviewPage(mockAdmin, mockSession, bundleId);
    const body: any = await response.json();

    expect(mockCreateFullPageBundle).toHaveBeenCalled();
    expect(body.success).toBe(true);
    expect(body.shareablePreviewUrl).toContain('preview-my-kit-2');
  });

  it('returns error when draft page creation fails without writing to DB', async () => {
    (getDb().bundle.findUnique as jest.Mock).mockResolvedValue(makeBundle());
    mockCreateFullPageBundle.mockResolvedValue({
      success: false,
      error: 'GraphQL error',
      errorType: 'page_creation_failed',
    });

    const response = await handleCreatePreviewPage(mockAdmin, mockSession, bundleId);
    const body: any = await response.json();

    expect(body.success).toBe(false);
    expect(getDb().bundle.update).not.toHaveBeenCalled();
  });
});

// ─── handleValidateWidgetPlacement — draft promotion path ─────────────────────

describe('handleValidateWidgetPlacement — draft promotion', () => {
  beforeEach(() => { jest.clearAllMocks(); });

  it('promotes existing draft page to published instead of creating a new page', async () => {
    (getDb().bundle.findUnique as jest.Mock).mockResolvedValue(
      makeBundle({ shopifyPreviewPageId: previewPageId, shopifyPreviewPageHandle: previewPageHandle })
    );
    mockPublishPreviewPage.mockResolvedValue({ success: true });
    (getDb().bundle.update as jest.Mock).mockResolvedValue({});

    const response = await handleValidateWidgetPlacement(mockAdmin, mockSession, bundleId);
    const body: any = await response.json();

    expect(mockPublishPreviewPage).toHaveBeenCalledWith(mockAdmin, previewPageId);
    expect(mockCreateFullPageBundle).not.toHaveBeenCalled();
    expect(getDb().bundle.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          shopifyPageHandle: previewPageHandle,
          shopifyPageId: previewPageId,
          shopifyPreviewPageId: null,
          shopifyPreviewPageHandle: null,
        }),
      })
    );
    expect(body.success).toBe(true);
    expect(body.pageHandle).toBe(previewPageHandle);
  });

  it('falls back to creating new published page when publishPreviewPage fails', async () => {
    (getDb().bundle.findUnique as jest.Mock).mockResolvedValue(
      makeBundle({ shopifyPreviewPageId: previewPageId, shopifyPreviewPageHandle: previewPageHandle })
    );
    mockPublishPreviewPage.mockResolvedValue({ success: false, error: 'Page not found' });
    mockCreateFullPageBundle.mockResolvedValue({
      success: true,
      pageId: 'gid://shopify/Page/777',
      pageHandle: 'my-kit',
      pageUrl: 'https://test-shop.myshopify.com/pages/my-kit',
    });
    (getDb().bundle.update as jest.Mock).mockResolvedValue({});

    const response = await handleValidateWidgetPlacement(mockAdmin, mockSession, bundleId);
    const body: any = await response.json();

    expect(mockCreateFullPageBundle).toHaveBeenCalled();
    expect(body.success).toBe(true);
  });

  it('runs existing creation flow unchanged when no draft page exists', async () => {
    (getDb().bundle.findUnique as jest.Mock).mockResolvedValue(makeBundle());
    mockCreateFullPageBundle.mockResolvedValue({
      success: true,
      pageId: 'gid://shopify/Page/1',
      pageHandle: 'my-kit',
      pageUrl: 'https://test-shop.myshopify.com/pages/my-kit',
    });
    (getDb().bundle.update as jest.Mock).mockResolvedValue({});

    await handleValidateWidgetPlacement(mockAdmin, mockSession, bundleId);

    expect(mockPublishPreviewPage).not.toHaveBeenCalled();
    expect(mockCreateFullPageBundle).toHaveBeenCalled();
  });
});
