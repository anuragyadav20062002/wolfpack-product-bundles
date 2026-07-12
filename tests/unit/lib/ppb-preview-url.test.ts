/**
 * Unit tests for pickPpbPreviewUrl.
 *
 * Issue: feedback-jun26-9
 */
import { pickPpbPreviewUrl } from "../../../app/lib/ppb-preview-url";

const baseProduct = {
  id: "gid://shopify/Product/12345",
  handle: "summer-bundle",
  onlineStorePreviewUrl: "https://s.myshopify.com/products/summer-bundle?preview_theme_id=xyz&_token=abc",
  onlineStoreUrl: "https://s.myshopify.com/products/summer-bundle",
};

describe("pickPpbPreviewUrl", () => {
  it("prefers the live onlineStoreUrl when embed enabled + active", () => {
    expect(pickPpbPreviewUrl({
      appEmbedEnabled: true,
      bundleStatus: "active",
      productHandle: "summer-bundle",
      bundleProduct: baseProduct,
      shop: "s.myshopify.com",
    })).toBe("https://s.myshopify.com/products/summer-bundle");
  });

  it("prefers the live URL when embed enabled + unlisted", () => {
    expect(pickPpbPreviewUrl({
      appEmbedEnabled: true,
      bundleStatus: "unlisted",
      productHandle: "summer-bundle",
      bundleProduct: { ...baseProduct, onlineStoreUrl: null },
      shop: "s.myshopify.com",
    })).toBe("https://s.myshopify.com/products/summer-bundle");
  });

  it("falls back to onlineStorePreviewUrl when embed disabled", () => {
    expect(pickPpbPreviewUrl({
      appEmbedEnabled: false,
      bundleStatus: "active",
      productHandle: "summer-bundle",
      bundleProduct: baseProduct,
      shop: "s.myshopify.com",
    })).toBe(baseProduct.onlineStorePreviewUrl);
  });

  it("falls back to onlineStorePreviewUrl when status is draft", () => {
    expect(pickPpbPreviewUrl({
      appEmbedEnabled: true,
      bundleStatus: "draft",
      productHandle: "summer-bundle",
      bundleProduct: baseProduct,
      shop: "s.myshopify.com",
    })).toBe(baseProduct.onlineStorePreviewUrl);
  });

  it("falls back to onlineStorePreviewUrl when status is untracked", () => {
    expect(pickPpbPreviewUrl({
      appEmbedEnabled: true,
      bundleStatus: "untracked",
      productHandle: "summer-bundle",
      bundleProduct: baseProduct,
      shop: "s.myshopify.com",
    })).toBe(baseProduct.onlineStorePreviewUrl);
  });

  it("constructs a handle-based URL when no onlineStore URLs but live eligible", () => {
    expect(pickPpbPreviewUrl({
      appEmbedEnabled: true,
      bundleStatus: "active",
      productHandle: "summer-bundle",
      bundleProduct: { ...baseProduct, onlineStoreUrl: null, onlineStorePreviewUrl: null },
      shop: "s.myshopify.com",
    })).toBe("https://s.myshopify.com/products/summer-bundle");
  });

  it("constructs a handle-based URL for untracked status when Shopify preview URLs are absent", () => {
    expect(pickPpbPreviewUrl({
      appEmbedEnabled: true,
      bundleStatus: "untracked",
      productHandle: "summer-bundle",
      bundleProduct: { ...baseProduct, onlineStoreUrl: null, onlineStorePreviewUrl: null },
      shop: "s.myshopify.com",
    })).toBe("https://s.myshopify.com/products/summer-bundle");
  });

  it("returns null when nothing is constructible", () => {
    expect(pickPpbPreviewUrl({
      appEmbedEnabled: true,
      bundleStatus: "active",
      productHandle: null,
      bundleProduct: { id: "gid://shopify/Product/12345" },
      shop: "s.myshopify.com",
    })).toBeNull();
  });

  it("strips an accidental https:// prefix from shop", () => {
    expect(pickPpbPreviewUrl({
      appEmbedEnabled: true,
      bundleStatus: "active",
      productHandle: "summer-bundle",
      bundleProduct: { ...baseProduct, onlineStoreUrl: null },
      shop: "https://s.myshopify.com",
    })).toBe("https://s.myshopify.com/products/summer-bundle");
  });
});
