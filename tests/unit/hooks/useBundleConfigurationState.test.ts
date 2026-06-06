import { getBundleProductImageUrl } from "../../../app/hooks/useBundleConfigurationState";

describe("getBundleProductImageUrl", () => {
  it("reads the current Shopify featuredMedia image URL", () => {
    expect(
      getBundleProductImageUrl({
        featuredMedia: {
          image: { url: "https://cdn.shopify.com/featured-media.png" },
        },
      }),
    ).toBe("https://cdn.shopify.com/featured-media.png");
  });

  it("falls back to the first media image node", () => {
    expect(
      getBundleProductImageUrl({
        media: {
          nodes: [
            null,
            { image: { url: "https://cdn.shopify.com/media-node.png" } },
          ],
        },
      }),
    ).toBe("https://cdn.shopify.com/media-node.png");
  });
});
