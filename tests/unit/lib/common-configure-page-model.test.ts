import {
  applyPpbCategoryVariantFlags,
  buildBundleLinkModel,
  buildBundleSettingsSlotModel,
  buildBundleVisibilityChildItems,
  buildConfigureSetupItems,
  buildStepSetupSectionModel,
  updatePpbCategoryVariantFlag,
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

  it("uses the same FPB-designed Step Setup section sequence for both bundle types", () => {
    const sharedSectionIds = [
      "step_flow",
      "step_setup_details",
      "category",
      "rules_configuration",
      "step_config",
    ];

    expect(buildStepSetupSectionModel("full_page").map((item) => item.id)).toEqual(
      sharedSectionIds,
    );
    expect(
      buildStepSetupSectionModel("product_page").map((item) => item.id),
    ).toEqual(sharedSectionIds);
  });

  it("keeps PPB category variant controls as an explicit category footer slot", () => {
    expect(
      buildStepSetupSectionModel("full_page").find(
        (section) => section.id === "category",
      )?.slots,
    ).toEqual([]);
    expect(
      buildStepSetupSectionModel("product_page").find(
        (section) => section.id === "category",
      )?.slots,
    ).toEqual(["category_variant_controls"]);
  });

  it("builds Bundle Settings slots with shared, FPB-only, and PPB-only controls", () => {
    expect(buildBundleSettingsSlotModel("full_page")).toEqual({
      shared: ["default_products", "quantity_validation", "summary_text"],
      fullPageOnly: ["product_slots", "slot_icon"],
      productPageOnly: [],
    });
    expect(buildBundleSettingsSlotModel("product_page")).toEqual({
      shared: ["default_products", "quantity_validation", "summary_text"],
      fullPageOnly: [],
      productPageOnly: [
        "variant_selector",
        "cart_line_discount_display",
        "bundle_banner",
        "bundle_level_css",
        "subscription_controls",
        "bundle_embed",
        "place_widget",
      ],
    });
  });

  it("applies PPB category variant controls to category-level fields", () => {
    const categories = [
      {
        id: "cat-1",
        name: "Category 1",
        products: [{ id: "gid://shopify/Product/1" }],
        displayVariantsAsIndividualProducts: false,
        displayVariantsAsSwatches: true,
      },
      {
        id: "cat-2",
        name: "Category 2",
        collections: [{ id: "gid://shopify/Collection/1" }],
        displayVariantsAsIndividualProducts: false,
        displayVariantsAsSwatches: false,
      },
    ];

    expect(
      applyPpbCategoryVariantFlags(categories, {
        displayVariantsAsIndividualProducts: true,
      }),
    ).toEqual([
      {
        id: "cat-1",
        name: "Category 1",
        products: [{ id: "gid://shopify/Product/1" }],
        displayVariantsAsIndividualProducts: true,
        displayVariantsAsSwatches: true,
      },
      {
        id: "cat-2",
        name: "Category 2",
        collections: [{ id: "gid://shopify/Collection/1" }],
        displayVariantsAsIndividualProducts: true,
        displayVariantsAsSwatches: false,
      },
    ]);
  });

  it("updates the variant display flag for only the targeted PPB category", () => {
    const categories = [
      {
        id: "cat-1",
        displayVariantsAsIndividualProducts: false,
      },
      {
        id: "cat-2",
        displayVariantsAsIndividualProducts: false,
      },
    ];

    expect(updatePpbCategoryVariantFlag(categories, 1, true)).toEqual([
      {
        id: "cat-1",
        displayVariantsAsIndividualProducts: false,
      },
      {
        id: "cat-2",
        displayVariantsAsIndividualProducts: true,
      },
    ]);
  });
});
