import {
  buildThemeAppEmbedEditorUrl,
  fetchBundleProduct,
  fetchEmbedData,
} from "../../../app/lib/bundle-configure-loader.server";
import { checkAppEmbedEnabled } from "../../../app/services/theme/app-embed-check.server";

jest.mock("../../../app/lib/logger", () => ({
  AppLogger: {
    warn: jest.fn(),
  },
}));

jest.mock("../../../app/services/theme/app-embed-check.server", () => ({
  checkAppEmbedEnabled: jest.fn(),
}));

const mockShopUpdate = jest.fn().mockResolvedValue({});
const mockShopFindUnique = jest.fn();

jest.mock("../../../app/db.server", () => ({
  __esModule: true,
  default: {
    shop: {
      findUnique: (...args: unknown[]) => mockShopFindUnique(...args),
      update: (...args: unknown[]) => mockShopUpdate(...args),
    },
  },
}));

const THEME_GID = "gid://shopify/OnlineStoreTheme/123456";
const SHOP = "test.myshopify.com";
const API_KEY = "test-api-key";
const originalShopifyAppHandle = process.env.SHOPIFY_APP_HANDLE;

describe("fetchEmbedData — live Shopify app embed status", () => {
  const mockAdmin = {};

  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.SHOPIFY_APP_HANDLE;
  });

  afterEach(() => {
    if (originalShopifyAppHandle) {
      process.env.SHOPIFY_APP_HANDLE = originalShopifyAppHandle;
    } else {
      delete process.env.SHOPIFY_APP_HANDLE;
    }
  });

  it("does not read app embed cache from DB", async () => {
    mockShopFindUnique.mockRejectedValue(new Error("DB cache must not be read"));
    (checkAppEmbedEnabled as jest.Mock).mockResolvedValue({ enabled: false, themeId: THEME_GID });

    const result = await fetchEmbedData(mockAdmin, SHOP, API_KEY);

    expect(result.appEmbedEnabled).toBe(false);
    expect(result.themeEditorUrl).toContain("123456");
    expect(checkAppEmbedEnabled).toHaveBeenCalledTimes(1);
    expect(mockShopFindUnique).not.toHaveBeenCalled();
    expect(mockShopUpdate).not.toHaveBeenCalled();
  });

  it("does not persist Shopify app embed status after a live read", async () => {
    (checkAppEmbedEnabled as jest.Mock).mockResolvedValue({ enabled: true, themeId: THEME_GID });

    const result = await fetchEmbedData(mockAdmin, SHOP, API_KEY);

    expect(checkAppEmbedEnabled).toHaveBeenCalledTimes(1);
    expect(mockShopFindUnique).not.toHaveBeenCalled();
    expect(mockShopUpdate).not.toHaveBeenCalled();
    expect(result.appEmbedEnabled).toBe(true);
  });

  it("returns disabled directly from Shopify without writing cache", async () => {
    (checkAppEmbedEnabled as jest.Mock).mockResolvedValue({ enabled: false, themeId: THEME_GID });

    const result = await fetchEmbedData(mockAdmin, SHOP, API_KEY);

    expect(checkAppEmbedEnabled).toHaveBeenCalledTimes(1);
    expect(mockShopFindUnique).not.toHaveBeenCalled();
    expect(mockShopUpdate).not.toHaveBeenCalled();
    expect(result.appEmbedEnabled).toBe(false);
  });

  it("does not write cache when Shopify returns themeId:null", async () => {
    (checkAppEmbedEnabled as jest.Mock).mockResolvedValue({ enabled: false, themeId: null });

    await fetchEmbedData(mockAdmin, SHOP, API_KEY);

    expect(mockShopFindUnique).not.toHaveBeenCalled();
    expect(mockShopUpdate).not.toHaveBeenCalled();
  });

  it("builds correct theme editor URL from the live themeId", async () => {
    (checkAppEmbedEnabled as jest.Mock).mockResolvedValue({ enabled: true, themeId: THEME_GID });

    const result = await fetchEmbedData(mockAdmin, SHOP, API_KEY, "bundle-app-embed");

    expect(result.themeEditorUrl).toBe(
      `https://${SHOP}/admin/themes/123456/editor?context=apps&activateAppId=${API_KEY}%2Fbundle-app-embed`,
    );
  });

  it("passes the configured Shopify app handle to the embed checker", async () => {
    (checkAppEmbedEnabled as jest.Mock).mockResolvedValue({
      enabled: false,
      themeId: THEME_GID,
    });
    process.env.SHOPIFY_APP_HANDLE = "configured-app-handle";

    const result = await fetchEmbedData(mockAdmin, SHOP, API_KEY, "bundle-app-embed");

    expect(checkAppEmbedEnabled).toHaveBeenCalledTimes(1);
    expect(checkAppEmbedEnabled).toHaveBeenCalledWith(
      mockAdmin,
      SHOP,
      expect.objectContaining({
        appHandles: [
          "bundle-builder",
          "configured-app-handle",
          "wolfpack-product-bundles-4",
          "wolfpack-product-bundles-sit",
        ],
        blockHandles: ["bundle-app-embed"],
      }),
    );
    expect(checkAppEmbedEnabled).toHaveBeenCalledWith(
      mockAdmin,
      SHOP,
      expect.any(Object),
    );
    expect((checkAppEmbedEnabled as jest.Mock).mock.calls[0][2]).not.toHaveProperty(
      "appHandle",
    );
    expect(mockShopFindUnique).not.toHaveBeenCalled();
    expect(mockShopUpdate).not.toHaveBeenCalled();
    expect(result.appEmbedEnabled).toBe(false);
  });

  it("includes stable deployed app handles when no Shopify app handle is configured", async () => {
    (checkAppEmbedEnabled as jest.Mock).mockResolvedValue({
      enabled: true,
      themeId: THEME_GID,
    });

    await fetchEmbedData(mockAdmin, SHOP, API_KEY, "bundle-app-embed");

    expect(checkAppEmbedEnabled).toHaveBeenCalledWith(
      mockAdmin,
      SHOP,
      expect.objectContaining({
        appHandles: [
          "bundle-builder",
          "wolfpack-product-bundles-4",
          "wolfpack-product-bundles-sit",
        ],
        blockHandles: ["bundle-app-embed"],
      }),
    );
  });

  it("deduplicates configured app handles against imported deployed handles", async () => {
    (checkAppEmbedEnabled as jest.Mock).mockResolvedValue({
      enabled: true,
      themeId: THEME_GID,
    });
    process.env.SHOPIFY_APP_HANDLE = "wolfpack-product-bundles-4";

    await fetchEmbedData(mockAdmin, SHOP, API_KEY, "bundle-app-embed");

    expect(checkAppEmbedEnabled).toHaveBeenCalledWith(
      mockAdmin,
      SHOP,
      expect.objectContaining({
        appHandles: [
          "bundle-builder",
          "wolfpack-product-bundles-4",
          "wolfpack-product-bundles-sit",
        ],
        blockHandles: ["bundle-app-embed"],
      }),
    );
  });
});

