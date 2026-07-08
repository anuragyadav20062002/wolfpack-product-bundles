import { runBundleStorefrontSync } from "../../../app/services/bundles/storefront-sync.server";
import db from "../../../app/db.server";
import { CartTransformService } from "../../../app/services/cart-transform-service.server";
import {
  updateBundleProductMetafields,
  updateComponentProductMetafields,
} from "../../../app/services/bundles/metafield-sync.server";

jest.mock("../../../app/db.server", () => ({
  bundle: {
    findUnique: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
  },
}));

jest.mock("../../../app/inngest/client", () => ({
  inngest: { send: jest.fn() },
}));

jest.mock("../../../app/lib/logger", () => ({
  AppLogger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock("../../../app/shopify.server", () => ({
  unauthenticated: {
    admin: jest.fn().mockResolvedValue({ admin: { graphql: jest.fn() } }),
  },
}));

jest.mock("../../../app/services/cart-transform-service.server", () => ({
  CartTransformService: {
    completeSetup: jest.fn(),
  },
}));

jest.mock("../../../app/services/bundles/metafield-sync.server", () => ({
  updateBundleProductMetafields: jest.fn(),
  updateComponentProductMetafields: jest.fn(),
}));

jest.mock("../../../app/services/bundles/standard-metafields.server", () => ({
  convertBundleToStandardMetafields: jest.fn().mockResolvedValue({ metafields: {}, errors: [] }),
  updateProductStandardMetafields: jest.fn(),
}));

jest.mock("../../../app/services/widget-installation/widget-full-page-bundle.server", () => ({
  refreshFullPageBundlePageBody: jest.fn(),
  writeBundleConfigPageMetafield: jest.fn(),
}));

jest.mock("../../../app/services/theme-colors.server", () => ({
  syncThemeColors: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("../../../app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/handlers/product-status.server", () => ({
  syncFpbProductStatus: jest.fn(),
}));

jest.mock("../../../app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/handlers/shared.server", () => ({
  buildFullPageBundleMetafieldConfig: jest.fn(),
}));

jest.mock("../../../app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/handlers/runtime-config.server", () => ({
  buildSyncBundleConfiguration: jest.fn().mockReturnValue({
    steps: [],
    pricing: null,
  }),
}));

jest.mock("../../../app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/handlers/product-sync.server", () => ({
  syncBundleProductToShopify: jest.fn().mockResolvedValue({ handle: "bundle-handle" }),
}));

const mockDb = db as any;
const mockCompleteSetup = CartTransformService.completeSetup as jest.Mock;
const mockUpdateBundleProductMetafields = updateBundleProductMetafields as jest.Mock;
const mockUpdateComponentProductMetafields = updateComponentProductMetafields as jest.Mock;

describe("storefront sync runtime token contract", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDb.bundle.updateMany.mockResolvedValue({ count: 1 });
    mockDb.bundle.findUnique.mockResolvedValue({
      id: "bundle-1",
      shopId: "test-shop.myshopify.com",
      bundleType: "product_page",
      shopifyProductId: "gid://shopify/Product/PARENT",
      shopifyProductHandle: "bundle-handle",
      status: "active",
      name: "Runtime Bundle",
      description: "",
      steps: [],
      pricing: null,
    });
    mockCompleteSetup.mockResolvedValue({
      success: true,
      cartTransformId: "gid://shopify/CartTransform/1",
    });
    mockUpdateBundleProductMetafields.mockResolvedValue(undefined);
    mockUpdateComponentProductMetafields.mockResolvedValue(undefined);
  });

  it("does not write component_parents from async storefront sync", async () => {
    await runBundleStorefrontSync({
      shopDomain: "test-shop.myshopify.com",
      bundleId: "bundle-1",
      bundleType: "product_page",
      reason: "save",
      attemptId: "attempt-1",
    });

    expect(mockUpdateBundleProductMetafields).toHaveBeenCalled();
    expect(mockUpdateComponentProductMetafields).not.toHaveBeenCalled();
  });
});
