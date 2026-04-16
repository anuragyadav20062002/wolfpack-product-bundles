/**
 * Unit Tests for widget-full-page-bundle.server.ts
 *
 * Tests: createFullPageBundle() with custom slug, renamePageHandle()
 */

import { createMockGraphQLResponse } from '../../setup';

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

// Mock dependent services so we only test the slug logic
jest.mock('../../../app/services/bundles/metafield-sync.server', () => ({
  ensurePageBundleIdMetafieldDefinition: jest.fn().mockResolvedValue(undefined),
  ensureCustomPageBundleIdDefinition: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('../../../app/services/widget-installation/widget-theme-editor-links.server', () => ({
  generateThemeEditorDeepLink: jest.fn().mockReturnValue({ url: 'https://theme-editor-link.example.com' }),
}));

// Mock slug-utils so we control resolveUniqueHandle behaviour
jest.mock('../../../app/lib/slug-utils', () => ({
  slugify: jest.requireActual('../../../app/lib/slug-utils').slugify,
  validateSlug: jest.requireActual('../../../app/lib/slug-utils').validateSlug,
  resolveUniqueHandle: jest.fn(),
}));

import { createFullPageBundle, renamePageHandle } from '../../../app/services/widget-installation/widget-full-page-bundle.server';
import { resolveUniqueHandle } from '../../../app/lib/slug-utils';

const mockResolveUniqueHandle = resolveUniqueHandle as jest.MockedFunction<typeof resolveUniqueHandle>;

const mockSession = {
  shop: 'test-shop.myshopify.com',
  accessToken: 'test-token',
};

const bundleId = 'bundle-abc123';
const bundleName = 'My Kit';

function makeAdmin(opts: {
  checkPageExists?: boolean;
  createPageSuccess?: boolean;
  createPageHandle?: string;
  createPageId?: string;
  updateSuccess?: boolean;
  metafieldSuccess?: boolean;
} = {}) {
  const admin = { graphql: jest.fn() };
  const {
    checkPageExists = false,
    createPageSuccess = true,
    createPageHandle = 'my-kit',
    createPageId = 'gid://shopify/Page/1',
    updateSuccess = true,
    metafieldSuccess = true,
  } = opts;

  admin.graphql
    // 1st call: check if page exists
    .mockResolvedValueOnce(createMockGraphQLResponse({
      pages: {
        edges: checkPageExists
          ? [{ node: { id: createPageId, title: 'Old', handle: createPageHandle } }]
          : []
      }
    }))
    // 2nd call: pageCreate (or pageUpdate templateSuffix if page exists)
    .mockResolvedValueOnce(createPageSuccess
      ? createMockGraphQLResponse({
          pageCreate: {
            page: { id: createPageId, title: bundleName, handle: createPageHandle },
            userErrors: []
          }
        })
      : createMockGraphQLResponse({
          pageCreate: {
            page: null,
            userErrors: [{ field: 'handle', message: 'Handle is invalid' }]
          }
        })
    )
    // 3rd call: metafieldsSet
    .mockResolvedValueOnce(createMockGraphQLResponse({
      metafieldsSet: { metafields: [], userErrors: metafieldSuccess ? [] : [{ field: 'value', message: 'error' }] }
    }));

  return admin;
}

// ─── createFullPageBundle ─────────────────────────────────────────────────────

describe('createFullPageBundle', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('uses desiredSlug as page handle when provided', async () => {
    mockResolveUniqueHandle.mockResolvedValueOnce({ handle: 'my-kit', adjusted: false });
    const admin = makeAdmin({ createPageHandle: 'my-kit' });

    const result = await createFullPageBundle(admin, mockSession, 'api-key', bundleId, bundleName, 'my-kit');

    expect(result.success).toBe(true);
    expect(result.pageHandle).toBe('my-kit');
    expect(result.slugAdjusted).toBeFalsy();
  });

  it('falls back to slugify(bundleName) when desiredSlug is not provided', async () => {
    mockResolveUniqueHandle.mockResolvedValueOnce({ handle: 'my-kit', adjusted: false });
    const admin = makeAdmin({ createPageHandle: 'my-kit' });

    const result = await createFullPageBundle(admin, mockSession, 'api-key', bundleId, bundleName);

    expect(result.success).toBe(true);
    // slugify('My Kit') = 'my-kit'
    expect(mockResolveUniqueHandle).toHaveBeenCalledWith(admin, 'my-kit');
  });

  it('sets slugAdjusted flag when resolveUniqueHandle adjusts the handle', async () => {
    mockResolveUniqueHandle.mockResolvedValueOnce({ handle: 'my-kit-2', adjusted: true });
    const admin = makeAdmin({ createPageHandle: 'my-kit-2' });

    const result = await createFullPageBundle(admin, mockSession, 'api-key', bundleId, bundleName, 'my-kit');

    expect(result.success).toBe(true);
    expect(result.slugAdjusted).toBe(true);
    expect(result.pageHandle).toBe('my-kit-2');
  });

  it('returns error when page creation fails', async () => {
    mockResolveUniqueHandle.mockResolvedValueOnce({ handle: 'my-kit', adjusted: false });
    const admin = makeAdmin({ createPageSuccess: false });

    const result = await createFullPageBundle(admin, mockSession, 'api-key', bundleId, bundleName, 'my-kit');

    expect(result.success).toBe(false);
    expect(result.error).toContain('Failed to create page');
  });
});

// ─── renamePageHandle ─────────────────────────────────────────────────────────

describe('renamePageHandle', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls pageUpdate and returns success with newHandle', async () => {
    mockResolveUniqueHandle.mockResolvedValueOnce({ handle: 'new-slug', adjusted: false });

    const admin = { graphql: jest.fn() };
    admin.graphql.mockResolvedValueOnce(createMockGraphQLResponse({
      pageUpdate: {
        page: { id: 'gid://shopify/Page/1', handle: 'new-slug' },
        userErrors: []
      }
    }));

    const result = await renamePageHandle(admin, 'gid://shopify/Page/1', 'new-slug', 'old-slug');

    expect(result.success).toBe(true);
    expect(result.newHandle).toBe('new-slug');
    expect(result.adjusted).toBe(false);
  });

  it('returns failure when pageUpdate returns userErrors', async () => {
    mockResolveUniqueHandle.mockResolvedValueOnce({ handle: 'new-slug', adjusted: false });

    const admin = { graphql: jest.fn() };
    admin.graphql.mockResolvedValueOnce(createMockGraphQLResponse({
      pageUpdate: {
        page: null,
        userErrors: [{ field: 'handle', message: 'Handle is already taken' }]
      }
    }));

    const result = await renamePageHandle(admin, 'gid://shopify/Page/1', 'new-slug', 'old-slug');

    expect(result.success).toBe(false);
    expect(result.error).toContain('Handle is already taken');
  });

  it('passes excludeCurrentHandle to resolveUniqueHandle', async () => {
    mockResolveUniqueHandle.mockResolvedValueOnce({ handle: 'new-slug', adjusted: false });

    const admin = { graphql: jest.fn() };
    admin.graphql.mockResolvedValueOnce(createMockGraphQLResponse({
      pageUpdate: {
        page: { id: 'gid://shopify/Page/1', handle: 'new-slug' },
        userErrors: []
      }
    }));

    await renamePageHandle(admin, 'gid://shopify/Page/1', 'new-slug', 'old-slug');

    expect(mockResolveUniqueHandle).toHaveBeenCalledWith(admin, 'new-slug', 'old-slug');
  });
});
