/**
 * Unit Tests: POST /api/install-pdp-widget
 *
 * Verifies that the route correctly calls ensureProductBundleTemplate()
 * and returns the expected response shapes.
 */

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('../../../app/lib/logger', () => ({
  AppLogger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

const mockEnsureProductBundleTemplate = jest.fn();

jest.mock('../../../app/services/widget-installation/widget-theme-template.server', () => ({
  ensureProductBundleTemplate: (...args: unknown[]) => mockEnsureProductBundleTemplate(...args),
}));

const mockRequireAdminSession = jest.fn();

jest.mock('../../../app/lib/auth-guards.server', () => ({
  requireAdminSession: (...args: unknown[]) => mockRequireAdminSession(...args),
}));

import { action } from '../../../app/routes/api/api.install-pdp-widget';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const FAKE_SESSION = { shop: 'test.myshopify.com', accessToken: 'token' };
const FAKE_ADMIN = {};
const ORIGINAL_API_KEY = process.env.SHOPIFY_API_KEY;

function makeRequest(body: object = {}) {
  return new Request('https://app.example.com/api/install-pdp-widget', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

// ─── Tests ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
  process.env.SHOPIFY_API_KEY = 'test-api-key';
  mockRequireAdminSession.mockResolvedValue({ admin: FAKE_ADMIN, session: FAKE_SESSION });
});

afterAll(() => {
  process.env.SHOPIFY_API_KEY = ORIGINAL_API_KEY;
});

describe('POST /api/install-pdp-widget', () => {
  it('returns 405 for non-POST methods', async () => {
    const request = new Request('https://app.example.com/api/install-pdp-widget', {
      method: 'GET',
    });
    const response = await action({ request, params: {}, context: {} } as any);
    expect(response.status).toBe(405);
    const body: any = await response.json();
    expect(body.success).toBe(false);
  });

  it('returns success with templateCreated: true when template is new', async () => {
    mockEnsureProductBundleTemplate.mockResolvedValue({
      success: true,
      templateCreated: true,
      templateAlreadyExists: false,
    });

    const request = makeRequest({ productHandle: 'my-bundle', bundleId: 'bundle-1' });
    const response = await action({ request, params: {}, context: {} } as any);
    const body: any = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.templateCreated).toBe(true);
    expect(body.templateAlreadyExists).toBe(false);
    expect(mockEnsureProductBundleTemplate).toHaveBeenCalledWith(
      FAKE_ADMIN,
      FAKE_SESSION,
      'test-api-key',
    );
  });

  it('returns success with templateAlreadyExists: true when template already installed', async () => {
    mockEnsureProductBundleTemplate.mockResolvedValue({
      success: true,
      templateCreated: false,
      templateAlreadyExists: true,
    });

    const request = makeRequest({ productHandle: 'my-bundle' });
    const response = await action({ request, params: {}, context: {} } as any);
    const body: any = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.templateAlreadyExists).toBe(true);
  });

  it('returns 500 when ensureProductBundleTemplate reports failure', async () => {
    mockEnsureProductBundleTemplate.mockResolvedValue({
      success: false,
      error: 'Theme REST API error',
    });

    const request = makeRequest({ productHandle: 'my-bundle' });
    const response = await action({ request, params: {}, context: {} } as any);
    const body: any = await response.json();

    expect(response.status).toBe(500);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Theme REST API error');
  });

  it('returns 500 when SHOPIFY_API_KEY is not set', async () => {
    delete (process.env as Record<string, string | undefined>).SHOPIFY_API_KEY;

    const request = makeRequest({ productHandle: 'my-bundle' });
    const response = await action({ request, params: {}, context: {} } as any);
    const body: any = await response.json();

    expect(response.status).toBe(500);
    expect(body.success).toBe(false);
  });

  it('returns 500 when ensureProductBundleTemplate throws', async () => {
    mockEnsureProductBundleTemplate.mockRejectedValue(new Error('Unexpected DB failure'));

    const request = makeRequest({ productHandle: 'my-bundle' });
    const response = await action({ request, params: {}, context: {} } as any);
    const body: any = await response.json();

    expect(response.status).toBe(500);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Unexpected DB failure');
  });

  it('handles request body without productHandle gracefully', async () => {
    mockEnsureProductBundleTemplate.mockResolvedValue({
      success: true,
      templateCreated: true,
      templateAlreadyExists: false,
    });

    const request = makeRequest({});
    const response = await action({ request, params: {}, context: {} } as any);
    const body: any = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
  });
});
