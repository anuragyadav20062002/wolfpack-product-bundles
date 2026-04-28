/**
 * Unit Tests: api.bundle.$bundleId.json — free gift + default product fields
 *
 * Verifies that the bundle API returns the new step fields:
 *   isFreeGift, freeGiftName, isDefault, defaultVariantId
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
import { loader } from '../../../app/routes/api/api.bundle.$bundleId[.]json';
import { authenticate } from '../../../app/shopify.server';

const getDb = () => require('../../../app/db.server').default;
const mockFindFirst = () => getDb().bundle.findFirst as jest.MockedFunction<any>;
const mockAppProxy = authenticate.public.appProxy as jest.MockedFunction<any>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeRequest(bundleId: string, fields?: string) {
  const params = new URLSearchParams({
    shop: 'test.myshopify.com',
    timestamp: '1234567890',
  });
  if (fields) params.set('fields', fields);
  // Compute HMAC so verifyAppProxyRequest() passes (uses SHOPIFY_API_SECRET from setup.ts)
  const message = [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('&');
  const signature = createHmac('sha256', 'test_api_secret').update(message).digest('hex');
  params.set('signature', signature);
  return new Request(`https://test.myshopify.com/apps/product-bundles/api/bundle/${bundleId}.json?${params.toString()}`);
}

function makeBaseStep(overrides: Record<string, any> = {}) {
  return {
    id: 'step-1',
    name: 'Add Tee',
    position: 0,
    minQuantity: 1,
    maxQuantity: 1,
    enabled: true,
    displayVariantsAsIndividual: false,
    conditionType: null,
    conditionOperator: null,
    conditionValue: null,
    conditionOperator2: null,
    conditionValue2: null,
    collections: [],
    products: null,
    isFreeGift: false,
    freeGiftName: null,
    isDefault: false,
    defaultVariantId: null,
    StepProduct: [],
    ...overrides,
  };
}

function makeBundle(steps: any[] = [makeBaseStep()]) {
  return {
    id: 'bundle-abc',
    name: 'Test Bundle',
    description: null,
    status: 'active',
    bundleType: 'full_page',
    shopId: 'test.myshopify.com',
    shopifyProductId: null,
    fullPageLayout: 'footer_side',
    showStepTimeline: true,
    tierConfig: null,
    promoBannerBgImage: null,
    promoBannerBgImageCrop: null,
    steps,
    pricing: null,
  };
}

// ─── Setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
  mockAppProxy.mockResolvedValue({
    session: { shop: 'test.myshopify.com', accessToken: 'token' },
  });
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('api.bundle.$bundleId.json — free gift & default product fields', () => {

  describe('isFreeGift field', () => {
    it('returns isFreeGift=false by default when not set on step', async () => {
      mockFindFirst().mockResolvedValue(makeBundle([makeBaseStep()]));
      const res = await loader({ request: makeRequest('bundle-abc'), params: { bundleId: 'bundle-abc' }, context: {} }) as Response;
      const data = await res.json();
      expect(data.bundle.steps[0].isFreeGift).toBe(false);
    });

    it('returns isFreeGift=true when step has isFreeGift=true', async () => {
      mockFindFirst().mockResolvedValue(
        makeBundle([makeBaseStep({ isFreeGift: true, freeGiftName: 'cap' })])
      );
      const res = await loader({ request: makeRequest('bundle-abc'), params: { bundleId: 'bundle-abc' }, context: {} }) as Response;
      const data = await res.json();
      expect(data.bundle.steps[0].isFreeGift).toBe(true);
    });
  });

  describe('freeGiftName field', () => {
    it('returns freeGiftName=null when not set', async () => {
      mockFindFirst().mockResolvedValue(makeBundle([makeBaseStep()]));
      const res = await loader({ request: makeRequest('bundle-abc'), params: { bundleId: 'bundle-abc' }, context: {} }) as Response;
      const data = await res.json();
      expect(data.bundle.steps[0].freeGiftName).toBeNull();
    });

    it('returns freeGiftName string when set', async () => {
      mockFindFirst().mockResolvedValue(
        makeBundle([makeBaseStep({ isFreeGift: true, freeGiftName: 'greeting card' })])
      );
      const res = await loader({ request: makeRequest('bundle-abc'), params: { bundleId: 'bundle-abc' }, context: {} }) as Response;
      const data = await res.json();
      expect(data.bundle.steps[0].freeGiftName).toBe('greeting card');
    });
  });

  describe('isDefault field', () => {
    it('returns isDefault=false by default', async () => {
      mockFindFirst().mockResolvedValue(makeBundle([makeBaseStep()]));
      const res = await loader({ request: makeRequest('bundle-abc'), params: { bundleId: 'bundle-abc' }, context: {} }) as Response;
      const data = await res.json();
      expect(data.bundle.steps[0].isDefault).toBe(false);
    });

    it('returns isDefault=true when step is a default step', async () => {
      mockFindFirst().mockResolvedValue(
        makeBundle([makeBaseStep({ isDefault: true, defaultVariantId: 'gid://shopify/ProductVariant/123' })])
      );
      const res = await loader({ request: makeRequest('bundle-abc'), params: { bundleId: 'bundle-abc' }, context: {} }) as Response;
      const data = await res.json();
      expect(data.bundle.steps[0].isDefault).toBe(true);
    });
  });

  describe('defaultVariantId field', () => {
    it('returns defaultVariantId=null when not set', async () => {
      mockFindFirst().mockResolvedValue(makeBundle([makeBaseStep()]));
      const res = await loader({ request: makeRequest('bundle-abc'), params: { bundleId: 'bundle-abc' }, context: {} }) as Response;
      const data = await res.json();
      expect(data.bundle.steps[0].defaultVariantId).toBeNull();
    });

    it('returns defaultVariantId when set', async () => {
      const variantId = 'gid://shopify/ProductVariant/456';
      mockFindFirst().mockResolvedValue(
        makeBundle([makeBaseStep({ isDefault: true, defaultVariantId: variantId })])
      );
      const res = await loader({ request: makeRequest('bundle-abc'), params: { bundleId: 'bundle-abc' }, context: {} }) as Response;
      const data = await res.json();
      expect(data.bundle.steps[0].defaultVariantId).toBe(variantId);
    });
  });

  describe('multi-step bundle with mixed step types', () => {
    it('returns correct fields for each step in a bundle with paid + free gift + default steps', async () => {
      const steps = [
        makeBaseStep({ id: 'step-default', isDefault: true, defaultVariantId: 'gid://shopify/ProductVariant/1' }),
        makeBaseStep({ id: 'step-paid', name: 'Add Tee' }),
        makeBaseStep({ id: 'step-gift', isFreeGift: true, freeGiftName: 'cap', minQuantity: 0 }),
      ];
      mockFindFirst().mockResolvedValue(makeBundle(steps));
      const res = await loader({ request: makeRequest('bundle-abc'), params: { bundleId: 'bundle-abc' }, context: {} }) as Response;
      const data = await res.json();

      expect(data.bundle.steps[0].isDefault).toBe(true);
      expect(data.bundle.steps[0].defaultVariantId).toBe('gid://shopify/ProductVariant/1');
      expect(data.bundle.steps[1].isFreeGift).toBe(false);
      expect(data.bundle.steps[2].isFreeGift).toBe(true);
      expect(data.bundle.steps[2].freeGiftName).toBe('cap');
    });
  });

  describe('backward compatibility', () => {
    it('existing bundles without new fields still return false/null defaults', async () => {
      // Simulate a step that came from DB before migration (no new fields)
      const oldStep = {
        id: 'step-old',
        name: 'Old Step',
        position: 0,
        minQuantity: 1,
        maxQuantity: 1,
        enabled: true,
        displayVariantsAsIndividual: false,
        conditionType: null,
        conditionOperator: null,
        conditionValue: null,
        conditionOperator2: null,
        conditionValue2: null,
        collections: [],
        products: null,
        StepProduct: [],
        // NOTE: new fields absent (simulating pre-migration row)
      };
      mockFindFirst().mockResolvedValue(makeBundle([oldStep as any]));
      const res = await loader({ request: makeRequest('bundle-abc'), params: { bundleId: 'bundle-abc' }, context: {} }) as Response;
      const data = await res.json();

      expect(data.bundle.steps[0].isFreeGift).toBe(false);
      expect(data.bundle.steps[0].freeGiftName).toBeNull();
      expect(data.bundle.steps[0].isDefault).toBe(false);
      expect(data.bundle.steps[0].defaultVariantId).toBeNull();
    });
  });
});
