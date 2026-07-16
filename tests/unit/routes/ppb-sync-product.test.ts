import {
  handleSyncBundle,
  handleSyncProduct,
} from "../../../app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/handlers/handlers.server";
import { ensureBundleParentProduct } from "../../../app/services/bundles/bundle-parent-product.server";
import {
  updateBundleProductMetafields,
  updateComponentProductMetafields,
} from "../../../app/services/bundles/metafield-sync.server";

jest.mock("../../../app/db.server", () => ({
  __esModule: true,
  default: { bundle: { findUnique: jest.fn(), update: jest.fn() } },
}));
jest.mock("../../../app/lib/logger", () => ({
  AppLogger: { info: jest.fn(), debug: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));
jest.mock("../../../app/services/bundles/bundle-parent-product.server", () => ({
  ensureBundleParentProduct: jest.fn(),
}));
jest.mock("../../../app/services/bundles/metafield-sync.server", () => ({
  updateBundleProductMetafields: jest.fn(),
  updateComponentProductMetafields: jest.fn(),
}));
jest.mock("../../../app/services/bundles/standard-metafields.server", () => ({
  convertBundleToStandardMetafields: jest.fn().mockResolvedValue({ metafields: {}, errors: [] }),
  updateProductStandardMetafields: jest.fn(),
}));
jest.mock("../../../app/services/theme-colors.server", () => ({
  syncThemeColors: jest.fn().mockResolvedValue(undefined),
}));
jest.mock("../../../app/services/app-events.server", () => ({
  ensureShopIdentity: jest.fn().mockResolvedValue("gid://shopify/Shop/1"),
  recordBusinessEvent: jest.fn(),
}));
jest.mock("../../../app/services/theme-template.server", () => ({
  ThemeTemplateService: { ensureTemplates: jest.fn() },
}));

const getDb = () => require("../../../app/db.server").default;
const mockEnsure = ensureBundleParentProduct as jest.MockedFunction<typeof ensureBundleParentProduct>;
const mockUpdateParent = updateBundleProductMetafields as jest.Mock;
const mockUpdateComponents = updateComponentProductMetafields as jest.Mock;
const session = { shop: "test-shop.myshopify.com" } as any;

function makeBundle(overrides: Record<string, unknown> = {}) {
  return {
    id: "bundle-1",
    name: "PPB Bundle",
    description: "Bundle description",
    status: "active",
    bundleType: "product_page",
    shopifyProductId: "gid://shopify/Product/1",
    shopifyProductHandle: "old-handle",
    steps: [
      {
        id: "step-1",
        name: "Step 1",
        position: 0,
        StepProduct: [],
        StepCategory: [
          {
            categoryId: "category-1",
            name: "Category 1",
            products: [{ id: "gid://shopify/Product/3", variants: [{ id: "gid://shopify/ProductVariant/3" }] }],
            collections: [],
          },
        ],
      },
    ],
    pricing: null,
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  getDb().bundle.findUnique.mockResolvedValue(makeBundle());
  mockEnsure.mockResolvedValue({
    productId: "gid://shopify/Product/1",
    variantId: "gid://shopify/ProductVariant/1",
    handle: "merchant-handle",
    status: "ACTIVE",
    created: false,
  });
  mockUpdateParent.mockResolvedValue(undefined);
  mockUpdateComponents.mockResolvedValue(undefined);
});

describe("PPB parent-product sync", () => {
  it("returns 404 when the bundle is missing", async () => {
    getDb().bundle.findUnique.mockResolvedValue(null);
    const response = await handleSyncProduct({} as any, session, "bundle-1", new FormData());
    expect(response.status).toBe(404);
  });

  it("uses the shared parent and preserves category runtime data", async () => {
    const admin = {} as any;
    const response = await handleSyncProduct(admin, session, "bundle-1", new FormData());
    const body = await response.json() as any;

    expect(body).toMatchObject({
      success: true,
      statusCode: 200,
      productId: "gid://shopify/Product/1",
      productHandle: "merchant-handle",
    });
    expect(mockEnsure).toHaveBeenCalledWith(expect.objectContaining({
      shopDomain: session.shop,
      bundle: expect.objectContaining({ id: "bundle-1" }),
    }));
    const runtimeConfig = mockUpdateParent.mock.calls[0][2];
    expect(runtimeConfig.steps[0].StepCategory[0].products[0]).toEqual(
      expect.objectContaining({ id: "gid://shopify/Product/3" }),
    );
  });

  it("sync bundle reuses the parent instead of archiving or deleting it", async () => {
    const admin = { graphql: jest.fn() } as any;
    const response = await handleSyncBundle(admin, session, "bundle-1");
    const body = await response.json() as any;

    expect(body.success).toBe(true);
    expect(mockEnsure).toHaveBeenCalledTimes(1);
    expect(admin.graphql).not.toHaveBeenCalled();
    expect(mockUpdateParent).toHaveBeenCalledWith(
      admin,
      "gid://shopify/Product/1",
      expect.objectContaining({ shopifyProductId: "gid://shopify/Product/1" }),
    );
  });

  it("recreates a deleted parent in the same sync operation", async () => {
    mockEnsure.mockResolvedValue({
      productId: "gid://shopify/Product/2",
      variantId: "gid://shopify/ProductVariant/2",
      handle: "replacement-handle",
      status: "UNLISTED",
      created: true,
    });

    const response = await handleSyncProduct({} as any, session, "bundle-1", new FormData());
    const body = await response.json() as any;
    expect(body).toMatchObject({
      success: true,
      productId: "gid://shopify/Product/2",
      productHandle: "replacement-handle",
    });
  });
});
