import {
  buildGeneratedBundleProductHandle,
  buildGeneratedBundleProductMetadata,
} from "../../../app/lib/bundle-product-data.server";

describe("generated bundle product data helpers", () => {
  it("builds the generated product handle from the saved bundle name", () => {
    expect(
      buildGeneratedBundleProductHandle("WPB Complete Audit Product Page 2026-05-25"),
    ).toBe("wpb-complete-audit-product-page-2026-05-25");
  });

  it("builds product metadata from bundle data and shop name", () => {
    expect(
      buildGeneratedBundleProductMetadata({
        bundleName: "WPB Complete Audit Product Page 2026-05-25",
        shopName: "Yash-wolfpack",
      }),
    ).toEqual({
      title: "WPB Complete Audit Product Page 2026-05-25",
      handle: "wpb-complete-audit-product-page-2026-05-25",
      productType: "product",
      vendor: "Yash-wolfpack",
    });
  });
});
