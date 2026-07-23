import { BundleType } from "../constants/bundle";
import { parseSettingsDesignPayload } from "./settings-design-contract";

type JsonObject = Record<string, unknown>;

export const SETTINGS_DESIGN_BUNDLE_TYPES = [
  BundleType.PRODUCT_PAGE,
  BundleType.FULL_PAGE,
] as const;

const DEFAULT_STYLE_PRESETS = {
  colors: {
    primaryColor: "#000000",
    buttonTextColor: "#ffffff",
    primaryTextColor: "#000000",
    accentColor: "#eeeeee",
    backgroundColor: "#ffffff",
  },
  typography: {
    primaryFontSize: "16px",
    primaryFontWeight: "Bold",
    secondaryFontSize: "14px",
    secondaryFontWeight: "Bold",
    bodyFontSize: "14px",
    bodyFontWeight: "Regular",
  },
  corners: {
    buttonBorderRadius: "Base",
    baseBorderRadiusPx: 5,
    productCardBaseBorderRadius: 10,
    productCardBorderRadiusStyle: "Base",
  },
  images: {
    productImageFit: "cover",
  },
  isExpertControlsEnabled: false,
};

const BRAND_COLOR_TARGETS: Record<string, string[]> = {
  primaryColor: [
    "productCard.productCardButtonColor",
    "navigationBanner.navigationBannerStepProgressBarFilledColor",
    "navigationBanner.tabsActiveBgColor",
    "categoryBlock.tabActiveBgColor",
    "cartFooter.cartFooterNextButtonColor",
    "cartFooter.cartFooterNextButtonBorderColor",
    "cartFooter.cartFooterBackButtonBorderColor",
    "cartFooter.cartFooterDiscountProgressBarFilledColor",
    "generalSettings.bundleUpSellButtonBg",
    "generalSettings.bundleUpSellButtonBorderColor",
    "summaryBlock.summaryBlockAddToCartButtonColor",
    "summaryBlock.summaryBuildNewBoxButtonColor",
    "landingPage.landingPageButtonBgColor",
    "navigationBanner.navigationBannerStepCompletionColor",
    "mixAndMatchConfig.productCard.productCardButtonBgColor",
    "mixAndMatchConfig.footer.footerNextBtnBgColor",
    "mixAndMatchConfig.tabs.tabsActiveBgColor",
    "mixAndMatchConfig.emptyStateCard.emptyStateCardBorderColor",
    "mixAndMatchConfig.emptyStateCard.emptyStateCardIconColor",
    "mixAndMatchConfig.emptyStateCard.emptyStateCardTextColor",
    "mixAndMatchConfig.addBundleBtn.addBundleBtnBgColor",
    "mixAndMatchConfig.toast.toastBgColor",
    "mixAndMatchConfig.generalSettings.bundleUpsellButtonBg",
    "mixAndMatchConfig.footer.footerDiscountProgressBarFilledColor",
  ],
  buttonTextColor: [
    "productCard.productCardButtonTextColor",
    "productCard.quantitySelectorButtonTextColor",
    "navigationBanner.tabsActiveTextColor",
    "categoryBlock.tabActiveTextColor",
    "generalSettings.bundleUpsellTextColor",
    "summaryBlock.summaryBlockAddToCartButtonTextColor",
    "summaryBlock.summaryBuildNewBoxTextColor",
    "cartFooter.cartFooterNextButtonTextColor",
    "navigationBanner.navigationBannerStepDoneColor",
    "mixAndMatchConfig.productCard.productCardButtonTextColor",
    "mixAndMatchConfig.footer.footerNextBtnTextColor",
    "mixAndMatchConfig.tabs.tabsActiveTextColor",
    "mixAndMatchConfig.addBundleBtn.addBundleBtnTextColor",
    "mixAndMatchConfig.toast.toastTextColor",
    "mixAndMatchConfig.footer.footerTotalPriceAndQuantityPillBgColor",
    "mixAndMatchConfig.generalSettings.bundleUpsellButtonTextColor",
  ],
  primaryTextColor: [
    "productCard.productCardTextColor",
    "productCard.finalPriceFontColor",
    "navigationBanner.navigationBannerStepTextColor",
    "generalSettings.productPageTitleColor",
    "navigationBanner.tabsInactiveTextColor",
    "categoryBlock.tabInactiveTextColor",
    "cartFooter.cartFooterBackButtonTextColor",
    "cartFooter.cartFooterDiscountTextColor",
    "cartFooter.cartFooterTotalLabelColor",
    "cartFooter.cartFooterFinalPriceFontColor",
    "cartFooter.cartFooterTextColor",
    "generalSettings.bundleUpsellFontColor",
    "cartFooter.cartFooterDiscountedPriceColor",
    "productCard.compareAtPriceColor",
    "mixAndMatchConfig.productCard.productCardTitleColor",
    "mixAndMatchConfig.productCard.productCardPriceColor",
    "mixAndMatchConfig.productCard.productCardQuantityLabelColor",
    "mixAndMatchConfig.productCard.productCardVariantSelectorTextColor",
    "mixAndMatchConfig.bundleHeader.headerDiscountTextColor",
    "mixAndMatchConfig.footer.footerFinalPriceColor",
    "mixAndMatchConfig.footer.footerBackBtnTextColor",
    "mixAndMatchConfig.tabs.tabsInactiveTextColor",
    "mixAndMatchConfig.footer.footerTextColor",
    "mixAndMatchConfig.generalSettings.bundleUpsellFontColor",
    "mixAndMatchConfig.productCard.productCardComparedAtPriceColor",
  ],
  accentColor: [
    "navigationBanner.navigationBannerStepProgressBarEmptyColor",
    "navigationBanner.tabsInactiveBgColor",
    "categoryBlock.tabInactiveBgColor",
    "cartFooter.cartFooterDiscountProgressBarEmptyColor",
    "productCard.productCardQuantitySelectorBgColor",
    "mixAndMatchConfig.tabs.tabsInactiveBgColor",
    "mixAndMatchConfig.footer.footerDiscountProgressBarEmptyColor",
  ],
  backgroundColor: [
    "productCard.productCardBgColor",
    "cartFooter.cartFooterBgColor",
    "cartFooter.cartFooterButtonsContainerBgColor",
    "mixAndMatchConfig.emptyStateCard.emptyStateCardBgColor",
    "mixAndMatchConfig.footer.footerBgColor",
    "mixAndMatchConfig.productCard.productCardBgColor",
  ],
};

