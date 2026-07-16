import { handleSyncProduct } from "../../../app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/handlers/handlers.server";
import { ensureBundleParentProduct } from "../../../app/services/bundles/bundle-parent-product.server";
import { updateBundleProductMetafields } from "../../../app/services/bundles/metafield-sync.server";

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
jest.mock("../../../app/services/theme-template.server", () => ({
  ThemeTemplateService: { ensureTemplates: jest.fn() },
}));

const getDb = () => require("../../../app/db.server").default;
const mockEnsure = ensureBundleParentProduct as jest.MockedFunction<typeof ensureBundleParentProduct>;
const mockUpdateMetafields = updateBundleProductMetafields as jest.Mock;
const session = { shop: "test-shop.myshopify.com" } as any;

function makeBundle(overrides: Record<string, unknown> = {}) {
  return {
    id: "bundle-1",
    name: "FPB Bundle",
    description: "Bundle description",
    status: "active",
    bundleType: "full_page",
    shopifyProductId: "gid://shopify/Product/1",
    shopifyProductHandle: "old-handle",
    shopifyPageHandle: "build-a-box",
    steps: [],
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
  mockUpdateMetafields.mockResolvedValue(undefined);
});

describe("FPB handleSyncProduct", () => {
  it("returns 404 when the bundle is missing", async () => {
    getDb().bundle.findUnique.mockResolvedValue(null);
    const response = await handleSyncProduct({} as any, session, "bundle-1", new FormData());
    expect(response.status).toBe(404);
  });

  it("ensures the shared parent contract before rewriting parent metafields", async () => {
    const admin = {} as any;
    const response = await handleSyncProduct(admin, session, "bundle-1", new FormData());
    const body = await response.json() as any;

    expect(body).toMatchObject({
      success: true,
      statusCode: 200,
      productId: "gid://shopify/Product/1",
      productHandle: "merchant-handle",
      message: "Updated Successfully!",
    });
    expect(mockEnsure).toHaveBeenCalledWith(expect.objectContaining({
      admin,
      shopDomain: session.shop,
      bundle: expect.objectContaining({ id: "bundle-1" }),
    }));
    expect(mockUpdateMetafields).toHaveBeenCalledWith(
      admin,
      "gid://shopify/Product/1",
      expect.objectContaining({
        shopifyProductId: "gid://shopify/Product/1",
        shopifyPageHandle: "build-a-box",
      }),
    );
  });

  it("recreates a deleted parent through the shared service without a separate 404", async () => {
    getDb().bundle.findUnique.mockResolvedValue(makeBundle({ shopifyProductId: "gid://shopify/Product/deleted" }));
    mockEnsure.mockResolvedValue({
      productId: "gid://shopify/Product/2",
      variantId: "gid://shopify/ProductVariant/2",
      handle: "replacement-handle",
      status: "UNLISTED",
      created: true,
    });

    const response = await handleSyncProduct({} as any, session, "bundle-1", new FormData());
    const body = await response.json() as any;

    expect(body.success).toBe(true);
    expect(body.productId).toBe("gid://shopify/Product/2");
    expect(body.productHandle).toBe("replacement-handle");
  });
});
