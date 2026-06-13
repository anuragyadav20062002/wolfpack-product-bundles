/**
 * Unit Tests: api.bundle.$bundleId.json + wpb.$bundleId — DRAFT bundle exclusion
 *
 * Triage: docs/superpowers/specs/2026-06-13-june-2026-feedback-triage.md item #8
 * Intent: DRAFT bundles must be hidden from public storefront surfaces. The
 *   widget API and the FPB proxy route both serve public-facing requests, so
 *   their bundle.findFirst() where-clauses must include only ACTIVE + UNLISTED.
 */
/* eslint-disable import/first */

jest.mock('../../../app/lib/logger', () => ({
  AppLogger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    startTimer: jest.fn(() => jest.fn()),
  },
}));

jest.mock('../../../app/shopify.server', () => ({
  authenticate: {
    public: {
      appProxy: jest.fn(),
    },
  },
}));

jest.mock('../../../app/db.server', () => ({
  __esModule: true,
  default: {
    bundle: {
      findFirst: jest.fn(),
    },
  },
}));

import { createHmac } from 'node:crypto';
import { loader as apiBundleLoader } from '../../../app/routes/api/api.bundle.$bundleId[.]json';
import { loader as wpbProxyLoader } from '../../../app/routes/root/wpb.$bundleId';
import { authenticate } from '../../../app/shopify.server';
import { BundleStatus } from '../../../app/constants/bundle';

const getDb = () => require('../../../app/db.server').default;
const mockFindFirst = () => getDb().bundle.findFirst as jest.MockedFunction<any>;
const mockAppProxy = authenticate.public.appProxy as jest.MockedFunction<any>;

function makeApiRequest(bundleId: string) {
  const params = new URLSearchParams({
    shop: 'test.myshopify.com',
    timestamp: '1234567890',
  });
  const message = [...params.entries()]
    .map(([k, v]) => `${k}=${v}`)
    .sort()
    .join('');
  params.set('signature', createHmac('sha256', 'test_api_secret').update(message).digest('hex'));
  return new Request(`https://test.myshopify.com/apps/product-bundles/api/bundle/${bundleId}.json?${params.toString()}`);
}

function makeProxyRequest(bundleId: string) {
  const params = new URLSearchParams({
    shop: 'test-shop.myshopify.com',
    path_prefix: '/apps/product-bundles',
    timestamp: '1770000000',
  });
  const message = [...params.entries()]
    .map(([k, v]) => `${k}=${v}`)
    .sort()
    .join('');
  params.set('signature', createHmac('sha256', 'test_api_secret').update(message).digest('hex'));
  return new Request(`https://test-shop.myshopify.com/apps/product-bundles/wpb/${bundleId}?${params.toString()}`);
}

describe('api.bundle.$bundleId.json — status filtering', () => {
  const originalSecret = process.env.SHOPIFY_API_SECRET;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.SHOPIFY_API_SECRET = 'test_api_secret';
    mockAppProxy.mockResolvedValue({
      session: { shop: 'test.myshopify.com', accessToken: 'token' },
    });
  });

  afterAll(() => {
    process.env.SHOPIFY_API_SECRET = originalSecret;
  });

  it('excludes DRAFT bundles from the findFirst where-clause', async () => {
    mockFindFirst().mockResolvedValue(null);

    await apiBundleLoader({
      request: makeApiRequest('bundle-1'),
      params: { bundleId: 'bundle-1' },
      context: {},
    } as any);

    expect(mockFindFirst()).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: { in: [BundleStatus.ACTIVE, BundleStatus.UNLISTED] },
        }),
      }),
    );
  });

  it('does not allow DRAFT in the status filter set', async () => {
    mockFindFirst().mockResolvedValue(null);

    await apiBundleLoader({
      request: makeApiRequest('bundle-1'),
      params: { bundleId: 'bundle-1' },
      context: {},
    } as any);

    const call = mockFindFirst().mock.calls[0]?.[0];
    expect(call?.where?.status?.in).not.toContain(BundleStatus.DRAFT);
  });
});

describe('wpb.$bundleId (FPB proxy page) — status filtering', () => {
  const originalSecret = process.env.SHOPIFY_API_SECRET;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.SHOPIFY_API_SECRET = 'test_api_secret';
  });

  afterAll(() => {
    process.env.SHOPIFY_API_SECRET = originalSecret;
  });

  it('excludes DRAFT bundles from the findFirst where-clause', async () => {
    mockFindFirst().mockResolvedValue(null);

    await wpbProxyLoader({
      request: makeProxyRequest('bundle-1'),
      params: { bundleId: 'bundle-1' },
      context: {},
    } as any);

    expect(mockFindFirst()).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: { in: [BundleStatus.ACTIVE, BundleStatus.UNLISTED] },
        }),
      }),
    );
  });

  it('does not allow DRAFT in the status filter set', async () => {
    mockFindFirst().mockResolvedValue(null);

    await wpbProxyLoader({
      request: makeProxyRequest('bundle-1'),
      params: { bundleId: 'bundle-1' },
      context: {},
    } as any);

    const call = mockFindFirst().mock.calls[0]?.[0];
    expect(call?.where?.status?.in).not.toContain(BundleStatus.DRAFT);
  });
});
