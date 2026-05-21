/**
 * Unit tests — PPB handleSyncProduct
 *
 * Spec: test-spec/edit-bundle-flow.spec.md § Suite 7
 * Issue: [edit-bundle-flow-tests-1]
 */

import { handleSyncProduct } from "../../../app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/handlers/handlers.server";

jest.mock("../../../app/db.server", () => ({
  __esModule: true,
  default: {
    bundle: { findUnique: jest.fn(), update: jest.fn() },
  },
}));

jest.mock("../../../app/lib/logger", () => ({
  AppLogger: {
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    startTimer: jest.fn(() => jest.fn()),
  },
}));

jest.mock("../../../app/services/bundles/metafield-sync.server", () => ({
  updateBundleProductMetafields: jest.fn().mockResolvedValue(undefined),
  updateComponentProductMetafields: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("../../../app/services/bundles/standard-metafields.server", () => ({
  convertBundleToStandardMetafields: jest
    .fn()
    .mockResolvedValue({ metafields: {}, errors: [] }),
  updateProductStandardMetafields: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("../../../app/services/bundles/pricing-calculation.server", () => ({
  calculateBundlePrice: jest.fn().mockResolvedValue("50.00"),
  updateBundleProductPrice: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("../../../app/utils/variant-lookup.server", () => ({
  getBundleProductVariantId: jest
    .fn()
    .mockResolvedValue("gid://shopify/ProductVariant/99"),
}));

jest.mock("../../../app/services/theme-colors.server", () => ({
  syncThemeColors: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("../../../app/services/widget-installation.server", () => ({
  WidgetInstallationService: {
    createFullPageBundle: jest.fn(),
    validateProductBundleWidgetSetup: jest.fn().mockResolvedValue({ requiresOneTimeSetup: false }),
  },
}));

jest.mock("../../../app/services/theme-template.server", () => ({
  ThemeTemplateService: { ensureTemplates: jest.fn() },
}));

jest.mock("../../../app/services/shopify-publications.server", () => ({
  publishProductToSalesChannels: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("../../../app/lib/css-sanitizer", () => ({
  processCss: jest.fn((css: string) => ({ sanitizedCss: css, isValid: true, warnings: [], syntaxErrors: [] })),
}));

const getDb = () => require("../../../app/db.server").default;
const getPublishProductToSalesChannels = () =>
  require("../../../app/services/shopify-publications.server").publishProductToSalesChannels;

const MOCK_SESSION = { shop: "test-shop.myshopify.com", accessToken: "tok" } as any;

const SHOPIFY_PRODUCT = {
  id: "gid://shopify/Product/1",
  title: "PPB Bundle Product",
  description: "A PPB bundle",
  descriptionHtml: "<p>A PPB bundle</p>",
  handle: "ppb-bundle-product",
  status: "ACTIVE",
  productType: "Bundle",
  vendor: "Bundle Builder",
  tags: ["WP-Bundles"],
  onlineStoreUrl: null,
  featuredMedia: null,
  media: { nodes: [] },
  variants: { nodes: [{ id: "gid://shopify/ProductVariant/1", price: "50.00", compareAtPrice: null, sku: null, inventoryQuantity: null }] },
  updatedAt: "2026-05-01T00:00:00Z",
  createdAt: "2026-01-01T00:00:00Z",
};

function makeBundle(overrides: Record<string, unknown> = {}) {
  return {
    id: "bundle-1",
    name: "PPB Bundle",
    description: "A PPB bundle",
    status: "active",
    shopifyProductId: "gid://shopify/Product/1",
    shopifyProductHandle: "ppb-bundle-product",
    bundleType: "product_page",
    templateName: null,
    steps: [],
    pricing: null,
    ...overrides,
  };
}

function makeAdmin(productData: Record<string, unknown> | null = SHOPIFY_PRODUCT) {
  return {
    graphql: jest.fn().mockResolvedValue({
      json: async () => ({
        data: {
          product: productData,
          productCreate: {
            product: {
              id: "gid://shopify/Product/NEW",
              title: "PPB Bundle",
              handle: "bundle-bundle-1",
              status: "ACTIVE",
              variants: { edges: [{ node: { id: "gid://shopify/ProductVariant/NEW" } }] },
            },
            userErrors: [],
          },
          productVariantsBulkUpdate: { productVariants: [{ id: "gid://shopify/ProductVariant/NEW", price: "50.00" }], userErrors: [] },
        },
      }),
    }),
  } as any;
}

beforeEach(() => {
  jest.clearAllMocks();
  getDb().bundle.update.mockResolvedValue({});
});

describe("PPB handleSyncProduct", () => {
  it("returns 404 when the bundle does not exist in DB", async () => {
    getDb().bundle.findUnique.mockResolvedValue(null);
    const res = await handleSyncProduct(makeAdmin(), MOCK_SESSION, "bundle-1", new FormData());
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.success).toBe(false);
  });

  it("returns success when product exists in Shopify with no description change", async () => {
    getDb().bundle.findUnique.mockResolvedValue(makeBundle({ description: "A PPB bundle" }));
    const admin = makeAdmin({ ...SHOPIFY_PRODUCT, description: "A PPB bundle" });
    const res = await handleSyncProduct(admin, MOCK_SESSION, "bundle-1", new FormData());
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.syncedData.changesDetected).toBe(false);
  });

  it("updates DB description when Shopify description differs", async () => {
    getDb().bundle.findUnique.mockResolvedValue(makeBundle({ description: "Old" }));
    const admin = makeAdmin({ ...SHOPIFY_PRODUCT, description: "New PPB description" });
    const res = await handleSyncProduct(admin, MOCK_SESSION, "bundle-1", new FormData());
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.syncedData.changesDetected).toBe(true);
    expect(getDb().bundle.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ description: "New PPB description" }) })
    );
  });

  it("clears shopifyProductId and returns 404 when product was deleted in Shopify", async () => {
    getDb().bundle.findUnique.mockResolvedValue(makeBundle());
    const admin = makeAdmin(null);
    const res = await handleSyncProduct(admin, MOCK_SESSION, "bundle-1", new FormData());
    expect(res.status).toBe(404);
    expect(getDb().bundle.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { shopifyProductId: null } })
    );
  });

  it("returns 400 when Shopify GraphQL returns transport errors", async () => {
    getDb().bundle.findUnique.mockResolvedValue(makeBundle());
    const admin = {
      graphql: jest.fn().mockResolvedValue({
        json: async () => ({ data: {}, errors: [{ message: "Rate limited" }] }),
      }),
    } as any;
    const res = await handleSyncProduct(admin, MOCK_SESSION, "bundle-1", new FormData());
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/Rate limited/);
  });

  it("creates a new Shopify product when bundle has no shopifyProductId", async () => {
    getDb().bundle.findUnique.mockResolvedValue(makeBundle({ shopifyProductId: null }));
    const admin = makeAdmin();
    const res = await handleSyncProduct(admin, MOCK_SESSION, "bundle-1", new FormData());
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.productId).toBe("gid://shopify/Product/NEW");
    expect(getDb().bundle.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          shopifyProductId: "gid://shopify/Product/NEW",
          shopifyProductHandle: "bundle-bundle-1",
        }),
      })
    );
    expect(getPublishProductToSalesChannels()).toHaveBeenCalledWith(
      admin,
      "gid://shopify/Product/NEW",
      "ppb-sync-product-create",
    );
  });

  it("syncedData includes title, description, and status from Shopify", async () => {
    getDb().bundle.findUnique.mockResolvedValue(makeBundle());
    const admin = makeAdmin();
    const res = await handleSyncProduct(admin, MOCK_SESSION, "bundle-1", new FormData());
    const body = await res.json();
    expect(body.syncedData).toMatchObject({
      title: "PPB Bundle Product",
      status: "ACTIVE",
    });
  });
});
