/**
 * Unit Tests: ensureProductBundleTemplate
 *
 * Tests the service that creates templates/product.product-page-bundle.json
 * in the active Shopify theme and applies templateSuffix to bundle products.
 *
 * Mocks: admin.graphql (theme ID query), global.fetch (REST asset API), fs, logger
 */

import { createMockGraphQLResponse } from '../../setup';

// ---------------------------------------------------------------------------
// Mock fs so TOML reads are controlled per-test
// ---------------------------------------------------------------------------
jest.mock('fs', () => ({
  readFileSync: jest.fn(),
}));

jest.mock('../../../app/lib/logger', () => ({
  AppLogger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

import * as fs from 'fs';
import { ensureProductBundleTemplate } from '../../../app/services/widget-installation/widget-theme-template.server';

const mockFsReadFileSync = fs.readFileSync as jest.MockedFunction<typeof fs.readFileSync>;
const mockFetch = jest.fn() as jest.MockedFunction<typeof fetch>;
global.fetch = mockFetch;

const mockAdmin = { graphql: jest.fn() };
const mockSession = { shop: 'test-shop.myshopify.com', accessToken: 'test-token' };
const apiKey = 'test_api_key';
const THEME_ID = '123456789';
const TOML_UID = 'test-uid-from-toml-abc123';
const TEMPLATE_KEY = 'templates/product.product-page-bundle.json';

// Builds a fetch mock response
function mockFetchResponse(ok: boolean, body: any = {}) {
  return Promise.resolve({
    ok,
    status: ok ? 200 : 404,
    statusText: ok ? 'OK' : 'Not Found',
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body)),
  } as Response);
}

beforeEach(() => {
  jest.clearAllMocks();
  delete process.env.SHOPIFY_BUNDLE_BLOCK_UUID;

  // Default: TOML readable with a uid
  mockFsReadFileSync.mockReturnValue(`uid = "${TOML_UID}"\n` as any);

  // Default: Admin returns a valid theme ID
  mockAdmin.graphql.mockResolvedValue(
    createMockGraphQLResponse({
      themes: { nodes: [{ id: `gid://shopify/Theme/${THEME_ID}`, name: 'Dawn', role: 'MAIN' }] },
    })
  );
});

// ---------------------------------------------------------------------------
// Active theme resolution
// ---------------------------------------------------------------------------

describe('ensureProductBundleTemplate — theme resolution', () => {
  it('returns failure when no active theme is found', async () => {
    mockAdmin.graphql.mockResolvedValueOnce(
      createMockGraphQLResponse({ themes: { nodes: [] } })
    );

    const result = await ensureProductBundleTemplate(mockAdmin, mockSession, apiKey);

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/no active theme/i);
  });
});

// ---------------------------------------------------------------------------
// Idempotency — template already exists
// ---------------------------------------------------------------------------

