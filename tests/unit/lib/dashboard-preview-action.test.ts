/**
 * Unit tests for decideDashboardPreviewAction.
 *
 * Issue: feedback-jun26-5
 * Spec : test-spec/dashboard-preview-action.spec.md
 */
import { decideDashboardPreviewAction } from "../../../app/lib/dashboard-preview-action";

describe("decideDashboardPreviewAction", () => {
  it("requests a fresh signed preview URL for a public FPB", () => {
    const result = decideDashboardPreviewAction({
      bundleType: "full_page",
      bundleId: "abc",
      shopifyProductHandle: null,
      shop: "s.myshopify.com",
    });
    expect(result).toEqual({ kind: "create_fpb_preview" });
  });

  it("does not require a Shopify Page handle to request an FPB preview", () => {
    const result = decideDashboardPreviewAction({
      bundleType: "full_page",
      bundleId: "abc",
      shopifyProductHandle: null,
      shop: "s.myshopify.com",
    });
    expect(result).toEqual({ kind: "create_fpb_preview" });
  });

  it("returns open_url for PPB with a product handle", () => {
    const result = decideDashboardPreviewAction({
      bundleType: "product_page",
      bundleId: "abc",
      shopifyProductHandle: "summer-bundle",
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
      shop: "s.myshopify.com",
    });
    expect(result).toEqual({
      kind: "error",
      toast: "Save and place the bundle on a product first to preview it.",
    });
  });

  it("does not depend on shop normalization before requesting an FPB preview", () => {
    const result = decideDashboardPreviewAction({
      bundleType: "full_page",
      bundleId: "abc",
      shopifyProductHandle: null,
      shop: "https://s.myshopify.com",
    });
    expect(result).toEqual({ kind: "create_fpb_preview" });
  });

  describe("live URL preference when embed enabled", () => {
    const baseFpb = {
      bundleType: "full_page" as const,
      bundleId: "abc",
      shopifyProductHandle: null,
      shop: "s.myshopify.com",
    };

    it("requests a fresh signed URL for active FPBs", () => {
      expect(decideDashboardPreviewAction({
        ...baseFpb,
        appEmbedEnabled: true,
        bundleStatus: "active",
      })).toEqual({ kind: "create_fpb_preview" });
    });

    it("requests a fresh signed URL for unlisted FPBs", () => {
      expect(decideDashboardPreviewAction({
        ...baseFpb,
        appEmbedEnabled: true,
        bundleStatus: "unlisted",
      })).toEqual({ kind: "create_fpb_preview" });
    });

    it("requests a fresh signed URL for draft FPBs", () => {
      expect(decideDashboardPreviewAction({
        ...baseFpb,
        appEmbedEnabled: true,
        bundleStatus: "draft",
      })).toEqual({ kind: "create_fpb_preview" });
    });

    it("keeps signed preview generation independent of embed status", () => {
      expect(decideDashboardPreviewAction({
        ...baseFpb,
        appEmbedEnabled: false,
        bundleStatus: "active",
      })).toEqual({ kind: "create_fpb_preview" });
    });

    it("does not require a page handle when embed enabled", () => {
      expect(decideDashboardPreviewAction({
        ...baseFpb,
        appEmbedEnabled: true,
        bundleStatus: "active",
      })).toEqual({ kind: "create_fpb_preview" });
    });

    it("PPB is unaffected by the live URL preference branch", () => {
      expect(decideDashboardPreviewAction({
        bundleType: "product_page",
        bundleId: "abc",
        shopifyProductHandle: "summer-bundle",
        shop: "s.myshopify.com",
        appEmbedEnabled: true,
        bundleStatus: "active",
      })).toEqual({ kind: "open_url", url: "https://s.myshopify.com/products/summer-bundle" });
    });
  });
});