const TYPOGRAPHY_TARGETS: Record<string, string[]> = {
  primaryFontSize: [
    "productCard.productTitleFontSize",
    "navigationBanner.navigationBannerStepFontSize",
    "productCard.finalPriceFontSize",
    "mixAndMatchConfig.productCard.productCardTitleFont",
    "mixAndMatchConfig.productCard.productCardPriceFont",
    "mixAndMatchConfig.bundleHeader.headerConditionTextFont",
  ],
  primaryFontWeight: [
    "productCard.productTitleFontWeight",
    "productCard.finalPriceFontWeight",
    "mixAndMatchConfig.productCard.productCardTitleWeight",
    "mixAndMatchConfig.productCard.productCardPriceWeight",
  ],
  secondaryFontSize: [
    "productCard.compareAtPriceFontSize",
    "cartFooter.cartFooterDiscountMessageFontSize",
    "mixAndMatchConfig.productCard.productCardComparedAtPriceFont",
    "mixAndMatchConfig.bundleHeader.headerDiscountTextFont",
  ],
  secondaryFontWeight: [
    "productCard.compareAtPriceFontWeight",
    "cartFooter.cartFooterDiscountMessageFontWeight",
    "mixAndMatchConfig.productCard.productCardComparedAtPriceWeight",
    "mixAndMatchConfig.bundleHeader.headerDiscountTextWeight",
  ],
  bodyFontSize: [
    "productCard.productCardVariantSelectorFontSize",
    "mixAndMatchConfig.productCard.productCardVariantSelectorFontSize",
  ],
  bodyFontWeight: [
    "productCard.productCardVariantSelectorFontWeight",
    "mixAndMatchConfig.productCard.productCardVariantSelectorFontWeight",
  ],
};

const BUTTON_RADIUS_TARGETS = [
  "productCard.buttonBorderRadius",
  "productCard.quantitySelectorButtonBorderRadius",
  "cartFooter.cartFooterButtonsBorderRadius",
  "navigationBanner.tabsCornerRadius",
  "mixAndMatchConfig.productCard.productCardButtonBorderRadius",
  "mixAndMatchConfig.productCard.productCardQuantityButtonBorderRadius",
  "mixAndMatchConfig.footer.footerButtonsBorderRadius",
  "mixAndMatchConfig.addBundleBtn.addBundleBtnBorderRadius",
  "mixAndMatchConfig.tabs.tabsBorderRadius",
];

