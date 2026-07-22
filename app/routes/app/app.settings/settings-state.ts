import {
  CONTROL_LAYOUTS,
  DESIGN_CONFIGURATION,
  EXPERT_COLOR_CONTROLS,
  LANGUAGE_CONFIGURATION,
  type SettingsField,
} from "../../../lib/admin-configuration-surfaces";

export function getInitialLanguageFieldValues() {
  return Object.fromEntries(
    [
      ...LANGUAGE_CONFIGURATION.sharedCartFields,
      ...LANGUAGE_CONFIGURATION.productCardFields,
      ...Object.values(LANGUAGE_CONFIGURATION.templateFields).flatMap((groups) =>
        groups.flatMap((group) => group.fields),
      ),
      ...Object.values(LANGUAGE_CONFIGURATION.productPageTemplateFields).flatMap((groups) =>
        groups.flatMap((group) => group.fields),
      ),
    ].map((field) => [
      getFieldValueKey(field),
      field.value ?? "",
    ]),
  ) as Record<string, string>;
}

export function getInitialControlFieldValues() {
  return Object.fromEntries(
    CONTROL_LAYOUTS.flatMap((layout) => layout.tabs.flatMap((tab) => tab.fields.map((field) => [
      field.label,
      field.value ?? "",
    ]))),
  ) as Record<string, string>;
}

export function getInitialDesignFieldValues() {
  return Object.fromEntries(
    [
      ...DESIGN_CONFIGURATION.flatMap((tab) => tab.fields),
      ...Object.values(EXPERT_COLOR_CONTROLS).flat(),
    ].map((field) => [
      field.key ?? field.label,
      field.value ?? "",
    ]),
  ) as Record<string, string>;
}

export function getFieldValueKey(field: SettingsField) {
  return field.key ?? field.label;
}

const DESIGN_PREVIEW_VARIABLES: Record<string, string[]> = {
  "Primary Color": ["--bundle-global-primary-button", "--bundle-button-bg"],
  "Button Text Color": ["--bundle-global-button-text", "--bundle-button-text-color"],
  "Primary Text Color": ["--bundle-global-primary-text", "--bundle-product-card-font-color"],
  "Secondary Color": ["--bundle-tabs-inactive-bg-color", "--bundle-footer-total-bg"],
  "Product Background Color": ["--bundle-product-card-bg", "--bundle-footer-bg"],
  "Primary Font Size": ["--bundle-product-card-font-size", "--bundle-product-final-price-font-size"],
  "Secondary Font Size": ["--bundle-product-strike-font-size"],
  "Body Font Size": ["--bundle-variant-selector-font-size"],
  "Bundle Buttons Base": ["--bundle-button-border-radius", "--bundle-footer-next-button-radius"],
  "Product Card & Cart Base": ["--bundle-product-card-border-radius", "--bundle-footer-border-radius"],
  "Image Fit": ["--bundle-product-card-image-fit"],
  "expert.navigationBanner.navigationBannerStepCompletionColor": ["--bundle-step-timeline-completed-bg"],
  "expert.navigationBanner.navigationBannerStepTextColor": ["--bundle-step-timeline-name-color"],
  "expert.navigationBanner.navigationBannerStepProgressBarEmptyColor": ["--bundle-step-timeline-line-color"],
  "expert.navigationBanner.tabsActiveBgColor": ["--bundle-tabs-active-bg-color"],
  "expert.navigationBanner.tabsActiveTextColor": ["--bundle-tabs-active-text-color"],
  "expert.navigationBanner.tabsInactiveBgColor": ["--bundle-tabs-inactive-bg-color"],
  "expert.navigationBanner.tabsInactiveTextColor": ["--bundle-tabs-inactive-text-color"],
  "expert.productCard.productCardBgColor": ["--bundle-product-card-bg"],
  "expert.productCard.productCardTextColor": ["--bundle-product-card-font-color"],
  "expert.productCard.productCardButtonColor": ["--bundle-button-bg"],
  "expert.productCard.productCardButtonTextColor": ["--bundle-button-text-color"],
  "expert.cartFooter.cartFooterBgColor": ["--bundle-footer-bg"],
  "expert.cartFooter.cartFooterNextButtonColor": ["--bundle-footer-next-button-bg"],
  "expert.cartFooter.cartFooterNextButtonTextColor": ["--bundle-footer-next-button-text"],
};

function normalizeDesignPreviewValue(field: string, value: string) {
  const trimmed = value.trim();
  if (field.includes("Font Size") || field.endsWith("Base")) {
    const unit = ["rem", "px", "em"].find((candidate) => trimmed.toLowerCase().endsWith(candidate));
    const numericValue = unit ? trimmed.slice(0, -unit.length) : trimmed;
    const parsedValue = Number(numericValue);
    if (!numericValue || !Number.isFinite(parsedValue) || parsedValue < 0 || parsedValue > 999) return null;
    return unit ? `${numericValue}${unit}` : `${numericValue}px`;
  }
  if (field === "Image Fit") {
    const fit = trimmed.toLowerCase();
    return fit === "cover" || fit === "contain" || fit === "fill" ? fit : null;
  }
  return /^(#[0-9a-f]{3,8}|rgba?\([\d\s,.%]+\)|transparent)$/i.test(trimmed) ? trimmed : null;
}

export function buildDesignPreviewVariables(fieldValues: Record<string, string>, isExpertControlsEnabled = false) {
  const variables: Record<string, string> = {};
  for (const [field, value] of Object.entries(fieldValues)) {
    if (field.startsWith("expert.") && !isExpertControlsEnabled) continue;
    const variableNames = DESIGN_PREVIEW_VARIABLES[field];
    if (!variableNames) continue;
    const normalizedValue = normalizeDesignPreviewValue(field, value);
    if (!normalizedValue) continue;
    for (const variableName of variableNames) variables[variableName] = normalizedValue;
  }
  return variables;
}