describe("buildThemeAppEmbedEditorUrl", () => {
  it("uses Shopify's activateAppId deep link parameter", () => {
    expect(buildThemeAppEmbedEditorUrl(SHOP, THEME_GID, API_KEY, "bundle-app-embed")).toBe(
      `https://${SHOP}/admin/themes/123456/editor?context=apps&activateAppId=${API_KEY}%2Fbundle-app-embed`,
    );
  });
});

describe("fetchBundleProduct", () => {
  it("queries current Shopify product media for the Admin bundle product card", async () => {
    const admin = {
      graphql: jest.fn().mockResolvedValue({
        json: async () => ({
          data: {
            product: {
              id: "gid://shopify/Product/1",
              title: "Product Page Fixture",
              featuredMedia: {
                image: { url: "https://cdn.shopify.com/placeholder.png" },
              },
            },
          },
        }),
      }),
    };

    const product = await fetchBundleProduct(admin, "gid://shopify/Product/1", "bundle-1");

    expect(product.title).toBe("Product Page Fixture");
    expect(admin.graphql).toHaveBeenCalledWith(
      expect.stringContaining("featuredMedia"),
      expect.any(Object),
    );
    expect(admin.graphql).toHaveBeenCalledWith(
      expect.stringContaining("media(first: 5)"),
      expect.any(Object),
    );
  });
});
