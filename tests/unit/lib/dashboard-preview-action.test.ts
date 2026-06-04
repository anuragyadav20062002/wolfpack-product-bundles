/**
 * Unit tests for decideDashboardPreviewAction.
 *
 * Issue: feedback-jun26-5
 * Spec : test-spec/dashboard-preview-action.spec.md
 */
import { decideDashboardPreviewAction } from "../../../app/lib/dashboard-preview-action";

describe("decideDashboardPreviewAction", () => {
  it("returns Shopify page URL for FPB with a linked Shopify Page", () => {
    const result = decideDashboardPreviewAction({
      bundleType: "full_page",
      bundleId: "abc",
      shopifyProductHandle: null,
      shopifyPageHandle: "build-your-box",
      shop: "s.myshopify.com",
    });
    expect(result).toEqual({
      kind: "open_url",
      url: "https://s.myshopify.com/pages/build-your-box",
    });
  });

  it("returns create_preview_page for FPB without a Shopify Page", () => {
    const result = decideDashboardPreviewAction({
      bundleType: "full_page",
      bundleId: "abc",
      shopifyProductHandle: null,
      shopifyPageHandle: null,
      shop: "s.myshopify.com",
    });
    expect(result).toEqual({
      kind: "create_preview_page",
    });
  });

  it("returns open_url for PPB with a product handle", () => {
    const result = decideDashboardPreviewAction({
      bundleType: "product_page",
      bundleId: "abc",
      shopifyProductHandle: "summer-bundle",
      shopifyPageHandle: null,
      shop: "s.myshopify.com",
    });
    expect(result).toEqual({
      kind: "open_url",
      url: "https://s.myshopify.com/products/summer-bundle",
    });
  });

  it("returns error toast for PPB without a product handle", () => {
    const result = decideDashboardPreviewAction({
      bundleType: "product_page",
      bundleId: "abc",
      shopifyProductHandle: null,
      shopifyPageHandle: null,
      shop: "s.myshopify.com",
    });
    expect(result).toEqual({
      kind: "error",
      toast: "Save and place the bundle on a product first to preview it.",
    });
  });

  it("strips an accidental https:// prefix from shop", () => {
    const result = decideDashboardPreviewAction({
      bundleType: "full_page",
      bundleId: "abc",
      shopifyProductHandle: null,
      shopifyPageHandle: "x",
      shop: "https://s.myshopify.com",
    });
    expect(result).toEqual({
      kind: "open_url",
      url: "https://s.myshopify.com/pages/x",
    });
  });

  describe("live URL preference when embed enabled", () => {
    const baseFpb = {
      bundleType: "full_page" as const,
      bundleId: "abc",
      shopifyProductHandle: null,
      shopifyPageHandle: "build-your-box",
      shop: "s.myshopify.com",
    };

    it("prefers the Shopify Page URL for FPB when embed enabled + status active + pageHandle set", () => {
      expect(decideDashboardPreviewAction({
        ...baseFpb,
        appEmbedEnabled: true,
        bundleStatus: "active",
      })).toEqual({ kind: "open_url", url: "https://s.myshopify.com/pages/build-your-box" });
    });

    it("prefers the Shopify Page URL for FPB when status is unlisted", () => {
      expect(decideDashboardPreviewAction({
        ...baseFpb,
        appEmbedEnabled: true,
        bundleStatus: "unlisted",
      })).toEqual({ kind: "open_url", url: "https://s.myshopify.com/pages/build-your-box" });
    });

    it("keeps the Shopify Page URL for FPB when status is draft", () => {
      expect(decideDashboardPreviewAction({
        ...baseFpb,
        appEmbedEnabled: true,
        bundleStatus: "draft",
      })).toEqual({ kind: "open_url", url: "https://s.myshopify.com/pages/build-your-box" });
    });

    it("keeps the Shopify Page URL for FPB when embed is disabled", () => {
      expect(decideDashboardPreviewAction({
        ...baseFpb,
        appEmbedEnabled: false,
        bundleStatus: "active",
      })).toEqual({ kind: "open_url", url: "https://s.myshopify.com/pages/build-your-box" });
    });

    it("requests preview page creation when embed enabled + active but no pageHandle", () => {
      expect(decideDashboardPreviewAction({
        ...baseFpb,
        shopifyPageHandle: null,
        appEmbedEnabled: true,
        bundleStatus: "active",
      })).toEqual({ kind: "create_preview_page" });
    });

    it("PPB is unaffected by the live URL preference branch", () => {
      expect(decideDashboardPreviewAction({
        bundleType: "product_page",
        bundleId: "abc",
        shopifyProductHandle: "summer-bundle",
        shopifyPageHandle: null,
        shop: "s.myshopify.com",
        appEmbedEnabled: true,
        bundleStatus: "active",
      })).toEqual({ kind: "open_url", url: "https://s.myshopify.com/products/summer-bundle" });
    });
  });
});
