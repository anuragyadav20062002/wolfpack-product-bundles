import { fetchBundleProduct, fetchEmbedData } from "../../../app/lib/bundle-configure-loader.server";
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
const API_KEY = "abc123";

describe("fetchEmbedData — DB cache", () => {
  const mockAdmin = {};

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns cached value and skips Shopify API when cache is fresh", async () => {
    mockShopFindUnique.mockResolvedValue({
      appEmbedEnabled: true,
      appEmbedCheckedAt: new Date(), // just now = fresh
      appEmbedThemeId: THEME_GID,
    });

    const result = await fetchEmbedData(mockAdmin, SHOP, API_KEY);

    expect(result.appEmbedEnabled).toBe(true);
    expect(result.themeEditorUrl).toContain("123456");
    expect(checkAppEmbedEnabled).not.toHaveBeenCalled();
    expect(mockShopUpdate).not.toHaveBeenCalled();
  });

  it("calls Shopify API and updates cache when cache is stale", async () => {
    const staleDate = new Date(Date.now() - 10 * 60 * 1000); // 10 min ago
    mockShopFindUnique.mockResolvedValue({
      appEmbedEnabled: true,
      appEmbedCheckedAt: staleDate,
      appEmbedThemeId: THEME_GID,
    });
    (checkAppEmbedEnabled as jest.Mock).mockResolvedValue({ enabled: true, themeId: THEME_GID });

    const result = await fetchEmbedData(mockAdmin, SHOP, API_KEY);

    expect(checkAppEmbedEnabled).toHaveBeenCalledTimes(1);
    expect(mockShopUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ appEmbedEnabled: true }) }),
    );
    expect(result.appEmbedEnabled).toBe(true);
  });

  it("calls Shopify API and updates cache when no cache exists", async () => {
    mockShopFindUnique.mockResolvedValue(null);
    (checkAppEmbedEnabled as jest.Mock).mockResolvedValue({ enabled: false, themeId: THEME_GID });

    const result = await fetchEmbedData(mockAdmin, SHOP, API_KEY);

    expect(checkAppEmbedEnabled).toHaveBeenCalledTimes(1);
    expect(mockShopUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ appEmbedEnabled: false }) }),
    );
    expect(result.appEmbedEnabled).toBe(false);
  });

  it("does not poison cache when Shopify returns themeId:null (network/error result)", async () => {
    mockShopFindUnique.mockResolvedValue(null);
    (checkAppEmbedEnabled as jest.Mock).mockResolvedValue({ enabled: false, themeId: null });

    await fetchEmbedData(mockAdmin, SHOP, API_KEY);

    expect(mockShopUpdate).not.toHaveBeenCalled();
  });

  it("builds correct theme editor URL from cached themeId", async () => {
    mockShopFindUnique.mockResolvedValue({
      appEmbedEnabled: true,
      appEmbedCheckedAt: new Date(),
      appEmbedThemeId: THEME_GID,
    });

    const result = await fetchEmbedData(mockAdmin, SHOP, API_KEY, "bundle-app-embed");

    expect(result.themeEditorUrl).toBe(
      `https://${SHOP}/admin/themes/123456/editor?context=apps&appEmbed=${API_KEY}%2Fbundle-app-embed`,
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
