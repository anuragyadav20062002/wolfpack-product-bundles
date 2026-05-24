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

export function parseBundleDesignTemplate(formData: FormData) {
  return {
    bundleDesignTemplate: str(formData, "bundleDesignTemplate"),
    bundleDesignPresetId: str(formData, "bundleDesignPresetId"),
  };
}

export function parsePPBGiftMessages(formData: FormData) {
  const enableLimit = bool(formData, "giftMessageEnableLimit", false);
  return {
    giftMessagesEnabled:              bool(formData, "giftMessagesEnabled", false),
    giftMessageProductId:             str(formData, "giftMessageProductId"),
    giftMessageProductTitle:          str(formData, "giftMessageProductTitle"),
    giftMessageEnableSenderRecipient: bool(formData, "giftMessageEnableSenderRecipient", false),
    giftMessageMandatory:             bool(formData, "giftMessageMandatory", false),
    giftMessageEnableLimit:           enableLimit,
    giftMessageCharLimit:             enableLimit ? int(formData, "giftMessageCharLimit") : null,
    giftMessageSendEmail:             bool(formData, "giftMessageSendEmail", false),
  };
}

export function parsePPBBundleVisibility(formData: FormData) {
  return {
    upsellWidgetEnabled:         bool(formData, "upsellWidgetEnabled", false),
    upsellWidgetDisplayMode:     str(formData, "upsellWidgetDisplayMode"),
    upsellWidgetDisplayOn:       str(formData, "upsellWidgetDisplayOn"),
    autoSelectBrowsedProduct:    bool(formData, "autoSelectBrowsedProduct", false),
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
    maxQtyPerProduct:            int(formData, "maxQtyPerProduct"),
    productSlotsEnabled:         bool(formData, "productSlotsEnabled", false),
    productSlotIconUrl:          str(formData, "productSlotIconUrl"),
    variantSelectorEnabled:      bool(formData, "variantSelectorEnabled", true),
    showTextOnAddButton:         bool(formData, "showTextOnAddButton", false),
    bundleCartTitle:             str(formData, "bundleCartTitle"),
    bundleCartSubtitle:          str(formData, "bundleCartSubtitle"),
    bundleBannerDesktopUrl:      str(formData, "bundleBannerDesktopUrl"),
    bundleBannerMobileUrl:       str(formData, "bundleBannerMobileUrl"),
    bundleLevelCss,
  };
}