const CARD_RADIUS_TARGETS = [
  "productCard.cardBorderRadius",
  "cartFooter.cartFooterBorderRadius",
  "mixAndMatchConfig.productCard.productCardBorderRadius",
  "mixAndMatchConfig.footer.footerBorderRadius",
];

const IMAGE_RADIUS_TARGETS = [
  "productCard.cardImageBorderRadius",
  "cartFooter.cartFooterProductImageBorderRadius",
  "mixAndMatchConfig.productCard.productCardImageBorderRadius",
];

const IMAGE_FIT_TARGETS = [
  "productCard.productImageFit",
  "mixAndMatchConfig.productCard.productCardImageFit",
];

const EXPERT_TARGETS: Record<string, string[]> = {
  "expert.navigationBanner.navigationBannerStepCompletionColor": [
    "navigationBanner.navigationBannerStepCompletionColor",
  ],
  "expert.navigationBanner.navigationCheckColor": [
    "navigationBanner.navigationCheckColor",
  ],
  "expert.navigationBanner.navigationBannerStepTextColor": [
    "navigationBanner.navigationBannerStepTextColor",
  ],
  "expert.generalSettings.productPageTitleColor": [
    "generalSettings.productPageTitleColor",
  ],
  "expert.navigationBanner.navigationBannerStepProgressBarEmptyColor": [
    "navigationBanner.navigationBannerStepProgressBarEmptyColor",
  ],
  "expert.generalSettings.loadingBgColor": [
    "generalSettings.loadingBgColor",
  ],
  "expert.generalSettings.conditionToastBgColor": [
    "generalSettings.conditionToastBgColor",
    "mixAndMatchConfig.toast.toastBgColor",
  ],
  "expert.generalSettings.conditionToastTextColor": [
    "generalSettings.conditionToastTextColor",
    "mixAndMatchConfig.toast.toastTextColor",
  ],
  "expert.navigationBanner.tabsActiveBgColor": [
    "navigationBanner.tabsActiveBgColor",
    "categoryBlock.tabActiveBgColor",
    "mixAndMatchConfig.tabs.tabsActiveBgColor",
  ],
  "expert.navigationBanner.tabsActiveTextColor": [
    "navigationBanner.tabsActiveTextColor",
    "categoryBlock.tabActiveTextColor",
    "mixAndMatchConfig.tabs.tabsActiveTextColor",
  ],
  "expert.navigationBanner.tabsInactiveBgColor": [
    "navigationBanner.tabsInactiveBgColor",
    "categoryBlock.tabInactiveBgColor",
    "mixAndMatchConfig.tabs.tabsInactiveBgColor",
  ],
  "expert.navigationBanner.tabsInactiveTextColor": [
    "navigationBanner.tabsInactiveTextColor",
    "categoryBlock.tabInactiveTextColor",
    "mixAndMatchConfig.tabs.tabsInactiveTextColor",
  ],
  "expert.productCard.productCardBgColor": [
    "productCard.productCardBgColor",
    "mixAndMatchConfig.productCard.productCardBgColor",
  ],
  "expert.productCard.productCardTextColor": [
    "productCard.productCardTextColor",
    "mixAndMatchConfig.productCard.productCardTitleColor",
  ],
  "expert.productCard.productCardButtonColor": [
    "productCard.productCardButtonColor",
    "mixAndMatchConfig.productCard.productCardButtonBgColor",
  ],
  "expert.productCard.productCardButtonTextColor": [
    "productCard.productCardButtonTextColor",
    "mixAndMatchConfig.productCard.productCardButtonTextColor",
  ],
  "expert.emptyStateCard.emptyStateCardBorderColor": [
    "mixAndMatchConfig.emptyStateCard.emptyStateCardBorderColor",
    "mixAndMatchConfig.emptyStateCard.emptyStateCardIconColor",
  ],
  "expert.emptyStateCard.emptyStateCardTextColor": [
    "mixAndMatchConfig.emptyStateCard.emptyStateCardTextColor",
  ],
  "expert.cartFooter.cartFooterBgColor": [
    "cartFooter.cartFooterBgColor",
    "mixAndMatchConfig.footer.footerBgColor",
  ],
  "expert.cartFooter.cartFooterTextColor": [
    "cartFooter.cartFooterTextColor",
    "mixAndMatchConfig.footer.footerTextColor",
  ],
  "expert.cartFooter.cartFooterNextButtonColor": [
    "cartFooter.cartFooterNextButtonColor",
    "cartFooter.cartFooterNextButtonBorderColor",
    "mixAndMatchConfig.footer.footerNextBtnBgColor",
  ],
  "expert.cartFooter.cartFooterNextButtonTextColor": [
    "cartFooter.cartFooterNextButtonTextColor",
    "mixAndMatchConfig.footer.footerNextBtnTextColor",
  ],
  "expert.cartFooter.cartFooterBackButtonColor": [
    "cartFooter.cartFooterBackButtonColor",
  ],
  "expert.cartFooter.cartFooterBackButtonTextColor": [
    "cartFooter.cartFooterBackButtonTextColor",
    "mixAndMatchConfig.footer.footerBackBtnTextColor",
  ],
  "expert.cartFooter.cartFooterDiscountTextColor": [
    "cartFooter.cartFooterDiscountTextColor",
    "mixAndMatchConfig.bundleHeader.headerDiscountTextColor",
  ],
  "expert.cartFooter.cartFooterDiscountProgressBarEmptyColor": [
    "cartFooter.cartFooterDiscountProgressBarEmptyColor",
    "mixAndMatchConfig.footer.footerDiscountProgressBarEmptyColor",
  ],
  "expert.cartFooter.cartFooterDiscountProgressBarFilledColor": [
    "cartFooter.cartFooterDiscountProgressBarFilledColor",
    "mixAndMatchConfig.footer.footerDiscountProgressBarFilledColor",
  ],
  "expert.mixAndMatchConfig.generalSettings.bundleUpsellButtonBg": [
    "generalSettings.bundleUpSellButtonBg",
    "generalSettings.bundleUpSellButtonBorderColor",
    "mixAndMatchConfig.generalSettings.bundleUpsellButtonBg",
  ],
  "expert.mixAndMatchConfig.generalSettings.bundleUpsellButtonTextColor": [
    "generalSettings.bundleUpsellTextColor",
    "mixAndMatchConfig.generalSettings.bundleUpsellButtonTextColor",
  ],
  "expert.mixAndMatchConfig.generalSettings.bundleUpsellFontColor": [
    "generalSettings.bundleUpsellFontColor",
    "mixAndMatchConfig.generalSettings.bundleUpsellFontColor",
  ],
};

