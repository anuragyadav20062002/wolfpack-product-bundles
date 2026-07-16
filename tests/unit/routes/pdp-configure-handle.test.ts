import { handleSyncProduct } from "../../../app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/handlers/handlers.server";
import { ensureBundleParentProduct } from "../../../app/services/bundles/bundle-parent-product.server";

jest.mock("../../../app/db.server", () => ({
  __esModule: true,
  default: { bundle: { findUnique: jest.fn(), update: jest.fn() } },
}));
jest.mock("../../../app/lib/logger", () => ({
  AppLogger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
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
const session = { shop: "test-shop.myshopify.com" } as any;

beforeEach(() => {
  jest.clearAllMocks();
  getDb().bundle.findUnique.mockResolvedValue({
    id: "bundle-1",
    name: "Hello",
    description: "Test bundle",
    status: "active",
    bundleType: "product_page",
    shopifyProductId: "gid://shopify/Product/1",
    shopifyProductHandle: "stale-handle",
    steps: [],
    pricing: null,
  });
  mockEnsure.mockResolvedValue({
    productId: "gid://shopify/Product/1",
    variantId: "gid://shopify/ProductVariant/1",
    handle: "merchant-edited-handle",
    status: "ACTIVE",
    created: false,
  });
});

describe("PPB configure handle contract", () => {
  it("returns the actual Shopify handle supplied by the shared service", async () => {
    const response = await handleSyncProduct({} as any, session, "bundle-1", new FormData());
    const body = await response.json() as any;

    expect(body).toMatchObject({
      success: true,
      productHandle: "merchant-edited-handle",
    });
    expect(body.productHandle).not.toBe("stale-handle");
  });

  it("returns 404 when the bundle is missing", async () => {
    getDb().bundle.findUnique.mockResolvedValue(null);
    const response = await handleSyncProduct({} as any, session, "missing", new FormData());
    expect(response.status).toBe(404);
  });
});
