import {
  DESIGN_CONFIGURATION,
  EXPERT_COLOR_CONTROLS,
} from "../../../app/lib/admin-configuration-surfaces";
import {
  DESIGN_PREVIEW_FIXTURE,
  DESIGN_PREVIEW_TEMPLATES,
  buildDesignPreviewTheme,
  getDesignPreviewFieldTarget,
  getDesignPreviewScene,
  getSupportedDesignPreviewSurfaces,
  isDesignPreviewFieldApplicable,
} from "../../../app/routes/app/app.settings/design-preview-model";
import { existsSync } from "node:fs";
import { join } from "node:path";

describe("Settings Design preview model", () => {
  it("derives all eight descriptors from canonical storefront contracts", () => {
    expect(DESIGN_PREVIEW_TEMPLATES.map((template) => ({
      key: template.key,
      preset: template.selection.bundleDesignPresetId,
      productCard: template.productCard,
      navigation: template.navigation,
      categories: template.categories,
      summary: template.summary,
      surfaces: template.supportedSurfaces,
    }))).toEqual([
      {
        key: "standard",
        preset: "STANDARD",
        productCard: { mode: "grid", columns: { desktop: 3, mobile: 2 } },
        navigation: "timeline",
        categories: "accordion",
        summary: "rows",
        surfaces: ["builder", "cart-summary", "loading", "validation", "upsell"],
      },
      {
        key: "classic",
        preset: "CLASSIC",
        productCard: { mode: "grid", columns: { desktop: 4, mobile: 2 } },
        navigation: "timeline",
        categories: "pills",
        summary: "slot-grid",
        surfaces: ["builder", "cart-summary", "loading", "validation", "upsell"],
      },
      {
        key: "compact",
        preset: "COMPACT",
        productCard: { mode: "compact", columns: { desktop: 3, mobile: 2 } },
        navigation: "compact-timeline",
        categories: "pills",
        summary: "compact-slots",
        surfaces: ["builder", "cart-summary", "loading", "validation", "upsell"],
      },
      {
        key: "horizontal",
        preset: "HORIZONTAL",
        productCard: { mode: "row", columns: { desktop: 2, mobile: 1 } },
        navigation: "horizontal-timeline",
        categories: "underline",
        summary: "rows",
        surfaces: ["builder", "cart-summary", "loading", "validation", "upsell"],
      },
      {
        key: "product-list",
        preset: "CASCADE",
        productCard: { mode: "row", columns: { desktop: 1, mobile: 1 } },
        navigation: "cascade-steps",
        categories: "tabs",
        summary: "cascade-drawer",
        surfaces: ["builder", "cart-summary", "loading", "validation", "upsell"],
      },
      {
        key: "product-grid",
        preset: "COGNIVE",
        productCard: { mode: "grid", columns: { desktop: 4, mobile: 2 } },
        navigation: "cognive-steps",
        categories: "tabs",
        summary: "pdp-footer",
        surfaces: ["builder", "cart-summary", "loading", "validation", "upsell"],
      },
      {
        key: "horizontal-slots",
        preset: "MODAL",
        productCard: { mode: "grid", columns: { desktop: 3, mobile: 2 } },
        navigation: "none",
        categories: "none",
        summary: "modal-footer",
        surfaces: ["builder", "product-picker", "cart-summary", "loading", "validation", "upsell"],
      },
      {
        key: "vertical-slots",
        preset: "SIMPLIFIED",
        productCard: { mode: "grid", columns: { desktop: 3, mobile: 2 } },
        navigation: "none",
        categories: "none",
        summary: "modal-footer",
        surfaces: ["builder", "product-picker", "cart-summary", "loading", "validation", "upsell"],
      },
    ]);
  });

  it("assigns every editable preview field to a semantic surface", () => {
    const fields = [
      ...DESIGN_CONFIGURATION.flatMap((section) => section.fields),
      ...Object.values(EXPERT_COLOR_CONTROLS).flat(),
    ].filter((field) => field.kind !== "loadingSpinner");

    for (const field of fields) {
      const fieldKey = field.key ?? field.label;
      expect(getDesignPreviewFieldTarget(fieldKey)).toBeDefined();
      for (const template of DESIGN_PREVIEW_TEMPLATES) {
        const target = getDesignPreviewFieldTarget(fieldKey, template.key);
        const isMappedToSupportedSurface = !isDesignPreviewFieldApplicable(fieldKey, template.key)
          || Boolean(target && getSupportedDesignPreviewSurfaces(template.key).includes(target.surface));
        expect(isMappedToSupportedSurface).toBe(true);
      }
    }
  });

  it("reveals secondary storefront surfaces for the fields that own them", () => {
    expect(getDesignPreviewFieldTarget(
      "expert.productCard.productCardButtonColor",
      "horizontal-slots",
    )?.surface).toBe("product-picker");
    expect(getDesignPreviewFieldTarget(
      "expert.cartFooter.cartFooterBgColor",
      "product-list",
    )?.surface).toBe("cart-summary");
    expect(getDesignPreviewFieldTarget(
      "expert.generalSettings.loadingBgColor",
      "standard",
    )?.surface).toBe("loading");
    expect(getDesignPreviewFieldTarget(
      "expert.generalSettings.conditionToastBgColor",
      "product-grid",
    )?.surface).toBe("validation");
    expect(getDesignPreviewFieldTarget(
      "expert.mixAndMatchConfig.generalSettings.bundleUpsellButtonBg",
      "vertical-slots",
    )?.surface).toBe("upsell");
  });

  it("reports template-specific applicability without fabricating an effect", () => {
    expect(isDesignPreviewFieldApplicable("expert.generalSettings.productPageTitleColor", "product-grid")).toBe(true);
    expect(isDesignPreviewFieldApplicable("expert.generalSettings.productPageTitleColor", "standard")).toBe(false);
    expect(isDesignPreviewFieldApplicable("expert.emptyStateCard.emptyStateCardBorderColor", "horizontal-slots")).toBe(true);
    expect(isDesignPreviewFieldApplicable("expert.emptyStateCard.emptyStateCardBorderColor", "product-list")).toBe(false);
  });

  it("builds family-specific themes from normalized storefront runtime values", () => {
    const fieldValues = {
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
      "expert.generalSettings.conditionToastBgColor": "#070707",
      "expert.productCard.productCardButtonColor": "#112233",
      "expert.emptyStateCard.emptyStateCardBorderColor": "#080808",
      "expert.emptyStateCard.emptyStateCardTextColor": "#030303",
      "expert.cartFooter.cartFooterBgColor": "#090909",
      "expert.cartFooter.cartFooterBackButtonColor": "#040404",
      "expert.cartFooter.cartFooterDiscountProgressBarFilledColor": "#050505",
      "expert.mixAndMatchConfig.generalSettings.bundleUpsellFontColor": "#060606",
    };

    const fpbTheme = buildDesignPreviewTheme(fieldValues, true, "standard");
    const ppbTheme = buildDesignPreviewTheme(fieldValues, true, "product-list");

    expect(fpbTheme["--preview-primary-font-size"]).toBe("18px");
    expect(fpbTheme["--preview-primary-font-weight"]).toBe("700");
    expect(fpbTheme["--preview-body-font-weight"]).toBe("700");
    expect(fpbTheme["--preview-button-radius"]).toBe("40px");
    expect(fpbTheme["--preview-card-radius"]).toBe("0px");
    expect(fpbTheme["--preview-image-fit"]).toBe("contain");
    expect(fpbTheme["--preview-step-check"]).toBe("#010101");
    expect(fpbTheme["--preview-loading-bg"]).toBe("#020202");
    expect(fpbTheme["--preview-cart-back-bg"]).toBe("#040404");
    expect(fpbTheme["--preview-discount-progress-filled"]).toBe("#050505");
    expect(ppbTheme["--preview-empty-text"]).toBe("#030303");
    expect(ppbTheme["--preview-empty-border"]).toBe("#080808");
    expect(ppbTheme["--preview-empty-icon"]).toBe("#080808");
    expect(ppbTheme["--preview-quantity-text"]).toBe("#223344");
    expect(ppbTheme["--preview-toast-bg"]).toBe("#070707");
    expect(ppbTheme["--preview-cart-bg"]).toBe("#090909");
    expect(ppbTheme["--preview-add-bundle-bg"]).toBe("#112233");
    expect(ppbTheme["--preview-upsell-text"]).toBe("#060606");
    expect(ppbTheme["--preview-product-button-bg"]).toBe("#112233");
  });

  it("provides deterministic multi-surface fixture data with local media", () => {
    expect(DESIGN_PREVIEW_FIXTURE.steps).toHaveLength(2);
    expect(DESIGN_PREVIEW_FIXTURE.categories.length).toBeGreaterThan(1);
    expect(DESIGN_PREVIEW_FIXTURE.products.length).toBeGreaterThan(3);
    expect(DESIGN_PREVIEW_FIXTURE.discountTiers.length).toBeGreaterThan(1);
    expect(DESIGN_PREVIEW_FIXTURE.products.every((product) => (
      product.imageUrl.startsWith("/design-preview-product-")
      && product.imageUrl.endsWith(".png")
    ))).toBe(true);
    expect(DESIGN_PREVIEW_FIXTURE.products.every((product) => (
      // Fixture paths are constrained by the assertion above to public root PNGs.
      // eslint-disable-next-line security/detect-non-literal-fs-filename
      existsSync(join(process.cwd(), "public", product.imageUrl.slice(1)))
    ))).toBe(true);
    expect(DESIGN_PREVIEW_FIXTURE.validationMessage).toBeTruthy();
    expect(DESIGN_PREVIEW_FIXTURE.upsell).toBeTruthy();
  });

  it("resolves required storefront-owned regions for representative scenes", () => {
    expect(getDesignPreviewScene("standard", "builder", "desktop").regions).toEqual(
      expect.arrayContaining(["timeline", "category-accordion", "product-grid", "summary-sidebar"]),
    );
    expect(getDesignPreviewScene("classic", "builder", "mobile").regions).toEqual(
      expect.arrayContaining(["pill-categories", "product-grid", "expandable-summary-tray"]),
    );
    expect(getDesignPreviewScene("horizontal", "builder", "desktop").regions).toEqual(
      expect.arrayContaining(["underline-categories", "product-rows", "summary-sidebar"]),
    );
    expect(getDesignPreviewScene("product-list", "cart-summary", "desktop").regions).toEqual(
      expect.arrayContaining(["cascade-selected-drawer", "pdp-footer"]),
    );
    expect(getDesignPreviewScene("product-grid", "builder", "mobile").regions).toEqual(
      expect.arrayContaining(["cognive-step-headers", "product-grid", "pdp-footer"]),
    );
    expect(getDesignPreviewScene("horizontal-slots", "product-picker", "desktop").regions).toEqual(
      expect.arrayContaining(["horizontal-slots", "product-picker-modal"]),
    );
    expect(getDesignPreviewScene("vertical-slots", "product-picker", "mobile").regions).toEqual(
      expect.arrayContaining(["vertical-slots", "product-picker-bottom-sheet"]),
    );
  });

  it("keeps the local preview available while a field has an incomplete value", () => {
    expect(() => buildDesignPreviewTheme({ "Primary Font Size": "" })).not.toThrow();
    expect(buildDesignPreviewTheme({ "Primary Font Size": "" })["--preview-primary-font-size"]).toBe("16px");
  });
});
