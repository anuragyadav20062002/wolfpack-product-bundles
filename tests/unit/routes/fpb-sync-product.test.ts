/**
 * Unit tests — FPB handleSyncProduct
 *
 * Spec: test-spec/edit-bundle-flow.spec.md § Suite 6
 * Issue: [edit-bundle-flow-tests-1]
 */

import { handleSyncProduct } from "../../../app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/handlers/handlers.server";

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

jest.mock(
  "../../../app/services/widget-installation/widget-full-page-bundle.server",
  () => ({
    writeBundleConfigPageMetafield: jest.fn().mockResolvedValue(undefined),
    renamePageHandle: jest.fn(),
    publishPreviewPage: jest.fn(),
    getPreviewPageUrl: jest.fn(),
  })
);

jest.mock("../../../app/services/widget-installation.server", () => ({
  WidgetInstallationService: {
    createFullPageBundle: jest.fn(),
    validateProductBundleWidgetSetup: jest.fn(),
  },
}));

jest.mock("../../../app/lib/tier-config-validator.server", () => ({
  validateTierConfig: jest.fn().mockResolvedValue(null),
}));

jest.mock("../../../app/services/theme-template.server", () => ({
  ThemeTemplateService: { ensureTemplates: jest.fn() },
}));

const getDb = () => require("../../../app/db.server").default;

const MOCK_SESSION = { shop: "test-shop.myshopify.com", accessToken: "tok" } as any;

const SHOPIFY_PRODUCT = {
  id: "gid://shopify/Product/1",
  title: "Bundle Product",
  description: "A bundle",
  descriptionHtml: "<p>A bundle</p>",
  handle: "bundle-product",
  status: "ACTIVE",
  productType: "Bundle",
  vendor: "Bundle Builder",
  tags: ["WP-Bundles"],
  onlineStoreUrl: null,
  featuredMedia: null,
  media: { nodes: [] },
  variants: {
    nodes: [{ id: "gid://shopify/ProductVariant/1", price: "50.00", compareAtPrice: null, sku: null, inventoryQuantity: null }],
  },
  updatedAt: "2026-05-01T00:00:00Z",
  createdAt: "2026-01-01T00:00:00Z",
};

function makeBundle(overrides: Record<string, unknown> = {}) {
  return {
    id: "bundle-1",
    name: "FPB Bundle",
    description: "A bundle",
    status: "active",
    shopifyProductId: "gid://shopify/Product/1",
    shopifyPageId: null,
    bundleType: "full_page",
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
              title: "Bundle Product",
              handle: "bundle-bundle-1",
              status: "ACTIVE",
              variants: { edges: [{ node: { id: "gid://shopify/ProductVariant/NEW" } }] },
            },
            userErrors: [],
          },
          productVariantsBulkUpdate: {
            productVariants: [{ id: "gid://shopify/ProductVariant/NEW", price: "50.00" }],
            userErrors: [],
          },
        },
      }),
    }),
  } as any;
}

beforeEach(() => {
  jest.clearAllMocks();
  getDb().bundle.update.mockResolvedValue({});
});

describe("FPB handleSyncProduct", () => {
  it("returns 404 when bundle is not found in DB", async () => {
    getDb().bundle.findUnique.mockResolvedValue(null);
    const res = await handleSyncProduct(makeAdmin(), MOCK_SESSION, "bundle-1", new FormData());
    expect(res.status).toBe(404);
    const body = await res.json() as any;
    expect(body.success).toBe(false);
  });

  it("returns success when product exists in Shopify with no description change", async () => {
    getDb().bundle.findUnique.mockResolvedValue(makeBundle({ description: "A bundle" }));
    const admin = makeAdmin({ ...SHOPIFY_PRODUCT, description: "A bundle" });
    const res = await handleSyncProduct(admin, MOCK_SESSION, "bundle-1", new FormData());
    const body = await res.json() as any;
    expect(body.success).toBe(true);
    expect(body.syncedData.changesDetected).toBe(false);
  });

  it("updates DB description when Shopify product description changed", async () => {
    getDb().bundle.findUnique.mockResolvedValue(makeBundle({ description: "Old description" }));
    const admin = makeAdmin({ ...SHOPIFY_PRODUCT, description: "New description" });
    const res = await handleSyncProduct(admin, MOCK_SESSION, "bundle-1", new FormData());
    const body = await res.json() as any;
    expect(body.success).toBe(true);
    expect(body.syncedData.changesDetected).toBe(true);
    expect(getDb().bundle.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ description: "New description" }) })
    );
  });

  it("clears shopifyProductId and returns 404 when product no longer exists in Shopify", async () => {
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
        json: async () => ({ data: {}, errors: [{ message: "Unauthorized" }] }),
      }),
    } as any;
    const res = await handleSyncProduct(admin, MOCK_SESSION, "bundle-1", new FormData());
    expect(res.status).toBe(400);
    const body = await res.json() as any;
    expect(body.error).toMatch(/Unauthorized/);
  });

  it("creates a new Shopify product when bundle has no shopifyProductId", async () => {
    getDb().bundle.findUnique.mockResolvedValue(makeBundle({ shopifyProductId: null }));
    const admin = makeAdmin();
    const res = await handleSyncProduct(admin, MOCK_SESSION, "bundle-1", new FormData());
    const body = await res.json() as any;
    expect(body.success).toBe(true);
    expect(body.productId).toBe("gid://shopify/Product/NEW");
    expect(getDb().bundle.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          shopifyProductId: "gid://shopify/Product/NEW",
        }),
      })
    );
  });

  it("returns a success message after creating a new product", async () => {
    getDb().bundle.findUnique.mockResolvedValue(makeBundle({ shopifyProductId: null }));
    const admin = makeAdmin();
    const res = await handleSyncProduct(admin, MOCK_SESSION, "bundle-1", new FormData());
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.message).toMatch(/synchronized successfully/i);
  });
});
