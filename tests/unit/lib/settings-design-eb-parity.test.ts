import { generateCSSFromSettings } from "../../../app/lib/css-generators";
import {
  SETTINGS_DESIGN_BUNDLE_TYPES,
  buildSettingsDesignRuntime,
} from "../../../app/lib/settings-design-runtime";

function makePayload(overrides: Record<string, string> = {}, isExpertControlsEnabled = false) {
  return {
    isExpertControlsEnabled,
    fieldValues: {
      "Primary Color": "#111111",
      "Button Text Color": "#fafafa",
      "Primary Text Color": "#222222",
      "Secondary Color": "#dddddd",
      "Product Background Color": "#ffffff",
      "Primary Font Size": "18",
      "Primary Font Weight": "Bold",
      "Secondary Font Size": "12",
      "Secondary Font Weight": "Regular",
      "Body Font Size": "15",
      "Body Font Weight": "Regular",
      "Bundle Buttons Base": "7px",
      "Bundle Buttons Corner Style": "Base",
      "Product Card & Cart Base": "11px",
      "Product Card & Cart Corner Style": "Base",
      "Image Fit": "Contain",
      ...overrides,
    },
  };
}

function expectGeneratedCssToInclude(css: string, declarations: string[]) {
  declarations.forEach((declaration) => {
    expect(css.includes(declaration)).toBe(true);
  });
}

