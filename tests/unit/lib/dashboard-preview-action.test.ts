/**
 * Unit tests for decideDashboardPreviewAction.
 *
 * Issue: feedback-jun26-5
 * Spec : test-spec/dashboard-preview-action.spec.md
 */
import { decideDashboardPreviewAction } from "../../../app/lib/dashboard-preview-action";

describe("decideDashboardPreviewAction", () => {
  it("returns open_url for FPB with a published Shopify Page", () => {
    const result = decideDashboardPreviewAction({
      bundleType: "full_page",
      bundleId: "abc",
      shopifyProductHandle: null,
      shopifyPageHandle: "build-your-box",
      shop: "s.myshopify.com",
    });
    expect(result).toEqual({
      kind: "open_url",
      url: "https://s.myshopify.com/apps/product-bundles/wpb/abc",
    });
  });

  it("returns create_page_then_open for FPB without a Shopify Page", () => {
    const result = decideDashboardPreviewAction({
      bundleType: "full_page",
      bundleId: "abc",
      shopifyProductHandle: null,
      shopifyPageHandle: null,
      shop: "s.myshopify.com",
    });
    expect(result).toEqual({
      kind: "create_page_then_open",
      url: "https://s.myshopify.com/apps/product-bundles/wpb/abc",
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
      url: "https://s.myshopify.com/apps/product-bundles/wpb/abc",
    });
  });
});
