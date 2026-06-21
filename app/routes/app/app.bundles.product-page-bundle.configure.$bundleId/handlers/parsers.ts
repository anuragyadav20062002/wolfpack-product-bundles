import { processCss } from "../../../../lib/css-sanitizer";

function str(formData: FormData, key: string): string | null {
  const val = formData.get(key);
  if (typeof val !== "string" || val.trim() === "") return null;
  return val;
}

function bool(formData: FormData, key: string, defaultVal: boolean): boolean {
  const val = formData.get(key);
  if (val === null) return defaultVal;
  return val === "true";
}

function int(formData: FormData, key: string): number | null {
  const val = formData.get(key);
  if (typeof val !== "string" || val.trim() === "") return null;
  const parsed = parseInt(val, 10);
  return isNaN(parsed) ? null : parsed;
}

function jsonObject<T extends Record<string, unknown> | null>(
  formData: FormData,
  key: string,
  defaultVal: T,
): T {
  const val = formData.get(key);
  if (typeof val !== "string" || val.trim() === "") return defaultVal;

  try {
    const parsed = JSON.parse(val) as unknown;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as T;
    }
  } catch {
    return defaultVal;
  }

  return defaultVal;
}

function normalizeSellingPlanSelectionShowFor(
  value: unknown,
): "ALL_PRODUCTS" | "OOS_PRODUCTS" {
  return value === "OOS_PRODUCTS" ? "OOS_PRODUCTS" : "ALL_PRODUCTS";
}

function normalizeIndividualSellingPlanSelection(formData: FormData) {
  const raw = jsonObject(formData, "individualSellingPlanSelection", {
    isEnabled: false,
    showFor: "ALL_PRODUCTS",
  });

  const isEnabled = raw?.isEnabled === true;
  const showFor = normalizeSellingPlanSelectionShowFor(
    (raw as { showFor?: unknown } | null)?.showFor,
  );

  return { isEnabled, showFor };
}

export function parseBundleDesignTemplate(formData: FormData) {
  return {
    bundleDesignTemplate: str(formData, "bundleDesignTemplate"),
    bundleDesignPresetId: str(formData, "bundleDesignPresetId"),
  };
}

export function parsePPBBundleVisibility(formData: FormData) {
  return {
    upsellWidgetEnabled: bool(formData, "upsellWidgetEnabled", false),
    upsellWidgetDisplayMode: str(formData, "upsellWidgetDisplayMode"),
    upsellWidgetDisplayOn: str(formData, "upsellWidgetDisplayOn"),
    autoSelectBrowsedProduct: bool(formData, "autoSelectBrowsedProduct", false),
  };
}

export function parsePPBBundleSettings(formData: FormData) {
  const rawCss = formData.get("bundleLevelCss");
  let bundleLevelCss: string | null = null;
  if (typeof rawCss === "string" && rawCss.trim() !== "") {
    const { sanitizedCss } = processCss(rawCss);
    bundleLevelCss = sanitizedCss.trim() || null;
  }

  return {
    preSelectedProductVariantId: str(formData, "preSelectedProductVariantId"),
    maxQtyPerProduct: int(formData, "maxQtyPerProduct"),
    variantSelectorEnabled: bool(formData, "variantSelectorEnabled", true),
    showTextOnAddButton: bool(formData, "showTextOnAddButton", false),
    bundleCartTitle: str(formData, "bundleCartTitle"),
    bundleCartSubtitle: str(formData, "bundleCartSubtitle"),
    bundleBannerDesktopUrl: str(formData, "bundleBannerDesktopUrl"),
    bundleBannerMobileUrl: str(formData, "bundleBannerMobileUrl"),
    bundleLevelCss,
    defaultProductsData: jsonObject(formData, "defaultProductsData", {}),
    boxSelection: jsonObject(formData, "boxSelection", null),
    bundleUpsellConfig: jsonObject(formData, "bundleUpsellConfig", null),
    bundleTextConfig: jsonObject(formData, "bundleTextConfig", null),
    discountDisplayOverride: jsonObject(
      formData,
      "discountDisplayOverride",
      null,
    ),
    individualSellingPlanSelection:
      normalizeIndividualSellingPlanSelection(formData),
    validateQuantityPerProduct: jsonObject(
      formData,
      "validateQuantityPerProduct",
      {
        isEnabled: false,
        allowedQuantity: 1,
      },
    ),
    useSingleStepCategoriesAsBundleSteps: bool(
      formData,
      "useSingleStepCategoriesAsBundleSteps",
      false,
    ),
  };
}