function setPath(target: JsonObject, path: string, value: unknown) {
  const parts = path.split(".");
  const key = parts.pop();
  if (!key) return;

  let current = target;
  for (const part of parts) {
    if (!current[part] || typeof current[part] !== "object") {
      current[part] = {};
    }
    current = current[part] as JsonObject;
  }
  current[key] = value;
}

function mergeJsonObject(base: JsonObject, patch: JsonObject): JsonObject {
  const merged: JsonObject = { ...base };
  for (const [key, value] of Object.entries(patch)) {
    if (value && typeof value === "object" && !Array.isArray(value)) {
      const current = merged[key];
      merged[key] = mergeJsonObject(
        current && typeof current === "object" && !Array.isArray(current) ? current as JsonObject : {},
        value as JsonObject,
      );
      continue;
    }
    merged[key] = value;
  }
  return merged;
}

function getField(fieldValues: Record<string, unknown>, key: string, fallback: string) {
  const value = fieldValues[key];
  if (value === null || value === undefined || value === "") {
    return fallback;
  }
  return String(value);
}

function normalizePx(value: string, fallback: string) {
  const cleaned = value.trim();
  if (!cleaned) return fallback;
  if (cleaned.toLowerCase().endsWith("px")) return cleaned;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? `${parsed}px` : fallback;
}