describe("buildSettingsDesignRuntime", () => {
  it("fans out brand colors to EB pageCustomization targets when expert controls are disabled", () => {
    const runtime = buildSettingsDesignRuntime(makePayload());
    const pageCustomization = runtime.pageCustomization as any;

    expect(pageCustomization.productCard.productCardButtonColor).toBe("#111111");
    expect(pageCustomization.navigationBanner.navigationBannerStepProgressBarFilledColor).toBe("#111111");
    expect(pageCustomization.categoryBlock.tabActiveBgColor).toBe("#111111");
    expect(pageCustomization.cartFooter.cartFooterNextButtonColor).toBe("#111111");
    expect(pageCustomization.summaryBlock.summaryBlockAddToCartButtonColor).toBe("#111111");
    expect(pageCustomization.landingPage.landingPageButtonBgColor).toBe("#111111");
    expect(pageCustomization.mixAndMatchConfig.productCard.productCardButtonBgColor).toBe("#111111");
    expect(pageCustomization.mixAndMatchConfig.footer.footerNextBtnBgColor).toBe("#111111");
    expect(pageCustomization.productCard.productCardButtonTextColor).toBe("#fafafa");
    expect(pageCustomization.navigationBanner.tabsInactiveTextColor).toBe("#222222");
    expect(pageCustomization.mixAndMatchConfig.productCard.productCardPriceColor).toBe("#222222");
    expect(pageCustomization.navigationBanner.tabsInactiveBgColor).toBe("#dddddd");
    expect(pageCustomization.productCard.productCardBgColor).toBe("#ffffff");
    expect(pageCustomization.mixAndMatchConfig.footer.footerBgColor).toBe("#ffffff");
  });

  it("stores the full EB stylePresets object", () => {
    const runtime = buildSettingsDesignRuntime(makePayload());
    const stylePresets = (runtime.pageCustomization as any).stylePresets;

    expect(stylePresets).toEqual({
      colors: {
        primaryColor: "#111111",
        buttonTextColor: "#fafafa",
        primaryTextColor: "#222222",
        accentColor: "#dddddd",
        backgroundColor: "#ffffff",
      },
      typography: {
        primaryFontSize: "18px",
        primaryFontWeight: "Bold",
        secondaryFontSize: "12px",
        secondaryFontWeight: "Regular",
        bodyFontSize: "15px",
        bodyFontWeight: "Regular",
      },
      corners: {
        buttonBorderRadius: "Base",
        baseBorderRadiusPx: 7,
        productCardBaseBorderRadius: 11,
        productCardBorderRadiusStyle: "Base",
      },
      images: {
        productImageFit: "contain",
      },
      isExpertControlsEnabled: false,
    });
  });

  it("maps typography labels to EB pageCustomization paths and numeric runtime fields", () => {
    const runtime = buildSettingsDesignRuntime(makePayload());
    const pageCustomization = runtime.pageCustomization as any;
    const designSettings = runtime.designSettings as any;

    expect(pageCustomization.productCard.productTitleFontSize).toBe("18px");
    expect(pageCustomization.productCard.productTitleFontWeight).toBe("Bold");
    expect(pageCustomization.mixAndMatchConfig.productCard.productCardTitleFont).toBe("18px");
    expect(pageCustomization.mixAndMatchConfig.productCard.productCardTitleWeight).toBe("Bold");
    expect(pageCustomization.productCard.compareAtPriceFontSize).toBe("12px");
    expect(pageCustomization.productCard.productCardVariantSelectorFontSize).toBe("15px");
    expect(designSettings.productCardFontSize).toBe(18);
    expect(designSettings.productCardFontWeight).toBe(700);
    expect(designSettings.productFinalPriceFontSize).toBe(12);
    expect(designSettings.productFinalPriceFontWeight).toBe(400);
  });

  it("follows EB radius derivation for buttons and product card/cart images", () => {
    const runtime = buildSettingsDesignRuntime(makePayload({
      "Bundle Buttons Corner Style": "Round",
      "Bundle Buttons Base": "9px",
      "Product Card & Cart Base": "3px",
    }));
    const pageCustomization = runtime.pageCustomization as any;

    expect(pageCustomization.productCard.buttonBorderRadius).toBe("40px");
    expect(pageCustomization.cartFooter.cartFooterButtonsBorderRadius).toBe("40px");
    expect(pageCustomization.mixAndMatchConfig.tabs.tabsBorderRadius).toBe("40px");
    expect(pageCustomization.productCard.cardBorderRadius).toBe("3px");
    expect(pageCustomization.productCard.cardImageBorderRadius).toBe("1px");
    expect(pageCustomization.mixAndMatchConfig.productCard.productCardImageBorderRadius).toBe("1px");
  });

  it("maps image fit in lowercase to FPB and PPB paths", () => {
    const runtime = buildSettingsDesignRuntime(makePayload({ "Image Fit": "Fill" }));
    const pageCustomization = runtime.pageCustomization as any;

    expect(pageCustomization.productCard.productImageFit).toBe("fill");
    expect(pageCustomization.mixAndMatchConfig.productCard.productCardImageFit).toBe("fill");
    expect((runtime.designSettings as any).productCardImageFit).toBe("fill");
  });

  it("uses expert fields as component-specific overrides", () => {
    const runtime = buildSettingsDesignRuntime(makePayload({
      "expert.productCard.productCardBgColor": "#ffeeee",
      "expert.productCard.productCardTextColor": "#123456",
      "expert.productCard.productCardButtonColor": "#654321",
      "expert.productCard.productCardButtonTextColor": "#abcdef",
      "expert.navigationBanner.tabsActiveBgColor": "#010101",
      "expert.navigationBanner.tabsActiveTextColor": "#020202",
      "expert.navigationBanner.tabsInactiveBgColor": "#030303",
      "expert.navigationBanner.tabsInactiveTextColor": "#040404",
      "expert.cartFooter.cartFooterNextButtonColor": "#050505",
      "expert.mixAndMatchConfig.generalSettings.bundleUpsellButtonBg": "#060606",
      "expert.mixAndMatchConfig.generalSettings.bundleUpsellButtonTextColor": "#070707",
      "expert.mixAndMatchConfig.generalSettings.bundleUpsellFontColor": "#080808",
    }, true));
    const pageCustomization = runtime.pageCustomization as any;

    expect(pageCustomization.stylePresets.colors.primaryColor).toBe("#111111");
    expect(pageCustomization.stylePresets.isExpertControlsEnabled).toBe(true);
    expect(pageCustomization.productCard.productCardBgColor).toBe("#ffeeee");
    expect(pageCustomization.productCard.productCardTextColor).toBe("#123456");
    expect(pageCustomization.productCard.productCardButtonColor).toBe("#654321");
    expect(pageCustomization.productCard.productCardButtonTextColor).toBe("#abcdef");
    expect(pageCustomization.navigationBanner.tabsActiveBgColor).toBe("#010101");
    expect(pageCustomization.mixAndMatchConfig.tabs.tabsInactiveTextColor).toBe("#040404");
    expect(pageCustomization.cartFooter.cartFooterNextButtonColor).toBe("#050505");
    expect(pageCustomization.generalSettings.bundleUpSellButtonBg).toBe("#060606");
    expect(pageCustomization.mixAndMatchConfig.generalSettings.bundleUpsellButtonTextColor).toBe("#070707");
    expect(pageCustomization.generalSettings.bundleUpsellFontColor).toBe("#080808");
  });

  it("declares both WPB bundle types as Settings Design save targets", () => {
    expect(SETTINGS_DESIGN_BUNDLE_TYPES).toEqual(["product_page", "full_page"]);
  });

  it("preserves unrelated pageCustomization roots while applying the Design patch", () => {
    const runtime = buildSettingsDesignRuntime(makePayload(), {
      banners: { landingPageImageSrc: "https://cdn.example.test/banner.webp" },
      mixAndMatchData: { redirectToCartEnabled: true },
      generalSettings: { customBehaviorFlag: true },
    });
    const pageCustomization = runtime.pageCustomization as any;

    expect(pageCustomization.banners.landingPageImageSrc).toBe("https://cdn.example.test/banner.webp");
    expect(pageCustomization.mixAndMatchData.redirectToCartEnabled).toBe(true);
    expect(pageCustomization.generalSettings.customBehaviorFlag).toBe(true);
    expect(pageCustomization.generalSettings.applyNewPageCustomization).toBe(true);
  });

  it("emits the EB quickSettings bridge alongside stylePresets", () => {
    const runtime = buildSettingsDesignRuntime(makePayload());
    const pageCustomization = runtime.pageCustomization as any;

    expect(pageCustomization.quickSettings).toEqual({
      isQuickSettingsEnabled: true,
      colors: {
        primaryColor: "#111111",
        buttonBgColor: "#111111",
        buttonTextColor: "#fafafa",
      },
    });
  });
});

