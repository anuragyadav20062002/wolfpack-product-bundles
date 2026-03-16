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
}));

import { WidgetInstallationService } from '../../../app/services/widget-installation.server';
import { renamePageHandle } from '../../../app/services/widget-installation/widget-full-page-bundle.server';
import {
  handleValidateWidgetPlacement,
  handleRenamePageSlug,
} from '../../../app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/handlers/handlers.server';

const getDb = () => require('../../../app/db.server').default;
const mockCreateFullPageBundle = WidgetInstallationService.createFullPageBundle as jest.MockedFunction<typeof WidgetInstallationService.createFullPageBundle>;
const mockRenamePageHandle = renamePageHandle as jest.MockedFunction<typeof renamePageHandle>;

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
    const body = await response.json();

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
    const body = await response.json();

    expect(mockCreateFullPageBundle).toHaveBeenCalledWith(
      mockAdmin, mockSession, expect.any(String), bundleId, 'My Kit', undefined
    );
    expect(body.success).toBe(true);
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
    const body = await response.json();

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
    const body = await response.json();

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
});