describe('ensureProductBundleTemplate — template already exists', () => {
  it('returns templateAlreadyExists:true and skips write when template exists', async () => {
    // HEAD/GET for themeAssetExists → 200 OK
    mockFetch.mockResolvedValueOnce(mockFetchResponse(true, { asset: { key: TEMPLATE_KEY } }));

    const result = await ensureProductBundleTemplate(mockAdmin, mockSession, apiKey);

    expect(result.success).toBe(true);
    expect(result.templateAlreadyExists).toBe(true);
    expect(result.templateCreated).toBe(false);
    // Only one fetch call (exists check) — no write
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// Block UUID resolution
// ---------------------------------------------------------------------------

describe('ensureProductBundleTemplate — UUID resolution', () => {
  it('uses env var when SHOPIFY_BUNDLE_BLOCK_UUID is set', async () => {
    process.env.SHOPIFY_BUNDLE_BLOCK_UUID = 'env-uuid-override';

    // Template does not exist
    mockFetch
      .mockResolvedValueOnce(mockFetchResponse(false))  // exists check → 404
      .mockResolvedValueOnce(mockFetchResponse(true, { asset: { key: 'templates/product.json', value: '{"sections":{},"order":[]}' } })) // read product.json
      .mockResolvedValueOnce(mockFetchResponse(true)); // write

    const result = await ensureProductBundleTemplate(mockAdmin, mockSession, apiKey);

    expect(result.success).toBe(true);
    expect(result.templateCreated).toBe(true);
    // Verify the written template references the env var UUID
    const writeCall = mockFetch.mock.calls.find(c => (c[1] as any)?.method === 'PUT');
    const body = JSON.parse((writeCall![1] as any).body);
    expect(JSON.stringify(body)).toContain('env-uuid-override');
  });

  it('uses TOML uid when env var is not set', async () => {
    mockFetch
      .mockResolvedValueOnce(mockFetchResponse(false))
      .mockResolvedValueOnce(mockFetchResponse(true, { asset: { key: 'templates/product.json', value: '{"sections":{},"order":[]}' } }))
      .mockResolvedValueOnce(mockFetchResponse(true));

    const result = await ensureProductBundleTemplate(mockAdmin, mockSession, apiKey);

    expect(result.success).toBe(true);
    const writeCall = mockFetch.mock.calls.find(c => (c[1] as any)?.method === 'PUT');
    const body = JSON.parse((writeCall![1] as any).body);
    expect(JSON.stringify(body)).toContain(TOML_UID);
  });

  it('returns failure when TOML is unreadable and env var is not set', async () => {
    mockFsReadFileSync.mockImplementation(() => { throw new Error('ENOENT'); });
    mockFetch.mockResolvedValueOnce(mockFetchResponse(false)); // exists check

    const result = await ensureProductBundleTemplate(mockAdmin, mockSession, apiKey);

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/block uuid not found/i);
  });

  it('returns failure when TOML exists but has no uid field', async () => {
    mockFsReadFileSync.mockReturnValue('name = "bundle-builder"\ntype = "theme"\n' as any);
    mockFetch.mockResolvedValueOnce(mockFetchResponse(false));

    const result = await ensureProductBundleTemplate(mockAdmin, mockSession, apiKey);

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/block uuid not found/i);
  });
});

// ---------------------------------------------------------------------------
// Template construction
// ---------------------------------------------------------------------------

describe('ensureProductBundleTemplate — template construction', () => {
  it('creates template successfully when template does not exist', async () => {
    const productJson = JSON.stringify({
      sections: { main: { type: 'main-product', settings: {} } },
      order: ['main'],
    });

    mockFetch
      .mockResolvedValueOnce(mockFetchResponse(false))             // exists → 404
      .mockResolvedValueOnce(mockFetchResponse(true, { asset: { key: 'templates/product.json', value: productJson } })) // read product.json
      .mockResolvedValueOnce(mockFetchResponse(true));             // write

    const result = await ensureProductBundleTemplate(mockAdmin, mockSession, apiKey);

    expect(result.success).toBe(true);
    expect(result.templateCreated).toBe(true);
    expect(result.templateAlreadyExists).toBe(false);
  });

  it('written template contains bundle-product-page block handle', async () => {
    const productJson = JSON.stringify({ sections: {}, order: [] });

    mockFetch
      .mockResolvedValueOnce(mockFetchResponse(false))
      .mockResolvedValueOnce(mockFetchResponse(true, { asset: { value: productJson } }))
      .mockResolvedValueOnce(mockFetchResponse(true));

    await ensureProductBundleTemplate(mockAdmin, mockSession, apiKey);

    const writeCall = mockFetch.mock.calls.find(c => (c[1] as any)?.method === 'PUT');
    const body = JSON.parse((writeCall![1] as any).body);
    const templateStr = body.asset.value;
    expect(templateStr).toContain('bundle-product-page');
    expect(templateStr).toContain(apiKey);
    expect(templateStr).toContain(TOML_UID);
  });

  it('written template is stored at templates/product.product-page-bundle.json', async () => {
    const productJson = JSON.stringify({ sections: {}, order: [] });

    mockFetch
      .mockResolvedValueOnce(mockFetchResponse(false))
      .mockResolvedValueOnce(mockFetchResponse(true, { asset: { value: productJson } }))
      .mockResolvedValueOnce(mockFetchResponse(true));

    await ensureProductBundleTemplate(mockAdmin, mockSession, apiKey);

    const writeCall = mockFetch.mock.calls.find(c => (c[1] as any)?.method === 'PUT');
    const body = JSON.parse((writeCall![1] as any).body);
    expect(body.asset.key).toBe(TEMPLATE_KEY);
  });

  it('preserves existing product.json sections in the new template', async () => {
    const productJson = JSON.stringify({
      sections: {
        main: { type: 'main-product', settings: {} },
        reviews: { type: 'product-reviews', settings: {} },
      },
      order: ['main', 'reviews'],
    });

    mockFetch
      .mockResolvedValueOnce(mockFetchResponse(false))
      .mockResolvedValueOnce(mockFetchResponse(true, { asset: { value: productJson } }))
      .mockResolvedValueOnce(mockFetchResponse(true));

    await ensureProductBundleTemplate(mockAdmin, mockSession, apiKey);

    const writeCall = mockFetch.mock.calls.find(c => (c[1] as any)?.method === 'PUT');
    const body = JSON.parse((writeCall![1] as any).body);
    const written = JSON.parse(body.asset.value);
    expect(written.sections.main).toBeDefined();
    expect(written.sections.reviews).toBeDefined();
    expect(written.sections.bundle_widget).toBeDefined();
    expect(written.order).toContain('bundle_widget');
  });

  it('uses minimal fallback template when product.json is not found', async () => {
    mockFetch
      .mockResolvedValueOnce(mockFetchResponse(false))  // exists → 404
      .mockResolvedValueOnce(mockFetchResponse(false))  // read product.json → 404
      .mockResolvedValueOnce(mockFetchResponse(true));  // write

    const result = await ensureProductBundleTemplate(mockAdmin, mockSession, apiKey);

    expect(result.success).toBe(true);
    const writeCall = mockFetch.mock.calls.find(c => (c[1] as any)?.method === 'PUT');
    const body = JSON.parse((writeCall![1] as any).body);
    const written = JSON.parse(body.asset.value);
    // Minimal fallback has a main section
    expect(written.sections).toBeDefined();
    expect(written.sections.bundle_widget).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// Failure handling — non-fatal
// ---------------------------------------------------------------------------

describe('ensureProductBundleTemplate — failure handling', () => {
  it('returns failure when theme write throws', async () => {
    const productJson = JSON.stringify({ sections: {}, order: [] });

    mockFetch
      .mockResolvedValueOnce(mockFetchResponse(false))
      .mockResolvedValueOnce(mockFetchResponse(true, { asset: { value: productJson } }))
      .mockResolvedValueOnce(mockFetchResponse(false, {})); // write returns non-ok

    const result = await ensureProductBundleTemplate(mockAdmin, mockSession, apiKey);

    expect(result.success).toBe(false);
    expect(result.templateCreated).toBe(false);
  });

  it('returns failure gracefully when fetch throws (network error)', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const result = await ensureProductBundleTemplate(mockAdmin, mockSession, apiKey);

    expect(result.success).toBe(false);
    expect(result.error).toBeTruthy();
  });
});