describe("Settings Design CSS variable aliases", () => {
  it("emits EB PPB direct variables and consolidated bridge variables", () => {
    const runtime = buildSettingsDesignRuntime(makePayload());
    const css = generateCSSFromSettings(runtime.cssSettings as any, "product_page");

    expectGeneratedCssToInclude(css, [
      "--product-card-bg-color: #ffffff",
      "--product-card-border-radius: 11px",
      "--product-card-image-border-radius: 9px",
      "--product-card-image-fit: contain",
      "--product-card-title-color: #222222",
      "--product-card-title-font: 18px",
      "--product-card-title-weight: 700",
      "--product-card-button-bg-color: #111111",
      "--product-card-button-text-color: #fafafa",
      "--tabs-active-bg-color: #111111",
      "--tabs-inactive-bg-color: #dddddd",
      "--footer-next-btn-bg-color: #111111",
      "--footer-next-btn-text-color: #fafafa",
      "--empty-state-card-bg-color: #ffffff",
      'body[wpb-mix-consolidated-design="true"]',
      "--wpbMix-primary-color: var(--product-card-button-bg-color, #111111)",
      "--wpbMix-button-border-radius: var(--product-card-button-border-radius, 7px)",
    ]);
  });

  it("emits the EB PDP_INPAGE font-size adjustment", () => {
    const runtime = buildSettingsDesignRuntime(makePayload());
    const css = generateCSSFromSettings(runtime.cssSettings as any, "product_page");

    expectGeneratedCssToInclude(css, [
      'body[wpb-mix-consolidated-design="true"][wpbmix-template-type="PDP_INPAGE"]',
      "--wpbMix-primary-font-size: calc(var(--product-card-title-font, 16px) - 2px)",
      "--wpbMix-body-font-size: calc(var(--product-card-variant-selector-font-size, 14px) - 2px)",
    ]);
  });
});
