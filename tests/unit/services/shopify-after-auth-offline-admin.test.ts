const mockOfflineAdmin = { graphql: jest.fn() };
const mockHookAdmin = { graphql: jest.fn() };
const mockUnauthenticatedAdmin = jest.fn().mockResolvedValue({ admin: mockOfflineAdmin });
const mockEnsureShopHasExpiringOfflineSession = jest.fn().mockResolvedValue({
  accessToken: "shpat_expiring",
  refreshToken: "shprt_refresh",
});
const mockActivateUtmPixel = jest.fn().mockResolvedValue({ success: true });
const mockCartTransformCompleteSetup = jest.fn().mockResolvedValue({
  success: true,
  alreadyExists: true,
  cartTransformId: "gid://shopify/CartTransform/1",
});
let capturedShopifyConfig: any;

jest.mock("@shopify/shopify-app-remix/server", () => ({
  ApiVersion: { October25: "2025-10" },
  AppDistribution: { AppStore: "app_store" },
  LATEST_API_VERSION: "2025-10",
  shopifyApp: jest.fn((config) => {
    capturedShopifyConfig = config;
    return {
      addDocumentResponseHeaders: jest.fn(),
      authenticate: {},
      login: jest.fn(),
      unauthenticated: {
        admin: mockUnauthenticatedAdmin,
      },
    };
  }),
}));

jest.mock("../../../app/lib/cached-session-storage.server", () => ({
  CachedSessionStorage: jest.fn().mockImplementation(() => ({
    storeSession: jest.fn(),
  })),
}));

jest.mock("../../../app/db.server", () => ({
  __esModule: true,
  default: {
    shop: {
      findUnique: jest.fn().mockResolvedValue({
        id: "shop-row",
        shopifyShopGid: "gid://shopify/Shop/1",
      }),
    },
  },
}));

jest.mock("../../../app/services/offline-token.server", () => ({
  ensureShopHasExpiringOfflineSession: mockEnsureShopHasExpiringOfflineSession,
}));

jest.mock("../../../app/services/bundles/metafield-sync.server", () => ({
  ensureVariantBundleMetafieldDefinitions: jest.fn(),
}));

jest.mock("../../../app/services/billing.server", () => ({
  BillingService: { ensureShop: jest.fn() },
}));

jest.mock("../../../app/services/app-events.server", () => ({
  ensureShopIdentity: jest.fn().mockResolvedValue("gid://shopify/Shop/1"),
  recordBusinessEvent: jest.fn(),
}));

jest.mock("../../../app/services/storefront-token.server", () => ({
  createStorefrontAccessToken: jest.fn(),
}));

jest.mock("../../../app/services/theme-colors.server", () => ({
  syncThemeColors: jest.fn(),
}));

jest.mock("../../../app/services/pixel-activation.server", () => ({
  activateUtmPixel: mockActivateUtmPixel,
}));

jest.mock("../../../app/services/cart-transform-service.server", () => ({
  CartTransformService: {
    completeSetup: mockCartTransformCompleteSetup,
  },
}));

jest.mock("../../../app/services/addon-discount-function-service.server", () => ({
  AddOnDiscountFunctionService: {
    completeSetup: jest.fn().mockResolvedValue({
      success: true,
      alreadyExists: true,
      discountId: "gid://shopify/DiscountAutomaticApp/1",
      functionId: "gid://shopify/ShopifyFunction/1",
    }),
  },
}));

jest.mock("../../../app/lib/logger", () => ({
  AppLogger: {
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  },
}));

describe("shopify afterAuth offline Admin setup", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.SHOPIFY_APP_URL = "https://app.example.com";
  });

  it("ensures the expiring offline session before setup GraphQL work and uses the hydrated offline Admin client", async () => {
    jest.isolateModules(() => {
      require("../../../app/shopify.server");
    });

    await capturedShopifyConfig.hooks.afterAuth({
      session: {
        shop: "test-shop.myshopify.com",
        accessToken: undefined,
      },
      admin: mockHookAdmin,
    });

    expect(mockEnsureShopHasExpiringOfflineSession).toHaveBeenCalledWith(
      expect.any(Object),
      "test-shop.myshopify.com",
      expect.any(Object),
    );
    expect(mockUnauthenticatedAdmin).toHaveBeenCalledWith("test-shop.myshopify.com");
    expect(mockActivateUtmPixel).toHaveBeenCalledWith(
      mockOfflineAdmin,
      "https://app.example.com",
      "test-shop.myshopify.com",
      [],
    );
    expect(mockCartTransformCompleteSetup).toHaveBeenCalledWith(
      mockOfflineAdmin,
      "test-shop.myshopify.com",
    );
    expect(mockEnsureShopHasExpiringOfflineSession.mock.invocationCallOrder[0]).toBeLessThan(
      mockActivateUtmPixel.mock.invocationCallOrder[0],
    );
  });
});
