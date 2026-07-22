import {
  DESIGN_CONFIGURATION,
  EXPERT_COLOR_CONTROLS,
} from "../../../app/lib/admin-configuration-surfaces";
import {
  DESIGN_PREVIEW_TEMPLATES,
  buildDesignPreviewTheme,
  getDesignPreviewFieldTarget,
  isDesignPreviewFieldApplicable,
} from "../../../app/routes/app/app.settings/design-preview-model";

describe("Settings Design preview model", () => {
  it("describes the storefront structure of all eight templates", () => {
    expect(DESIGN_PREVIEW_TEMPLATES.map((template) => ({
      key: template.key,
      family: template.family,
      products: template.products,
      navigation: template.navigation,
      summary: template.summary,
    }))).toEqual([
      { key: "standard", family: "full-page", products: "card-grid", navigation: "timeline", summary: "rows" },
      { key: "classic", family: "full-page", products: "card-grid", navigation: "tabs", summary: "slot-grid" },
      { key: "compact", family: "full-page", products: "overlay-grid", navigation: "compact-timeline", summary: "compact-slots" },
      { key: "horizontal", family: "full-page", products: "card-rows", navigation: "tabs", summary: "rows" },
      { key: "product-list", family: "product-page", products: "product-list", navigation: "none", summary: "pdp-footer" },
      { key: "product-grid", family: "product-page", products: "product-grid", navigation: "accordion", summary: "pdp-footer" },
      { key: "horizontal-slots", family: "product-page", products: "horizontal-slots", navigation: "none", summary: "pdp-footer" },
      { key: "vertical-slots", family: "product-page", products: "vertical-slots", navigation: "none", summary: "pdp-footer" },
    ]);
  });

  it("assigns every editable preview field to a semantic preview target", () => {
    const fields = [
      ...DESIGN_CONFIGURATION.flatMap((section) => section.fields),
      ...Object.values(EXPERT_COLOR_CONTROLS).flat(),
    ].filter((field) => field.kind !== "loadingSpinner");

    for (const field of fields) {
      expect(getDesignPreviewFieldTarget(field.key ?? field.label)).toBeDefined();
    }
  });

  it("routes non-default surfaces to their representative preview modes", () => {
    expect(getDesignPreviewFieldTarget("expert.generalSettings.loadingBgColor")?.mode).toBe("loading");
    expect(getDesignPreviewFieldTarget("expert.generalSettings.conditionToastBgColor")?.mode).toBe("validation");
    expect(getDesignPreviewFieldTarget("expert.mixAndMatchConfig.generalSettings.bundleUpsellButtonBg")?.mode).toBe("upsell");
  });

  it("reports template-specific applicability without fabricating an effect", () => {
    expect(isDesignPreviewFieldApplicable("expert.generalSettings.productPageTitleColor", "product-grid")).toBe(true);
    expect(isDesignPreviewFieldApplicable("expert.generalSettings.productPageTitleColor", "standard")).toBe(false);
    expect(isDesignPreviewFieldApplicable("expert.emptyStateCard.emptyStateCardBorderColor", "horizontal-slots")).toBe(true);
    expect(isDesignPreviewFieldApplicable("expert.emptyStateCard.emptyStateCardBorderColor", "product-list")).toBe(false);
  });

  it("builds the preview theme from normalized storefront runtime values", () => {
    const theme = buildDesignPreviewTheme({
      "Primary Color": "#112233",
      "Button Text Color": "#fafafa",
      "Primary Text Color": "#223344",
      "Secondary Color": "#ddeeff",
      "Product Background Color": "#ffffff",
      "Primary Font Size": "18",
      "Primary Font Weight": "Bold",
      "Secondary Font Size": "12",
      "Secondary Font Weight": "Regular",
      "Body Font Size": "15",
      "Body Font Weight": "Bold",
      "Bundle Buttons Corner Style": "Round",
      "Bundle Buttons Base": "7px",
      "Product Card & Cart Corner Style": "Sharp",
      "Product Card & Cart Base": "11px",
      "Image Fit": "Contain",
      "expert.navigationBanner.navigationCheckColor": "#010101",
      "expert.generalSettings.loadingBgColor": "#020202",
      "expert.emptyStateCard.emptyStateCardTextColor": "#030303",
      "expert.cartFooter.cartFooterBackButtonColor": "#040404",
      "expert.cartFooter.cartFooterDiscountProgressBarFilledColor": "#050505",
      "expert.mixAndMatchConfig.generalSettings.bundleUpsellFontColor": "#060606",
    }, true);

    expect(theme["--preview-primary-font-size"]).toBe("18px");
    expect(theme["--preview-primary-font-weight"]).toBe("700");
    expect(theme["--preview-body-font-weight"]).toBe("700");
    expect(theme["--preview-button-radius"]).toBe("40px");
    expect(theme["--preview-card-radius"]).toBe("0px");
    expect(theme["--preview-image-fit"]).toBe("contain");
    expect(theme["--preview-step-check"]).toBe("#010101");
    expect(theme["--preview-loading-bg"]).toBe("#020202");
    expect(theme["--preview-empty-text"]).toBe("#030303");
    expect(theme["--preview-cart-back-bg"]).toBe("#040404");
    expect(theme["--preview-discount-progress-filled"]).toBe("#050505");
    expect(theme["--preview-upsell-text"]).toBe("#060606");
  });

  it("keeps the local preview available while a field has an incomplete value", () => {
    expect(() => buildDesignPreviewTheme({ "Primary Font Size": "" })).not.toThrow();
    expect(buildDesignPreviewTheme({ "Primary Font Size": "" })["--preview-primary-font-size"]).toBe("16px");
  });
});
