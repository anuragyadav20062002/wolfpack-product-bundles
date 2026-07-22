import type { CSSProperties } from "react";
import type {
  BundleContractType,
  TemplateKey,
} from "../../../lib/bundle-config/template-selection";
import { buildSettingsDesignRuntime } from "../../../lib/settings-design-runtime";

export type DesignPreviewMode = "builder" | "loading" | "validation" | "upsell";
export type DesignPreviewFamily = "full-page" | "product-page";
export type DesignPreviewNavigation = "timeline" | "compact-timeline" | "tabs" | "accordion" | "none";
export type DesignPreviewProducts = "card-grid" | "overlay-grid" | "card-rows" | "product-list" | "product-grid" | "horizontal-slots" | "vertical-slots";
export type DesignPreviewSummary = "rows" | "slot-grid" | "compact-slots" | "pdp-footer";

export type DesignPreviewTemplateDescriptor = {
  key: TemplateKey;
  bundleType: BundleContractType;
  translationKey: string;
  family: DesignPreviewFamily;
  navigation: DesignPreviewNavigation;
  products: DesignPreviewProducts;
  summary: DesignPreviewSummary;
};

export type DesignPreviewFieldTarget = {
  mode: DesignPreviewMode;
  elements: readonly string[];
  templates?: readonly TemplateKey[];
};

export type DesignPreviewTheme = CSSProperties & Record<`--preview-${string}`, string>;

const PRODUCT_PAGE_TEMPLATES: readonly TemplateKey[] = ["product-list", "product-grid", "horizontal-slots", "vertical-slots"];
const SLOT_TEMPLATES: readonly TemplateKey[] = ["horizontal-slots", "vertical-slots"];
const STEP_TEMPLATES: readonly TemplateKey[] = ["standard", "compact", "product-grid"];
const TAB_TEMPLATES: readonly TemplateKey[] = ["classic", "compact", "horizontal"];

export const DESIGN_PREVIEW_TEMPLATES: readonly DesignPreviewTemplateDescriptor[] = [
  { key: "standard", bundleType: "full_page", translationKey: "settingsDcp.preview.templates.standard", family: "full-page", navigation: "timeline", products: "card-grid", summary: "rows" },
  { key: "classic", bundleType: "full_page", translationKey: "settingsDcp.preview.templates.classic", family: "full-page", navigation: "tabs", products: "card-grid", summary: "slot-grid" },
  { key: "compact", bundleType: "full_page", translationKey: "settingsDcp.preview.templates.compact", family: "full-page", navigation: "compact-timeline", products: "overlay-grid", summary: "compact-slots" },
  { key: "horizontal", bundleType: "full_page", translationKey: "settingsDcp.preview.templates.horizontal", family: "full-page", navigation: "tabs", products: "card-rows", summary: "rows" },
  { key: "product-list", bundleType: "product_page", translationKey: "settingsDcp.preview.templates.productList", family: "product-page", navigation: "none", products: "product-list", summary: "pdp-footer" },
  { key: "product-grid", bundleType: "product_page", translationKey: "settingsDcp.preview.templates.productGrid", family: "product-page", navigation: "accordion", products: "product-grid", summary: "pdp-footer" },
  { key: "horizontal-slots", bundleType: "product_page", translationKey: "settingsDcp.preview.templates.horizontalSlots", family: "product-page", navigation: "none", products: "horizontal-slots", summary: "pdp-footer" },
  { key: "vertical-slots", bundleType: "product_page", translationKey: "settingsDcp.preview.templates.verticalSlots", family: "product-page", navigation: "none", products: "vertical-slots", summary: "pdp-footer" },
] as const;

const builderTarget = (...elements: string[]): DesignPreviewFieldTarget => ({ mode: "builder", elements });
const modeTarget = (mode: DesignPreviewMode, ...elements: string[]): DesignPreviewFieldTarget => ({ mode, elements });
const templateTarget = (
  templates: readonly TemplateKey[],
  ...elements: string[]
): DesignPreviewFieldTarget => ({ mode: "builder", elements, templates });

