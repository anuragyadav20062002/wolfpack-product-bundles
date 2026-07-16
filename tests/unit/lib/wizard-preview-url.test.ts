/**
 * Unit tests for buildWizardPreviewUrl.
 *
 * Issue: feedback-jun26-2
 * Spec : test-spec/wizard-preview-url.spec.md
 */
import { buildWizardPreviewUrl } from "../../../app/lib/wizard-preview-url";

describe("buildWizardPreviewUrl", () => {
  it("returns the proxy URL for full_page bundles without a linked page", () => {
    const result = buildWizardPreviewUrl({
      shop: "s.myshopify.com",
      bundleId: "abc",
      bundleType: "full_page",
      productHandle: null,
      pageHandle: null,
    });
    expect(result).toEqual({ kind: "url", url: "https://s.myshopify.com/apps/product-bundles/wpb/abc" });
  });

  it("ignores legacy page handles for full_page bundles", () => {
    const result = buildWizardPreviewUrl({
      shop: "s.myshopify.com",
      bundleId: "abc",
      bundleType: "full_page",
      productHandle: null,
      pageHandle: "build-your-box",
    });
    expect(result).toEqual({
      kind: "url",
      url: "https://s.myshopify.com/apps/product-bundles/wpb/abc",
    });
  });

  it("returns product URL for product_page bundles with handle", () => {
    const result = buildWizardPreviewUrl({
      shop: "s.myshopify.com",
      bundleId: "abc",
      bundleType: "product_page",
      productHandle: "summer-bundle",
      pageHandle: null,
    });
    expect(result).toEqual({
      kind: "url",
      url: "https://s.myshopify.com/products/summer-bundle",
    });
  });

  it("returns error when product_page bundle has no product handle", () => {
    const result = buildWizardPreviewUrl({
      shop: "s.myshopify.com",
      bundleId: "abc",
      bundleType: "product_page",
      productHandle: null,
      pageHandle: null,
    });
    expect(result).toEqual({ kind: "error", reason: "missing_product_handle" });
  });

  it("strips an accidental https:// prefix from shop", () => {
    const result = buildWizardPreviewUrl({
      shop: "https://s.myshopify.com",
      bundleId: "abc",
      bundleType: "full_page",
      productHandle: null,
      pageHandle: null,
    });
    expect(result).toEqual({ kind: "url", url: "https://s.myshopify.com/apps/product-bundles/wpb/abc" });
  });

  it("strips a trailing slash from shop", () => {
    const result = buildWizardPreviewUrl({
      shop: "s.myshopify.com/",
      bundleId: "abc",
      bundleType: "product_page",
      productHandle: "summer-bundle",
      pageHandle: null,
    });
    expect(result).toEqual({
      kind: "url",
      url: "https://s.myshopify.com/products/summer-bundle",
    });
  });
});
