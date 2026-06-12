/**
 * Unit tests for the UnlistedBundleBanner helper.
 *
 * Issue: feedback-jun26-6
 * Spec : test-spec/unlisted-bundle-banner.spec.md
 *
 */
import { buildShopifyProductAdminUrl } from "../../../app/components/UnlistedBundleBanner";

describe("buildShopifyProductAdminUrl", () => {
  it("converts a full GID and .myshopify shop into an admin product URL", () => {
    expect(buildShopifyProductAdminUrl("s.myshopify.com", "gid://shopify/Product/12345"))
      .toBe("https://admin.shopify.com/store/s/products/12345");
  });

  it("accepts a bare numeric id", () => {
    expect(buildShopifyProductAdminUrl("s.myshopify.com", "12345"))
      .toBe("https://admin.shopify.com/store/s/products/12345");
  });

  it("keeps the shop slug intact when the .myshopify suffix is absent", () => {
    expect(buildShopifyProductAdminUrl("my-store", "gid://shopify/Product/12345"))
      .toBe("https://admin.shopify.com/store/my-store/products/12345");
  });

  it("returns null for null productId", () => {
    expect(buildShopifyProductAdminUrl("s.myshopify.com", null)).toBeNull();
  });

  it("returns null for empty productId", () => {
    expect(buildShopifyProductAdminUrl("s.myshopify.com", "")).toBeNull();
  });
});
