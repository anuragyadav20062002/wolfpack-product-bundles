import { fetchBundleProduct } from "../../../app/lib/bundle-configure-loader.server";

jest.mock("../../../app/lib/logger", () => ({
  AppLogger: {
    warn: jest.fn(),
  },
}));

jest.mock("../../../app/services/theme/app-embed-check.server", () => ({
  checkAppEmbedEnabled: jest.fn(),
}));

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
