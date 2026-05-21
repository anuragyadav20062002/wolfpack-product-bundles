/**
 * Unit tests — parsePPBBundleSettings
 *
 * Spec: test-spec/ppb-bundle-settings.spec.md
 * Issue: [ppb-edit-bundle-flow-1]
 */

import { parsePPBBundleSettings } from "../../../app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/handlers/parsers";

jest.mock("../../../app/lib/css-sanitizer", () => ({
  processCss: jest.fn((css: string) => ({
    sanitizedCss: css.replace(/<script/gi, ""),
    isValid: true,
    warnings: [],
    syntaxErrors: [],
  })),
}));

function makeForm(fields: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    fd.append(key, value);
  }
  return fd;
}

describe("parsePPBBundleSettings", () => {
  it("returns correct defaults when form has no bundle settings fields", () => {
    const result = parsePPBBundleSettings(makeForm({}));
    expect(result.preSelectedProductVariantId).toBeNull();
    expect(result.maxQtyPerProduct).toBeNull();
    expect(result.productSlotsEnabled).toBe(false);
    expect(result.productSlotIconUrl).toBeNull();
    expect(result.variantSelectorEnabled).toBe(true);
    expect(result.showTextOnAddButton).toBe(false);
    expect(result.bundleCartTitle).toBeNull();
    expect(result.bundleCartSubtitle).toBeNull();
    expect(result.bundleBannerDesktopUrl).toBeNull();
    expect(result.bundleBannerMobileUrl).toBeNull();
    expect(result.bundleLevelCss).toBeNull();
  });

  it("parses variantSelectorEnabled defaults to true when missing", () => {
    const result = parsePPBBundleSettings(makeForm({}));
    expect(result.variantSelectorEnabled).toBe(true);
  });

  it("parses variantSelectorEnabled=false correctly", () => {
    const result = parsePPBBundleSettings(makeForm({ variantSelectorEnabled: "false" }));
    expect(result.variantSelectorEnabled).toBe(false);
  });

  it("parses preSelectedProductVariantId", () => {
    const result = parsePPBBundleSettings(makeForm({
      preSelectedProductVariantId: "gid://shopify/ProductVariant/456",
    }));
    expect(result.preSelectedProductVariantId).toBe("gid://shopify/ProductVariant/456");
  });

  it("returns null for preSelectedProductVariantId when empty", () => {
    const result = parsePPBBundleSettings(makeForm({ preSelectedProductVariantId: "" }));
    expect(result.preSelectedProductVariantId).toBeNull();
  });

  it("parses maxQtyPerProduct as integer", () => {
    const result = parsePPBBundleSettings(makeForm({ maxQtyPerProduct: "3" }));
    expect(result.maxQtyPerProduct).toBe(3);
  });

  it("returns null for maxQtyPerProduct when blank", () => {
    const result = parsePPBBundleSettings(makeForm({ maxQtyPerProduct: "" }));
    expect(result.maxQtyPerProduct).toBeNull();
  });

  it("parses productSlotsEnabled and productSlotIconUrl", () => {
    const result = parsePPBBundleSettings(makeForm({
      productSlotsEnabled: "true",
      productSlotIconUrl: "https://cdn.shopify.com/icon.png",
    }));
    expect(result.productSlotsEnabled).toBe(true);
    expect(result.productSlotIconUrl).toBe("https://cdn.shopify.com/icon.png");
  });

  it("returns null for productSlotIconUrl when empty", () => {
    const result = parsePPBBundleSettings(makeForm({ productSlotIconUrl: "" }));
    expect(result.productSlotIconUrl).toBeNull();
  });

  it("passes bundleLevelCss through processCss sanitizer", () => {
    const { processCss } = require("../../../app/lib/css-sanitizer");
    const result = parsePPBBundleSettings(makeForm({
      bundleLevelCss: ".bundle { color: red; }",
    }));
    expect(processCss).toHaveBeenCalledWith(".bundle { color: red; }");
    expect(result.bundleLevelCss).toBe(".bundle { color: red; }");
  });

  it("strips malicious CSS via sanitizer", () => {
    const result = parsePPBBundleSettings(makeForm({
      bundleLevelCss: "<script>alert(1)</script>.bundle{}",
    }));
    expect(result.bundleLevelCss).not.toContain("<script");
  });

  it("returns null for bundleLevelCss when empty", () => {
    const result = parsePPBBundleSettings(makeForm({ bundleLevelCss: "" }));
    expect(result.bundleLevelCss).toBeNull();
  });

  it("parses bundle cart title and subtitle", () => {
    const result = parsePPBBundleSettings(makeForm({
      bundleCartTitle: "My Bundle",
      bundleCartSubtitle: "Review items",
    }));
    expect(result.bundleCartTitle).toBe("My Bundle");
    expect(result.bundleCartSubtitle).toBe("Review items");
  });

  it("returns null for empty cart title and subtitle", () => {
    const result = parsePPBBundleSettings(makeForm({
      bundleCartTitle: "",
      bundleCartSubtitle: "",
    }));
    expect(result.bundleCartTitle).toBeNull();
    expect(result.bundleCartSubtitle).toBeNull();
  });

  it("parses bundle banner URLs", () => {
    const result = parsePPBBundleSettings(makeForm({
      bundleBannerDesktopUrl: "https://cdn.shopify.com/desktop.jpg",
      bundleBannerMobileUrl: "https://cdn.shopify.com/mobile.jpg",
    }));
    expect(result.bundleBannerDesktopUrl).toBe("https://cdn.shopify.com/desktop.jpg");
    expect(result.bundleBannerMobileUrl).toBe("https://cdn.shopify.com/mobile.jpg");
  });
});