export const DESIGN_PREVIEW_FIELD_TARGETS: Readonly<Record<string, DesignPreviewFieldTarget>> = {
  "Primary Color": builderTarget("product action", "active navigation", "progress", "cart action"),
  "Button Text Color": builderTarget("action text", "active navigation text"),
  "Primary Text Color": builderTarget("product text", "prices", "navigation", "cart text"),
  "Secondary Color": builderTarget("inactive navigation", "empty progress", "quantity controls"),
  "Product Background Color": builderTarget("product cards", "cart", "empty slots"),
  "Primary Font Size": builderTarget("product titles", "primary prices", "step text"),
  "Primary Font Weight": builderTarget("product titles", "primary prices"),
  "Secondary Font Size": builderTarget("compare-at prices", "discount text"),
  "Secondary Font Weight": builderTarget("compare-at prices", "discount text"),
  "Body Font Size": builderTarget("variant labels", "supporting text"),
  "Body Font Weight": builderTarget("variant labels", "supporting text"),
  "Bundle Buttons Corner Style": builderTarget("buttons", "tabs"),
  "Bundle Buttons Base": builderTarget("buttons", "tabs"),
  "Product Card & Cart Corner Style": builderTarget("product cards", "cart"),
  "Product Card & Cart Base": builderTarget("product cards", "cart", "product images"),
  "Image Fit": builderTarget("product images"),
  "expert.navigationBanner.navigationBannerStepCompletionColor": { ...builderTarget("completed steps"), templates: STEP_TEMPLATES },
  "expert.navigationBanner.navigationCheckColor": { ...builderTarget("completed step checks"), templates: STEP_TEMPLATES },
  "expert.navigationBanner.navigationBannerStepTextColor": { ...builderTarget("step labels"), templates: STEP_TEMPLATES },
  "expert.generalSettings.productPageTitleColor": templateTarget(PRODUCT_PAGE_TEMPLATES, "product-page title"),
  "expert.navigationBanner.navigationBannerStepProgressBarEmptyColor": { ...builderTarget("step progress"), templates: STEP_TEMPLATES },
  "expert.generalSettings.loadingBgColor": modeTarget("loading", "loading screen"),
  "expert.generalSettings.conditionToastBgColor": modeTarget("validation", "condition toast"),
  "expert.generalSettings.conditionToastTextColor": modeTarget("validation", "condition toast text"),
  "expert.navigationBanner.tabsActiveBgColor": { ...builderTarget("active tabs"), templates: TAB_TEMPLATES },
  "expert.navigationBanner.tabsActiveTextColor": { ...builderTarget("active tab text"), templates: TAB_TEMPLATES },
  "expert.navigationBanner.tabsInactiveBgColor": { ...builderTarget("inactive tabs"), templates: TAB_TEMPLATES },
  "expert.navigationBanner.tabsInactiveTextColor": { ...builderTarget("inactive tab text"), templates: TAB_TEMPLATES },
  "expert.productCard.productCardBgColor": builderTarget("product cards"),
  "expert.productCard.productCardTextColor": builderTarget("product titles"),
  "expert.productCard.productCardButtonColor": builderTarget("product actions"),
  "expert.productCard.productCardButtonTextColor": builderTarget("product action text"),
  "expert.emptyStateCard.emptyStateCardBorderColor": templateTarget(SLOT_TEMPLATES, "empty slot border", "empty slot icon"),
  "expert.emptyStateCard.emptyStateCardTextColor": templateTarget(SLOT_TEMPLATES, "empty slot text"),
  "expert.cartFooter.cartFooterBgColor": builderTarget("cart"),
  "expert.cartFooter.cartFooterTextColor": builderTarget("cart text"),
  "expert.cartFooter.cartFooterNextButtonColor": builderTarget("next action"),
  "expert.cartFooter.cartFooterNextButtonTextColor": builderTarget("next action text"),
  "expert.cartFooter.cartFooterBackButtonColor": builderTarget("back action"),
  "expert.cartFooter.cartFooterBackButtonTextColor": builderTarget("back action text"),
  "expert.cartFooter.cartFooterDiscountTextColor": builderTarget("discount message"),
  "expert.cartFooter.cartFooterDiscountProgressBarEmptyColor": builderTarget("discount progress remainder"),
  "expert.cartFooter.cartFooterDiscountProgressBarFilledColor": builderTarget("discount progress fill"),
  "expert.mixAndMatchConfig.generalSettings.bundleUpsellButtonBg": modeTarget("upsell", "upsell action"),
  "expert.mixAndMatchConfig.generalSettings.bundleUpsellButtonTextColor": modeTarget("upsell", "upsell action text"),
  "expert.mixAndMatchConfig.generalSettings.bundleUpsellFontColor": modeTarget("upsell", "upsell text"),
};

