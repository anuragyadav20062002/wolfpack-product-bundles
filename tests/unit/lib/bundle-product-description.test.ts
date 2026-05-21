import {
  buildBundleProductDescriptionHtml,
  getBundleProductTroubleshootingCategory,
  hasBundleProductSoftError,
} from "../../../app/lib/bundle-product-description.server";

describe("bundle product description", () => {
  it("overrides merchant descriptions with visibility troubleshooting copy for unlisted bundles", () => {
    const html = buildBundleProductDescriptionHtml({
      bundleName: "Starter Bundle",
      customDescription: "<p>Merchant description</p>",
      status: "unlisted",
    });

    expect(html).toContain("<strong>Category:</strong> Visibility");
    expect(html).toContain("Your Bundle is Unlisted");
    expect(html).toContain("Wolfpack Product Bundles");
    expect(html).not.toContain("Merchant description");
  });

  it("keeps merchant descriptions when no troubleshooting category applies", () => {
    const html = buildBundleProductDescriptionHtml({
      bundleName: "Starter Bundle",
      customDescription: "<p>Merchant description</p>",
      status: "active",
    });

    expect(html).toBe("<p>Merchant description</p>");
  });

  it("uses an escaped neutral product description when no custom description exists", () => {
    const html = buildBundleProductDescriptionHtml({
      bundleName: 'Starter <Bundle> "One"',
      customDescription: " ",
      status: "active",
    });

    expect(html).toBe("Starter &lt;Bundle&gt; &quot;One&quot; - Bundle Product");
  });

  it("detects only explicitly mapped soft-error statuses", () => {
    expect(hasBundleProductSoftError("unlisted")).toBe(true);
    expect(hasBundleProductSoftError("active")).toBe(false);
    expect(hasBundleProductSoftError(null)).toBe(false);
  });

  it("maps statuses to deterministic troubleshooting categories", () => {
    expect(getBundleProductTroubleshootingCategory({ status: "unlisted" })).toBe("visibility_unlisted");
    expect(getBundleProductTroubleshootingCategory({ status: "active" })).toBeNull();
    expect(getBundleProductTroubleshootingCategory({ status: null })).toBeNull();
  });
});
