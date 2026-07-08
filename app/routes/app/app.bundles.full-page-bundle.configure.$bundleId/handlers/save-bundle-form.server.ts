import { processCss } from "../../../../lib/css-sanitizer";
import { parseIndividualSellingPlanSelection } from "./shared.server";

function normalizePersonalizationData(personalizationData: any) {
  if (
    !personalizationData ||
    typeof personalizationData !== "object" ||
    Array.isArray(personalizationData)
  ) {
    return personalizationData;
  }

  const addonProducts = personalizationData.addonProducts;
  if (!addonProducts || typeof addonProducts !== "object") {
    return personalizationData;
  }

  const tiers = Array.isArray(addonProducts.tiers)
    ? addonProducts.tiers.map((tier: any) => {
        const parsedValue = Number(
          tier?.eligibilityCondition?.value ?? tier?.eligibilityValue ?? 1,
        );
        const normalizedEligibilityValue =
          Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : 1;

        return {
          ...tier,
          eligibilityCondition: tier?.eligibilityCondition
            ? {
                ...tier.eligibilityCondition,
                value: normalizedEligibilityValue,
              }
            : tier.eligibilityCondition,
          ...(typeof tier?.eligibilityValue !== "undefined"
            ? { eligibilityValue: normalizedEligibilityValue }
            : {}),
        };
      })
    : addonProducts.tiers;

  return {
    ...personalizationData,
    addonProducts: {
      ...addonProducts,
      tiers,
    },
  };
}