function numberFromPx(value: string, fallback: number) {
  const parsed = Number(String(value).replace(/px$/i, "").trim());
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeWeight(value: string, fallback: "Regular" | "Bold") {
  return value.toLowerCase() === "bold" ? "Bold" : value.toLowerCase() === "regular" ? "Regular" : fallback;
}

function weightToNumber(value: string) {
  return value === "Bold" ? 700 : 400;
}

function normalizeImageFit(value: string) {
  const fit = value.trim().toLowerCase();
  return fit === "contain" || fit === "fill" ? fit : "cover";
}

function normalizeRadiusStyle(value: string, allowRound: boolean) {
  const cleaned = value.trim().toLowerCase();
  if (cleaned === "sharp") return "Sharp";
  if (allowRound && cleaned === "round") return "Round";
  return "Base";
}

function radiusForStyle(style: string, basePx: number) {
  if (style === "Sharp") return "0px";
  if (style === "Round") return "40px";
  return `${Math.max(0, basePx)}px`;
}

function imageRadiusFromBase(basePx: number) {
  const radius = Math.max(0, basePx);
  return `${radius <= 2 ? 2 : radius - 2}px`;
}

function applyMapping(target: JsonObject, mapping: Record<string, string[]>, values: Record<string, string>) {
  Object.entries(values).forEach(([key, value]) => {
    mapping[key]?.forEach((path) => setPath(target, path, value));
  });
}

function flattenRuntimeSettings(designSettings: JsonObject, pageCustomization: JsonObject) {
  return {
    ...designSettings,
    ...(designSettings.globalColorsSettings as JsonObject),
    ...(designSettings.footerSettings as JsonObject),
    ...(designSettings.stepBarSettings as JsonObject),
    ...(designSettings.generalSettings as JsonObject),
    pageCustomization,
  };
}

export function buildSettingsDesignRuntime(payload: unknown, currentPageCustomization: JsonObject = {}) {
  const parsedPayload = parseSettingsDesignPayload(payload);
  const fieldValues = parsedPayload.fieldValues;
  const isExpertControlsEnabled = parsedPayload.isExpertControlsEnabled;

  const primaryColor = getField(fieldValues, "Primary Color", DEFAULT_STYLE_PRESETS.colors.primaryColor);
  const buttonTextColor = getField(fieldValues, "Button Text Color", DEFAULT_STYLE_PRESETS.colors.buttonTextColor);
  const primaryTextColor = getField(fieldValues, "Primary Text Color", DEFAULT_STYLE_PRESETS.colors.primaryTextColor);
  const accentColor = getField(fieldValues, "Secondary Color", DEFAULT_STYLE_PRESETS.colors.accentColor);
  const backgroundColor = getField(fieldValues, "Product Background Color", DEFAULT_STYLE_PRESETS.colors.backgroundColor);
  const primaryFontSize = normalizePx(getField(fieldValues, "Primary Font Size", DEFAULT_STYLE_PRESETS.typography.primaryFontSize), DEFAULT_STYLE_PRESETS.typography.primaryFontSize);
  const primaryFontWeight = normalizeWeight(getField(fieldValues, "Primary Font Weight", DEFAULT_STYLE_PRESETS.typography.primaryFontWeight), "Bold");
  const secondaryFontSize = normalizePx(getField(fieldValues, "Secondary Font Size", DEFAULT_STYLE_PRESETS.typography.secondaryFontSize), DEFAULT_STYLE_PRESETS.typography.secondaryFontSize);
  const secondaryFontWeight = normalizeWeight(getField(fieldValues, "Secondary Font Weight", DEFAULT_STYLE_PRESETS.typography.secondaryFontWeight), "Bold");
  const bodyFontSize = normalizePx(getField(fieldValues, "Body Font Size", DEFAULT_STYLE_PRESETS.typography.bodyFontSize), DEFAULT_STYLE_PRESETS.typography.bodyFontSize);
  const bodyFontWeight = normalizeWeight(getField(fieldValues, "Body Font Weight", DEFAULT_STYLE_PRESETS.typography.bodyFontWeight), "Regular");
  const buttonRadiusStyle = normalizeRadiusStyle(getField(fieldValues, "Bundle Buttons Corner Style", DEFAULT_STYLE_PRESETS.corners.buttonBorderRadius), true);
  const buttonRadiusBase = numberFromPx(getField(fieldValues, "Bundle Buttons Base", `${DEFAULT_STYLE_PRESETS.corners.baseBorderRadiusPx}px`), DEFAULT_STYLE_PRESETS.corners.baseBorderRadiusPx);
  const cardRadiusStyle = normalizeRadiusStyle(getField(fieldValues, "Product Card & Cart Corner Style", DEFAULT_STYLE_PRESETS.corners.productCardBorderRadiusStyle), false);
  const cardRadiusBase = numberFromPx(getField(fieldValues, "Product Card & Cart Base", `${DEFAULT_STYLE_PRESETS.corners.productCardBaseBorderRadius}px`), DEFAULT_STYLE_PRESETS.corners.productCardBaseBorderRadius);
  const productImageFit = normalizeImageFit(getField(fieldValues, "Image Fit", DEFAULT_STYLE_PRESETS.images.productImageFit));
  const buttonRadius = radiusForStyle(buttonRadiusStyle, buttonRadiusBase);
  const cardRadius = radiusForStyle(cardRadiusStyle, cardRadiusBase);
  const cardImageRadius = imageRadiusFromBase(cardRadiusBase);

  const designPatch: JsonObject = {};

  applyMapping(designPatch, BRAND_COLOR_TARGETS, {
    primaryColor,
    buttonTextColor,
    primaryTextColor,
    accentColor,
    backgroundColor,
  });
  applyMapping(designPatch, TYPOGRAPHY_TARGETS, {
    primaryFontSize,
    primaryFontWeight,
    secondaryFontSize,
    secondaryFontWeight,
    bodyFontSize,
    bodyFontWeight,
  });
  BUTTON_RADIUS_TARGETS.forEach((path) => setPath(designPatch, path, buttonRadius));
  CARD_RADIUS_TARGETS.forEach((path) => setPath(designPatch, path, cardRadius));
  IMAGE_RADIUS_TARGETS.forEach((path) => setPath(designPatch, path, cardImageRadius));
  IMAGE_FIT_TARGETS.forEach((path) => setPath(designPatch, path, productImageFit));

  if (isExpertControlsEnabled) {
    Object.entries(EXPERT_TARGETS).forEach(([fieldKey, paths]) => {
      const value = fieldValues[fieldKey];
      if (value === null || value === undefined || value === "") {
        return;
      }
      paths.forEach((path) => setPath(designPatch, path, String(value)));
    });
  }

  designPatch.stylePresets = {
    colors: {
      primaryColor,
      buttonTextColor,
      primaryTextColor,
      accentColor,
      backgroundColor,
    },
    typography: {
      primaryFontSize,
      primaryFontWeight,
      secondaryFontSize,
      secondaryFontWeight,
      bodyFontSize,
      bodyFontWeight,
    },
    corners: {
      buttonBorderRadius: buttonRadiusStyle,
      baseBorderRadiusPx: buttonRadiusBase,
      productCardBaseBorderRadius: cardRadiusBase,
      productCardBorderRadiusStyle: cardRadiusStyle,
    },
    images: {
      productImageFit,
    },
    isExpertControlsEnabled,
  };
  designPatch.quickSettings = {
    isQuickSettingsEnabled: true,
    colors: {
      primaryColor,
      buttonBgColor: primaryColor,
      buttonTextColor,
    },
  };
  setPath(designPatch, "generalSettings.applyNewPageCustomization", true);

  const pageCustomization = mergeJsonObject(currentPageCustomization, designPatch);

  const designSettings: JsonObject = {
    globalColorsSettings: {
      globalPrimaryButtonColor: primaryColor,
      globalButtonTextColor: buttonTextColor,
      globalPrimaryTextColor: primaryTextColor,
      globalSecondaryTextColor: accentColor,
      globalFooterBgColor: backgroundColor,
      globalFooterTextColor: primaryTextColor,
    },
    productCardBgColor: String((pageCustomization.productCard as JsonObject).productCardBgColor ?? backgroundColor),
    productCardFontColor: String((pageCustomization.productCard as JsonObject).productCardTextColor ?? primaryTextColor),
    productCardFontSize: numberFromPx(primaryFontSize, 16),
    productCardFontWeight: weightToNumber(primaryFontWeight),
    productCardImageFit: productImageFit,
    productCardBorderRadius: numberFromPx(cardRadius, 10),
    productImageBorderRadius: numberFromPx(cardImageRadius, 8),
    productFinalPriceColor: String((pageCustomization.productCard as JsonObject).finalPriceFontColor ?? primaryTextColor),
    productFinalPriceFontSize: numberFromPx(secondaryFontSize, 14),
    productFinalPriceFontWeight: weightToNumber(secondaryFontWeight),
    productStrikePriceColor: String((pageCustomization.productCard as JsonObject).compareAtPriceColor ?? primaryTextColor),
    productStrikeFontSize: numberFromPx(secondaryFontSize, 14),
    productStrikeFontWeight: weightToNumber(secondaryFontWeight),
    buttonBgColor: String((pageCustomization.productCard as JsonObject).productCardButtonColor ?? primaryColor),
    buttonTextColor: String((pageCustomization.productCard as JsonObject).productCardButtonTextColor ?? buttonTextColor),
    buttonBorderRadius: numberFromPx(buttonRadius, 5),
    quantitySelectorBgColor: String((pageCustomization.productCard as JsonObject).productCardQuantitySelectorBgColor ?? accentColor),
    quantitySelectorTextColor: String((pageCustomization.productCard as JsonObject).quantitySelectorButtonTextColor ?? buttonTextColor),
    quantitySelectorBorderRadius: numberFromPx(buttonRadius, 5),
    variantSelectorTextColor: primaryTextColor,
    footerSettings: {
      footerBgColor: String((pageCustomization.cartFooter as JsonObject).cartFooterBgColor ?? backgroundColor),
      footerFinalPriceColor: String((pageCustomization.cartFooter as JsonObject).cartFooterFinalPriceFontColor ?? primaryTextColor),
      footerBackButtonBgColor: String((pageCustomization.cartFooter as JsonObject).cartFooterBackButtonColor ?? "#6d7175"),
      footerBackButtonTextColor: String((pageCustomization.cartFooter as JsonObject).cartFooterBackButtonTextColor ?? primaryTextColor),
      footerBackButtonBorderColor: String((pageCustomization.cartFooter as JsonObject).cartFooterBackButtonBorderColor ?? primaryColor),
      footerBackButtonBorderRadius: numberFromPx(buttonRadius, 5),
      footerNextButtonBgColor: String((pageCustomization.cartFooter as JsonObject).cartFooterNextButtonColor ?? primaryColor),
      footerNextButtonTextColor: String((pageCustomization.cartFooter as JsonObject).cartFooterNextButtonTextColor ?? buttonTextColor),
      footerNextButtonBorderColor: String((pageCustomization.cartFooter as JsonObject).cartFooterNextButtonBorderColor ?? primaryColor),
      footerNextButtonBorderRadius: numberFromPx(buttonRadius, 5),
      footerBorderRadius: numberFromPx(cardRadius, 10),
    },
    stepBarSettings: {
      tabsActiveBgColor: String((pageCustomization.navigationBanner as JsonObject).tabsActiveBgColor ?? primaryColor),
      tabsActiveTextColor: String((pageCustomization.navigationBanner as JsonObject).tabsActiveTextColor ?? buttonTextColor),
      tabsInactiveBgColor: String((pageCustomization.navigationBanner as JsonObject).tabsInactiveBgColor ?? accentColor),
      tabsInactiveTextColor: String((pageCustomization.navigationBanner as JsonObject).tabsInactiveTextColor ?? primaryTextColor),
      tabsBorderRadius: numberFromPx(buttonRadius, 5),
    },
    generalSettings: {
      pageCustomization,
      emptyStateCardBgColor: String(((pageCustomization.mixAndMatchConfig as JsonObject).emptyStateCard as JsonObject)?.emptyStateCardBgColor ?? backgroundColor),
      emptyStateCardBorderColor: String(((pageCustomization.mixAndMatchConfig as JsonObject).emptyStateCard as JsonObject)?.emptyStateCardBorderColor ?? primaryColor),
      emptyStateTextColor: String(((pageCustomization.mixAndMatchConfig as JsonObject).emptyStateCard as JsonObject)?.emptyStateCardTextColor ?? primaryColor),
      productPageTitleFontColor: String((pageCustomization.generalSettings as JsonObject).productPageTitleColor ?? primaryTextColor),
      toastBgColor: String((pageCustomization.generalSettings as JsonObject).conditionToastBgColor ?? primaryColor),
      toastTextColor: String((pageCustomization.generalSettings as JsonObject).conditionToastTextColor ?? buttonTextColor),
      bundleUpsellButtonBgColor: String((pageCustomization.generalSettings as JsonObject).bundleUpSellButtonBg ?? primaryColor),
      bundleUpsellBorderColor: String((pageCustomization.generalSettings as JsonObject).bundleUpSellButtonBorderColor ?? primaryColor),
      bundleUpsellTextColor: String((pageCustomization.generalSettings as JsonObject).bundleUpsellTextColor ?? buttonTextColor),
    },
  };

  return {
    pageCustomization,
    designSettings,
    cssSettings: flattenRuntimeSettings(designSettings, pageCustomization),
  };
}
