/* eslint-disable import/first */
/**
 * Unit Tests for widget-full-page-bundle.server.ts — preview functions
 *
 * Tests: createFullPageBundle() with isPublished param, publishPreviewPage(), getPreviewPageUrl()
 */

import { createMockGraphQLResponse } from '../../setup';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// Mock logger
jest.mock('../../../app/lib/logger', () => ({
  AppLogger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    startTimer: jest.fn(() => jest.fn()),
  },
}));

jest.mock('../../../app/services/bundles/metafield-sync.server', () => ({
  ensurePageBundleIdMetafieldDefinition: jest.fn().mockResolvedValue(undefined),
  ensureCustomPageBundleIdDefinition: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('../../../app/services/widget-installation/widget-theme-editor-links.server', () => ({
  generateThemeEditorDeepLink: jest.fn().mockReturnValue({ url: 'https://theme-editor-link.example.com' }),
}));
jest.mock('../../../app/lib/slug-utils', () => ({
  slugify: jest.requireActual('../../../app/lib/slug-utils').slugify,
  validateSlug: jest.requireActual('../../../app/lib/slug-utils').validateSlug,
  resolveUniqueHandle: jest.fn(),
}));

import {
  createFullPageBundle,
  publishPreviewPage,
  getPreviewPageUrl,
  refreshFullPageBundlePageBody,
} from '../../../app/services/widget-installation/widget-full-page-bundle.server';
import { resolveUniqueHandle } from '../../../app/lib/slug-utils';

const mockResolveUniqueHandle = resolveUniqueHandle as jest.MockedFunction<typeof resolveUniqueHandle>;

const mockSession = { shop: 'test-shop.myshopify.com', accessToken: 'test-token' };
const bundleId = 'bundle-abc123';
const bundleName = 'My Kit';
const pageId = 'gid://shopify/Page/999';
const pageHandle = 'my-kit';
const PREVIEW_URL = 'https://test-shop.myshopify.com/pages/my-kit?preview_key=abc123';

function makeBundle(overrides: Record<string, any> = {}) {
  return {
    id: bundleId,
    name: bundleName,
    description: null,
    status: 'active',
    bundleType: 'full_page',
    fullPageLayout: null,
    bundleDesignTemplate: 'FBP_SIDE_FOOTER',
    bundleDesignPresetId: 'DEFAULT',
    defaultProductsData: {},
    boxSelection: null,
    bundleUpsellConfig: null,
    bundleTextConfig: null,
    personalizationData: null,
    discountDisplayOverride: null,
    individualSellingPlanSelection: {},
    validateQuantityPerProduct: {},
    productSlotsEnabled: false,
    productSlotIconUrl: null,
    useSingleStepCategoriesAsBundleSteps: false,
    renderFilledSlotsAsHorizontalStacked: null,
    shopifyProductId: null,
    steps: [],
    pricing: null,
    showProductPrices: true,
    showCompareAtPrices: true,
    cartRedirectToCheckout: false,
    allowQuantityChanges: true,
    textOverrides: null,
    textOverridesByLocale: null,
    ...overrides,
  };
}

function makeAdminForDraft(opts: { withPreviewUrl?: string; createPageSuccess?: boolean } = {}) {
  const { withPreviewUrl = PREVIEW_URL, createPageSuccess = true } = opts;
  const admin = { graphql: jest.fn() };

  // 1st call: check if page exists (none found)
  admin.graphql.mockResolvedValueOnce(
    createMockGraphQLResponse({ pages: { edges: [] } })
  );
  // 2nd call: pageCreate
  admin.graphql.mockResolvedValueOnce(
    createPageSuccess
      ? createMockGraphQLResponse({
          pageCreate: {
            page: {
              id: pageId,
              title: bundleName,
              handle: pageHandle,
              shareablePreviewUrl: withPreviewUrl,
            },
            userErrors: [],
          },
        })
      : createMockGraphQLResponse({
          pageCreate: {
            page: null,
            userErrors: [{ field: 'handle', message: 'Handle is invalid' }],
          },
        })
  );
  // 3rd call: metafieldsSet (bundle_id)
  admin.graphql.mockResolvedValueOnce(
    createMockGraphQLResponse({
      metafieldsSet: { metafields: [], userErrors: [] },
    })
  );

  return admin;
}

// ─── createFullPageBundle — draft mode ───────────────────────────────────────

describe('createFullPageBundle — isPublished: false (draft mode)', () => {
  beforeEach(() => { jest.clearAllMocks(); });

  it('returns pageUrl with page id and handle when isPublished is false', async () => {
    mockResolveUniqueHandle.mockResolvedValueOnce({ handle: pageHandle, adjusted: false });
    const admin = makeAdminForDraft();

    const result = await createFullPageBundle(
      admin, mockSession, 'api-key', bundleId, bundleName, pageHandle, false
    );

    expect(result.success).toBe(true);
    expect(result.pageUrl).toContain(pageHandle);
    expect(result.pageId).toBe(pageId);
    expect(result.pageHandle).toBe(pageHandle);
  });

  it('calls pageCreate with isPublished: false when draft mode requested', async () => {
    mockResolveUniqueHandle.mockResolvedValueOnce({ handle: pageHandle, adjusted: false });
    const admin = makeAdminForDraft();

    await createFullPageBundle(
      admin, mockSession, 'api-key', bundleId, bundleName, pageHandle, false
    );

    // 2nd graphql call is pageCreate
    const createCall = admin.graphql.mock.calls[1];
    expect(createCall[1].variables.page.isPublished).toBe(false);
  });

  it('returns error when draft page creation fails', async () => {
    mockResolveUniqueHandle.mockResolvedValueOnce({ handle: pageHandle, adjusted: false });
    const admin = makeAdminForDraft({ createPageSuccess: false });

    const result = await createFullPageBundle(
      admin, mockSession, 'api-key', bundleId, bundleName, pageHandle, false
    );

    expect(result.success).toBe(false);
    expect(result.error).toContain('Failed to create page');
  });
});

// ─── createFullPageBundle — published mode (regression guard) ─────────────────

describe('createFullPageBundle — isPublished: true (default, regression guard)', () => {
  beforeEach(() => { jest.clearAllMocks(); });

  it('calls pageCreate with isPublished: true when not specified', async () => {
    mockResolveUniqueHandle.mockResolvedValueOnce({ handle: pageHandle, adjusted: false });
    const admin = makeAdminForDraft({ withPreviewUrl: undefined });

    await createFullPageBundle(
      admin, mockSession, 'api-key', bundleId, bundleName, pageHandle
    );

    const createCall = admin.graphql.mock.calls[1];
    expect(createCall[1].variables.page.isPublished).toBe(true);
  });

  it('returns pageUrl (not shareablePreviewUrl) when isPublished is true', async () => {
    mockResolveUniqueHandle.mockResolvedValueOnce({ handle: pageHandle, adjusted: false });
    const admin = makeAdminForDraft();

    const result = await createFullPageBundle(
      admin, mockSession, 'api-key', bundleId, bundleName, pageHandle, true
    );

    expect(result.success).toBe(true);
    expect(result.pageUrl).toContain(pageHandle);
    // shareablePreviewUrl should not be set for published pages
    expect(result.shareablePreviewUrl).toBeUndefined();
  });
});

// ─── publishPreviewPage ───────────────────────────────────────────────────────

describe('publishPreviewPage', () => {
  beforeEach(() => { jest.clearAllMocks(); });

  it('calls pageUpdate with isPublished: true and returns success', async () => {
    const admin = { graphql: jest.fn() };
    admin.graphql.mockResolvedValueOnce(
      createMockGraphQLResponse({
        pageUpdate: {
          page: { id: pageId, handle: pageHandle, isPublished: true },
          userErrors: [],
        },
      })
    );

    const result = await publishPreviewPage(admin, pageId);

    expect(result.success).toBe(true);
    const call = admin.graphql.mock.calls[0];
    expect(call[1].variables.page.isPublished).toBe(true);
    expect(call[1].variables.id).toBe(pageId);
  });

  it('refreshes page body before publishing when bundle context is provided', async () => {
    const admin = { graphql: jest.fn() };
    admin.graphql
      .mockResolvedValueOnce(
        createMockGraphQLResponse({
          pageUpdate: {
            page: { id: pageId, handle: pageHandle },
            userErrors: [],
          },
        })
      )
      .mockResolvedValueOnce(
        createMockGraphQLResponse({
          pageUpdate: {
            page: { id: pageId, handle: pageHandle, isPublished: true },
            userErrors: [],
          },
        })
      );

    const result = await publishPreviewPage(admin, pageId, bundleId, mockSession.shop);

    expect(result.success).toBe(true);
    const bodyCall = admin.graphql.mock.calls.find(([query]) => String(query).includes('updateFullPageBundlePageBody'));
    expect(bodyCall?.[1]?.variables?.page?.body).toBe('');
  });

  it('returns failure when pageUpdate returns userErrors', async () => {
    const admin = { graphql: jest.fn() };
    admin.graphql.mockResolvedValueOnce(
      createMockGraphQLResponse({
        pageUpdate: {
          page: null,
          userErrors: [{ field: 'isPublished', message: 'Page not found' }],
        },
      })
    );

    const result = await publishPreviewPage(admin, pageId);

    expect(result.success).toBe(false);
    expect(result.error).toContain('Page not found');
  });

  it('returns failure when graphql throws', async () => {
    const admin = { graphql: jest.fn().mockRejectedValueOnce(new Error('Network error')) };

    const result = await publishPreviewPage(admin, pageId);

    expect(result.success).toBe(false);
    expect(result.error).toContain('Network error');
  });
});

// ─── getPreviewPageUrl ────────────────────────────────────────────────────────

describe('getPreviewPageUrl', () => {
  beforeEach(() => { jest.clearAllMocks(); });

  it('returns previewUrl built from page handle for an existing draft page', async () => {
    const admin = { graphql: jest.fn() };
    admin.graphql.mockResolvedValueOnce(
      createMockGraphQLResponse({
        page: { id: pageId, handle: pageHandle },
      })
    );

    const result = await getPreviewPageUrl(admin, pageId, mockSession.shop);

    expect(result.success).toBe(true);
    expect(result.previewUrl).toBe(`https://test-shop.myshopify.com/pages/${pageHandle}`);
  });

  it('refreshes existing preview page body when a bundle id is provided', async () => {
    const admin = { graphql: jest.fn() };
    admin.graphql
      .mockResolvedValueOnce(
        createMockGraphQLResponse({
          page: { id: pageId, handle: pageHandle },
        })
      )
      .mockResolvedValueOnce(
        createMockGraphQLResponse({
          pageUpdate: {
            page: { id: pageId, handle: pageHandle },
            userErrors: [],
          },
        })
      );

    const result = await getPreviewPageUrl(admin, pageId, mockSession.shop, bundleId);

    expect(result.success).toBe(true);
    const updateCall = admin.graphql.mock.calls.find(([query]) => String(query).includes('updateFullPageBundlePageBody'));
    expect(updateCall?.[1]?.variables?.page?.body).toBe('');
    expect(updateCall?.[1]?.variables?.page?.body).not.toContain('data-wpb-full-page-bundle');
    expect(updateCall?.[1]?.variables?.page?.body).not.toContain('/apps/product-bundles/assets/');
  });

  it('returns pageNotFound when page query returns null', async () => {
    const admin = { graphql: jest.fn() };
    admin.graphql.mockResolvedValueOnce(
      createMockGraphQLResponse({ page: null })
    );

    const result = await getPreviewPageUrl(admin, pageId, mockSession.shop);

    expect(result.success).toBe(false);
    expect(result.pageNotFound).toBe(true);
  });

  it('returns failure when graphql throws', async () => {
    const admin = { graphql: jest.fn().mockRejectedValueOnce(new Error('Timeout')) };

    const result = await getPreviewPageUrl(admin, pageId, mockSession.shop);

    expect(result.success).toBe(false);
    expect(result.error).toContain('Timeout');
  });
});

describe('refreshFullPageBundlePageBody', () => {
  beforeEach(() => { jest.clearAllMocks(); });

  it('clears stale embed hydration marker markup from the page body', async () => {
    const admin = { graphql: jest.fn() };
    admin.graphql.mockResolvedValueOnce(
      createMockGraphQLResponse({
        pageUpdate: {
          page: { id: pageId, handle: pageHandle },
          userErrors: [],
        },
      })
    );

    const result = await refreshFullPageBundlePageBody(admin, pageId, bundleId, mockSession.shop, makeBundle({
      bundleDesignTemplate: null,
      bundleDesignPresetId: null,
    }));

    expect(result.success).toBe(true);
    const body = admin.graphql.mock.calls[0]?.[1]?.variables?.page?.body;
    expect(body).toBe('');
    expect(body).not.toContain('data-wpb-full-page-bundle');
    expect(body).not.toContain('/apps/product-bundles/assets/');
  });
});

describe('full-page app embed activation contract', () => {
  it('does not load or hydrate full-page widget assets from the global app embed', () => {
    const embedSource = readFileSync(join(process.cwd(), 'extensions/bundle-builder/blocks/bundle-app-embed.liquid'), 'utf8');

    expect(embedSource).toContain('window.__WOLFPACK_BUNDLE_EMBED_ACTIVE__ = true;');
    expect(embedSource).not.toContain('bundle-widget-full-page-bundled.js');
    expect(embedSource).not.toContain('bundle-widget-full-page.css');
    expect(embedSource).not.toContain('data-wpb-full-page-bundle');
    expect(embedSource).not.toContain('WolfpackFullPageBundle.init');
  });
});