export function parseFpbSaveBundleForm(formData: FormData) {
  const bundleName = formData.get("bundleName") as string;
  const bundleDescription = formData.get("bundleDescription") as string;
  const bundleStatus = formData.get("bundleStatus") as string;
  const templateName = (formData.get("templateName") as string) || null;
  const promoBannerBgImageRaw = formData.get("promoBannerBgImage") as string;
  const promoBannerBgImage = promoBannerBgImageRaw || null;
  const loadingGifRaw = formData.get("loadingGif") as string;
  const loadingGif = loadingGifRaw || null;
  const searchBarEnabled = formData.get("searchBarEnabled") === "true";
  const showStepTimelineRaw = formData.get("showStepTimeline") as
    | string
    | null;
  const showStepTimelineParsed =
    showStepTimelineRaw === "true"
      ? true
      : showStepTimelineRaw === "false"
        ? false
        : null;
  const floatingBadgeEnabled = formData.get("floatingBadgeEnabled") === "true";
  const floatingBadgeTextRaw =
    (formData.get("floatingBadgeText") as string) ?? "";
  const floatingBadgeText = floatingBadgeTextRaw.slice(0, 60);
  const showProductPrices = formData.get("showProductPrices") !== "false";
  const showCompareAtPrices = formData.get("showCompareAtPrices") === "true";
  const cartRedirectToCheckout =
    formData.get("cartRedirectToCheckout") === "true";
  const allowQuantityChanges =
    formData.get("allowQuantityChanges") !== "false";
  const variantSelectorEnabled =
    formData.get("variantSelectorEnabled") !== "false";
  const showTextOnAddButton = formData.get("showTextOnAddButton") === "true";
  const textOverridesRaw = formData.get("textOverrides") as string | null;
  const textOverridesByLocaleRaw = formData.get("textOverridesByLocale") as
    | string
    | null;
  const textOverrides = textOverridesRaw ? JSON.parse(textOverridesRaw) : null;
  const textOverridesByLocale = textOverridesByLocaleRaw
    ? JSON.parse(textOverridesByLocaleRaw)
    : null;
  const bundleTextConfigRaw = formData.get("bundleTextConfig") as
    | string
    | null;
  const bundleTextConfig = bundleTextConfigRaw
    ? JSON.parse(bundleTextConfigRaw)
    : null;
  const personalizationDataRaw = formData.get("personalizationData") as
    | string
    | null;
  const personalizationData = personalizationDataRaw
    ? normalizePersonalizationData(JSON.parse(personalizationDataRaw))
    : null;
  const bundleUpsellConfigRaw = formData.get("bundleUpsellConfig") as
    | string
    | null;
  const bundleUpsellConfig = bundleUpsellConfigRaw
    ? JSON.parse(bundleUpsellConfigRaw)
    : null;
  const upsellWidgetEnabled = formData.get("upsellWidgetEnabled") === "true";
  const upsellWidgetDisplayMode =
    (formData.get("upsellWidgetDisplayMode") as string | null) ?? "block";
  const upsellWidgetDisplayOn =
    (formData.get("upsellWidgetDisplayOn") as string | null) ?? "all";
  const autoSelectBrowsedProduct =
    formData.get("autoSelectBrowsedProduct") === "true";
  const bundleBannerDesktopUrlRaw = formData.get("bundleBannerDesktopUrl") as
    | string
    | null;
  const bundleBannerDesktopUrl = bundleBannerDesktopUrlRaw || null;
  const bundleBannerMobileUrlRaw = formData.get("bundleBannerMobileUrl") as
    | string
    | null;
  const bundleBannerMobileUrl = bundleBannerMobileUrlRaw || null;
  const bundleLevelCssRaw = formData.get("bundleLevelCss") as string | null;
  const bundleLevelCssInput =
    typeof bundleLevelCssRaw === "string" ? bundleLevelCssRaw : "";
  const { sanitizedCss: sanitizedBundleLevelCss } =
    processCss(bundleLevelCssInput);
  const bundleLevelCss = sanitizedBundleLevelCss.trim() || null;
  const productSlotsEnabled = formData.get("productSlotsEnabled") === "true";
  const maxQtyPerProductRaw = formData.get("maxQtyPerProduct") as
    | string
    | null;
  const maxQtyPerProduct = maxQtyPerProductRaw
    ? parseInt(maxQtyPerProductRaw, 10) || null
    : null;
  const productSlotIconUrlRaw = formData.get("productSlotIconUrl") as
    | string
    | null;
  const productSlotIconUrl = productSlotIconUrlRaw || null;
  const validateQuantityPerProductRaw = formData.get(
    "validateQuantityPerProduct",
  ) as string | null;
  const validateQuantityPerProduct = validateQuantityPerProductRaw
    ? JSON.parse(validateQuantityPerProductRaw)
    : { isEnabled: false, allowedQuantity: 1 };
  const individualSellingPlanSelection =
    parseIndividualSellingPlanSelection(formData);
  const defaultProductsDataRaw = formData.get("defaultProductsData") as
    | string
    | null;
  const defaultProductsData = defaultProductsDataRaw
    ? JSON.parse(defaultProductsDataRaw)
    : null;
  const quantityValidationEnabled =
    validateQuantityPerProduct?.isEnabled === true;
  const stepsData = JSON.parse(formData.get("stepsData") as string);
  const discountData = JSON.parse(formData.get("discountData") as string);
  const stepConditionsData = formData.get("stepConditions")
    ? JSON.parse(formData.get("stepConditions") as string)
    : {};
  const bundleProductData = formData.get("bundleProduct")
    ? JSON.parse(formData.get("bundleProduct") as string)
    : null;

  return {
    allowQuantityChanges,
    autoSelectBrowsedProduct,
    bundleBannerDesktopUrl,
    bundleBannerMobileUrl,
    bundleDescription,
    bundleLevelCss,
    bundleName,
    bundleProductData,
    bundleStatus,
    bundleTextConfig,
    bundleUpsellConfig,
    cartRedirectToCheckout,
    defaultProductsData,
    discountData,
    floatingBadgeEnabled,
    floatingBadgeText,
    individualSellingPlanSelection,
    loadingGif,
    maxQtyPerProduct,
    personalizationData,
    productSlotIconUrl,
    productSlotsEnabled,
    promoBannerBgImage,
    quantityValidationEnabled,
    searchBarEnabled,
    showCompareAtPrices,
    showProductPrices,
    showStepTimelineParsed,
    showTextOnAddButton,
    stepConditionsData,
    stepsData,
    templateName,
    textOverrides,
    textOverridesByLocale,
    upsellWidgetDisplayMode,
    upsellWidgetDisplayOn,
    upsellWidgetEnabled,
    validateQuantityPerProduct,
    variantSelectorEnabled,
  };
}
