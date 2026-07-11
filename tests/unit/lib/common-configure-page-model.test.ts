import {
  buildBundleLinkModel,
  buildBundleVisibilityChildItems,
  buildConfigureSetupItems,
  buildEmbedStatusModel,
  isMultiLanguageActionDisabled,
} from "../../../app/lib/bundle-config/common-configure-page-model";

describe("common configure page model", () => {
  it("builds the FPB section list without PPB-only subscriptions", () => {
    expect(buildConfigureSetupItems("full_page").map((item) => item.id)).toEqual(
      [
        "step_setup",
        "discount_pricing",
        "bundle_visibility",
        "bundle_settings",
        "select_template",
      ],
    );
  });

  it("builds the PPB section list with PPB-only subscriptions", () => {
    expect(
      buildConfigureSetupItems("product_page").map((item) => item.id),
    ).toEqual([
      "step_setup",
      "discount_pricing",
      "bundle_visibility",
      "bundle_settings",
      "subscriptions",
      "select_template",
    ]);
  });

  it("keeps Bundle Embed as a PPB-only visibility child", () => {
    expect(buildBundleVisibilityChildItems("full_page")).toEqual([
      { id: "bundle_widget", label: "Bundle Widget" },
    ]);
    expect(buildBundleVisibilityChildItems("product_page")).toEqual([
      { id: "bundle_widget", label: "Bundle Widget" },
      { id: "bundle_embed", label: "Bundle Embed" },
    ]);
  });

  it("returns FPB page links and PPB product links", () => {
    expect(
      buildBundleLinkModel({
        bundleType: "full_page",
        fullPageUrl: "https://shop.test/pages/build-a-box",
        pageHandle: "build-a-box",
      }),
    ).toMatchObject({
      kind: "page",
      isLinked: true,
      url: "https://shop.test/pages/build-a-box",
    });

    expect(
      buildBundleLinkModel({
        bundleType: "product_page",
        shop: "shop.test",
        productHandle: "starter-box",
      }),
    ).toMatchObject({
      kind: "product",
      isLinked: true,
      url: "https://shop.test/products/starter-box",
    });
  });

  it("uses the same app embed status model for both bundle types", () => {
    expect(buildEmbedStatusModel("full_page", true)).toEqual(
      buildEmbedStatusModel("product_page", true),
    );
    expect(buildEmbedStatusModel("full_page", false)).toEqual(
      buildEmbedStatusModel("product_page", false),
    );
    expect(buildEmbedStatusModel("product_page", false)).toMatchObject({
      label: "Disabled",
      tone: "warning",
    });
  });

  it("disables multi-language actions when no locales are available", () => {
    expect(isMultiLanguageActionDisabled([])).toBe(true);
    expect(isMultiLanguageActionDisabled([{ locale: "en" }])).toBe(false);
  });
});
