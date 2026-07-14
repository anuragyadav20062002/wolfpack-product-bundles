import {
  appendFpbPreviewToken,
  buildFpbStorefrontUrl,
} from "../../../app/lib/fpb-storefront-url";

describe("FPB storefront URL", () => {
  it("builds the canonical default app-proxy URL", () => {
    expect(buildFpbStorefrontUrl("https://test-shop.myshopify.com/", "bundle/1"))
      .toBe("https://test-shop.myshopify.com/apps/product-bundles/wpb/bundle%2F1");
  });

  it("adds a draft preview token", () => {
    expect(appendFpbPreviewToken(
      buildFpbStorefrontUrl("test-shop.myshopify.com", "bundle-1"),
      "preview-token",
    )).toBe("https://test-shop.myshopify.com/apps/product-bundles/wpb/bundle-1?wpb_preview=preview-token");
  });
});