type JsonObject = Record<string, unknown>;

function readPath(source: JsonObject, path: string, fallback: string) {
  let current: unknown = source;
  for (const segment of path.split(".")) {
    if (!current || typeof current !== "object" || Array.isArray(current)) return fallback;
    current = (current as JsonObject)[segment];
  }
  return current === null || current === undefined || current === "" ? fallback : String(current);
}

function weightValue(value: string) {
  return value.toLowerCase() === "bold" ? "700" : "400";
}

export function getDesignPreviewTemplate(templateKey: TemplateKey) {
  return DESIGN_PREVIEW_TEMPLATES.find((template) => template.key === templateKey);
}

export function getDesignPreviewFieldTarget(fieldKey: string) {
  return DESIGN_PREVIEW_FIELD_TARGETS[fieldKey];
}

export function isDesignPreviewFieldApplicable(fieldKey: string, templateKey: TemplateKey) {
  const target = getDesignPreviewFieldTarget(fieldKey);
  return !target?.templates || target.templates.includes(templateKey);
}

export function buildDesignPreviewTheme(
  fieldValues: Record<string, string>,
  isExpertControlsEnabled = false,
): DesignPreviewTheme {
  let runtime: ReturnType<typeof buildSettingsDesignRuntime>;
  try {
    runtime = buildSettingsDesignRuntime({ fieldValues, isExpertControlsEnabled });
  } catch {
    runtime = buildSettingsDesignRuntime({ fieldValues: {}, isExpertControlsEnabled });
  }
  const page = runtime.pageCustomization as JsonObject;
  const styles = page.stylePresets as JsonObject;

  return {
    "--preview-primary": readPath(styles, "colors.primaryColor", "#000000"),
    "--preview-button-text": readPath(styles, "colors.buttonTextColor", "#ffffff"),
    "--preview-primary-text": readPath(styles, "colors.primaryTextColor", "#000000"),
    "--preview-accent": readPath(styles, "colors.accentColor", "#eeeeee"),
    "--preview-product-bg": readPath(page, "productCard.productCardBgColor", "#ffffff"),
    "--preview-product-text": readPath(page, "productCard.productCardTextColor", "#000000"),
    "--preview-product-button-bg": readPath(page, "productCard.productCardButtonColor", "#000000"),
    "--preview-product-button-text": readPath(page, "productCard.productCardButtonTextColor", "#ffffff"),
    "--preview-primary-font-size": readPath(styles, "typography.primaryFontSize", "16px"),
    "--preview-primary-font-weight": weightValue(readPath(styles, "typography.primaryFontWeight", "Bold")),
    "--preview-secondary-font-size": readPath(styles, "typography.secondaryFontSize", "14px"),
    "--preview-secondary-font-weight": weightValue(readPath(styles, "typography.secondaryFontWeight", "Bold")),
    "--preview-body-font-size": readPath(styles, "typography.bodyFontSize", "14px"),
    "--preview-body-font-weight": weightValue(readPath(styles, "typography.bodyFontWeight", "Regular")),
    "--preview-button-radius": readPath(page, "productCard.buttonBorderRadius", "5px"),
    "--preview-card-radius": readPath(page, "productCard.cardBorderRadius", "10px"),
    "--preview-image-radius": readPath(page, "productCard.cardImageBorderRadius", "8px"),
    "--preview-image-fit": readPath(page, "productCard.productImageFit", "cover"),
    "--preview-step-completed": readPath(page, "navigationBanner.navigationBannerStepCompletionColor", "#000000"),
    "--preview-step-check": readPath(page, "navigationBanner.navigationCheckColor", "#ffffff"),
    "--preview-step-text": readPath(page, "navigationBanner.navigationBannerStepTextColor", "#000000"),
    "--preview-step-empty": readPath(page, "navigationBanner.navigationBannerStepProgressBarEmptyColor", "#cccccc"),
    "--preview-page-title": readPath(page, "generalSettings.productPageTitleColor", "#000000"),
    "--preview-loading-bg": readPath(page, "generalSettings.loadingBgColor", "rgba(255,255,255,0.92)"),
    "--preview-toast-bg": readPath(page, "generalSettings.conditionToastBgColor", "#000000"),
    "--preview-toast-text": readPath(page, "generalSettings.conditionToastTextColor", "#ffffff"),
    "--preview-tab-active-bg": readPath(page, "navigationBanner.tabsActiveBgColor", "#000000"),
    "--preview-tab-active-text": readPath(page, "navigationBanner.tabsActiveTextColor", "#ffffff"),
    "--preview-tab-inactive-bg": readPath(page, "navigationBanner.tabsInactiveBgColor", "#eeeeee"),
    "--preview-tab-inactive-text": readPath(page, "navigationBanner.tabsInactiveTextColor", "#000000"),
    "--preview-empty-bg": readPath(page, "mixAndMatchConfig.emptyStateCard.emptyStateCardBgColor", "#ffffff"),
    "--preview-empty-border": readPath(page, "mixAndMatchConfig.emptyStateCard.emptyStateCardBorderColor", "#000000"),
    "--preview-empty-text": readPath(page, "mixAndMatchConfig.emptyStateCard.emptyStateCardTextColor", "#3e3e3e"),
    "--preview-cart-bg": readPath(page, "cartFooter.cartFooterBgColor", "#ffffff"),
    "--preview-cart-text": readPath(page, "cartFooter.cartFooterTextColor", "#000000"),
    "--preview-cart-next-bg": readPath(page, "cartFooter.cartFooterNextButtonColor", "#000000"),
    "--preview-cart-next-text": readPath(page, "cartFooter.cartFooterNextButtonTextColor", "#ffffff"),
    "--preview-cart-back-bg": readPath(page, "cartFooter.cartFooterBackButtonColor", "#6d7175"),
    "--preview-cart-back-text": readPath(page, "cartFooter.cartFooterBackButtonTextColor", "#000000"),
    "--preview-discount-text": readPath(page, "cartFooter.cartFooterDiscountTextColor", "#000000"),
    "--preview-discount-progress-empty": readPath(page, "cartFooter.cartFooterDiscountProgressBarEmptyColor", "#c1e7c5"),
    "--preview-discount-progress-filled": readPath(page, "cartFooter.cartFooterDiscountProgressBarFilledColor", "#15a524"),
    "--preview-upsell-button-bg": readPath(page, "generalSettings.bundleUpSellButtonBg", "#000000"),
    "--preview-upsell-button-text": readPath(page, "generalSettings.bundleUpsellTextColor", "#ffffff"),
    "--preview-upsell-text": readPath(page, "generalSettings.bundleUpsellFontColor", "#000000"),
  };
}
