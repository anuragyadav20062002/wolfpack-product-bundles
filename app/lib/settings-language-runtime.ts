import { BundleType } from "../constants/bundle";

type JsonObject = Record<string, unknown>;
type LanguageBundleType = typeof BundleType.PRODUCT_PAGE | typeof BundleType.FULL_PAGE;

type LanguageField = {
  id: string;
  label: string;
  type: "text";
  value: string;
};

type SharedCartLabels = {
  bundleContainsLabel: string;
  bundleOriginalPriceLabel: string;
  bundleDiscountDisplayLabel: string;
};

type SettingsLanguageDocument = {
  languageMode: "SINGLE" | "MULTIPLE";
  en: JsonObject;
  mixAndMatchTextData: {
    en: JsonObject;
  };
  sharedComponents: {
    en: {
      cartAndCheckout: Record<keyof SharedCartLabels, LanguageField>;
    };
  };
};

export type SettingsLanguageRuntime = {
  languageMode: "SINGLE" | "MULTIPLE";
  activeLocale: "en";
  selectedLanguage: string;
  languageData: SettingsLanguageDocument;
  fpbLanguageData: JsonObject;
  ppbCustomTextSettings: Record<string, unknown>;
  sharedCartLabels: SharedCartLabels;
};

const DEFAULT_SHARED_CART_LABELS: SharedCartLabels = {
  bundleContainsLabel: "Items",
  bundleOriginalPriceLabel: "Retail Price",
  bundleDiscountDisplayLabel: "You Save",
};

const FPB_DEFAULTS = {
  addToBoxButtonText: "Add To Box",
  nextButtonText: "Next",
  addToCartButtonText: "Add To Cart",
  totalLabelText: "Total",
  viewCartProductsLabel: "View Selected Products",
  discountBadgeSuffix: "off",
  cartInclusionTitle: "item(s)",
  subscriptionSelectionLabel: "Select Subscription Plan",
  noProductsAvailableText: "No Products Available",
  chooseOptionsButtonText: "Choose Options",
  loadMoreProductsButtonText: "Load More Products",
  preparingBundleLabel: "Preparing Bundle...",
  redirectingLabel: "Redirecting...",
  addedLabel: "Added",
  addButtonText: "Add",
  reviewButtonText: "Review",
  selectBundleProductsLabel: "Select Bundle Products",
  quantityLabel: "Quantity",
  clearCartModalTitle: "Are you sure?",
  clearCartModalDescription: "Are you sure you want to clear all items from your cart? This action cannot be undone...",
  clearCartButtonText: "Clear",
  clearCartCancelButtonText: "Cancel",
  clearCartConfirmButtonText: "Clear Cart",
  boxSelectionEligibilityToast: "Remove {{boxSelectionDifference}} item(s) to select this box",
  removeProductFromFooterText: "Remove This Product From {{stepName}}",
  quantityGreaterThanOrEqualTo: "Add at least {{conditionQuantity}} products on this step",
  quantityLessThanOrEqualTo: "Add a maximum of {{conditionQuantity}} products to continue",
  quantityEqualTo: "Add exactly {{conditionQuantity}} products on this step",
  amountGreaterThanOrEqualTo: "Add products worth at least {{conditionAmount}} on this step",
  amountLessThanOrEqualTo: "Add products worth maximum of {{conditionAmount}} on this step",
  amountEqualTo: "Add products worth {{conditionAmount}} on this step",
  weightGreaterThanOrEqualTo: "Add products weighing at least {{conditionWeight}} on this step",
  weightLessThanOrEqualTo: "Add products weighing maximum of {{conditionWeight}} on this step",
  weightEqualTo: "Add products weighing {{conditionWeight}} on this step",
  maxAddonProductsAllowed: "Add a maximum of {{maxAllowedAddons}} addon products on this step",
  addonProductsMandatory: "Addon product is mandatory on this step",
  mobileAddonNotification: "Additional offers to be unlocked",
  messageLabel: "Message",
  senderNamePlaceholder: "From",
  recipientNamePlaceholder: "To",
  messagePlaceholder: "Enter a message here...",
  recipientEmailAddressLabel: "Recipient Email Address",
  recipientEmailAddressPlaceholder: "Enter a recipient email address here...",
  emailValidationMessage: "Please enter a valid email address",
  sendNowLabel: "Send Now",
  sendLaterLabel: "Send Later",
  personalizePageSubtext: "",
  messageRequiredWarning: "Please enter a message",
  permissionDenied: "Permission Denied",
  uploadConfirmation: "Your video has been successfully uploaded!",
  pressToRecord: "Press to record",
  recording: "Recording....",
  videoErrorMessage: "An error occured, Please try again!",
  videoLoading: "Loading....",
  uploading: "Uploading....",
  sendVideoMessageText: "Send Video Message",
  messageDeliveryInfo: "The message will be sent to the recipient via email as soon as the order is placed",
  saveVideoText: "Save Video",
  reRecordVideoText: "Re-Record Video",
};

const PPB_DEFAULTS = {
  productCardAddBtnText: "Add to Cart",
  productVariantLabelText: "Select variant",
  productAddedBtnText: "Added x{{allowedQuantity}}",
  productCardAddBtnTextInPage: "Add +",
  discountRibbonSuffix: "off",
  selectSubscriptionPlanButtonText: "Select Subscription Plan",
  boxConditionInitialTextInPage: "Select {{quantityDifference}} Items",
  bundleCartDrawerBtnTextInPage: "View Bundle Items",
  bundleCartSelectedProductsTextInPage: "Selected Products",
  subtotalLabelText: "Subtotal",
  addToCartBundleBtnText: "Add Bundle to Cart",
  footerPrevBtnText: "Prev",
  footerNextBtnText: "Next",
  footerFinishBtnText: "Done",
  noProductsAvailable: "No Products Available",
  addToCartBundleBtnLoadingText: "Adding Bundle...",
  emptyCardText: "Product",
  stepsDrawerPillText: "Show all steps",
  inventoryLimitReachedText: "No More Stock",
  boxSelectionEligibilityToastInPage: "Remove {{boxSelectionDifference}} item(s) to select this box",
  quantityGreaterThanOrEqualTo: "Add at least {{conditionQuantity}} products on this step",
  quantityLessThanOrEqualTo: "Add a maximum of {{conditionQuantity}} products to continue",
  quantityEqualTo: "Add exactly {{conditionQuantity}} products on this step",
  amountGreaterThanOrEqualTo: "Add products worth at least {{conditionAmount}} on this step",
  amountLessThanOrEqualTo: "Add products worth maximum of {{conditionAmount}} on this step",
  amountEqualTo: "Add products worth {{conditionAmount}} on this step",
};

export const SETTINGS_LANGUAGE_BUNDLE_TYPES = [
  BundleType.PRODUCT_PAGE,
  BundleType.FULL_PAGE,
] as const;

function getLanguageFieldValues(payload: Record<string, unknown>) {
  return payload.languageFieldValues && typeof payload.languageFieldValues === "object"
    ? payload.languageFieldValues as Record<string, unknown>
    : {};
}

function getField(values: Record<string, unknown>, key: string, fallback: string) {
  const value = values[key];
  if (value === null || value === undefined || value === "") {
    return fallback;
  }
  return String(value);
}

function languageField(id: string, label: string, value: string): LanguageField {
  return { id, label, type: "text", value };
}

function conditionField(label: string, value: string): LanguageField {
  return languageField(label.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, ""), label, value);
}

function buildSharedCartFields(values: Record<string, unknown>) {
  return {
    bundleContainsLabel: languageField(
      "bundleContainsLabel",
      "Bundle Contains Label",
      getField(values, "shared.cartCheckout.bundleContainsLabel", DEFAULT_SHARED_CART_LABELS.bundleContainsLabel),
    ),
    bundleOriginalPriceLabel: languageField(
      "bundleOriginalPriceLabel",
      "Bundle Original Price Label",
      getField(values, "shared.cartCheckout.bundleOriginalPriceLabel", DEFAULT_SHARED_CART_LABELS.bundleOriginalPriceLabel),
    ),
    bundleDiscountDisplayLabel: languageField(
      "bundleDiscountDisplayLabel",
      "Bundle Cart Discount Display Label",
      getField(values, "shared.cartCheckout.bundleDiscountDisplayLabel", DEFAULT_SHARED_CART_LABELS.bundleDiscountDisplayLabel),
    ),
  };
}

function buildFpbLanguage(values: Record<string, unknown>) {
  const general = {
    addToBoxButtonText: languageField("addToBoxButtonText", "Add Product to Bundle Button", getField(values, "fpb.general.addToBoxButtonText", FPB_DEFAULTS.addToBoxButtonText)),
    nextButtonText: languageField("nextButtonText", "Next Button Text", getField(values, "fpb.general.nextButtonText", FPB_DEFAULTS.nextButtonText)),
    addToCartButtonText: languageField("addToCartButtonText", "Add Bundle to Cart Button", getField(values, "fpb.general.addToCartButtonText", FPB_DEFAULTS.addToCartButtonText)),
    totalLabelText: languageField("totalLabelText", "Total Label", getField(values, "fpb.general.totalLabelText", FPB_DEFAULTS.totalLabelText)),
    viewCartProductsLabel: languageField("viewCartProductsLabel", "View Cart Products Label", getField(values, "fpb.general.viewCartProductsLabel", FPB_DEFAULTS.viewCartProductsLabel)),
    discountBadgeSuffix: languageField("discountBadgeSuffix", "Discount Badge Suffix", getField(values, "fpb.general.discountBadgeSuffix", FPB_DEFAULTS.discountBadgeSuffix)),
    cartInclusionTitle: languageField("cartInclusionTitle", "Cart Inclusion Title", getField(values, "fpb.general.cartInclusionTitle", FPB_DEFAULTS.cartInclusionTitle)),
    subscriptionSelectionLabel: languageField("subscriptionSelectionLabel", "Subscription Selection Label", getField(values, "fpb.general.subscriptionSelectionLabel", FPB_DEFAULTS.subscriptionSelectionLabel)),
    noProductsAvailableText: languageField("noProductsAvailableText", "No Products Available label", getField(values, "fpb.general.noProductsAvailableText", FPB_DEFAULTS.noProductsAvailableText)),
    chooseOptionsButtonText: languageField("chooseOptionsButtonText", "Choose Options Button", getField(values, "fpb.general.chooseOptionsButtonText", FPB_DEFAULTS.chooseOptionsButtonText)),
    loadMoreProductsButtonText: languageField("loadMoreProductsButtonText", "Load More Products Button", getField(values, "fpb.general.loadMoreProductsButtonText", FPB_DEFAULTS.loadMoreProductsButtonText)),
    preparingBundleLabel: languageField("preparingBundleLabel", "Preparing Bundle Label", getField(values, "fpb.general.preparingBundleLabel", FPB_DEFAULTS.preparingBundleLabel)),
    redirectingLabel: languageField("redirectingLabel", "Redirecting label", getField(values, "fpb.general.redirectingLabel", FPB_DEFAULTS.redirectingLabel)),
    addedLabel: languageField("addedLabel", "Added Label", getField(values, "fpb.general.addedLabel", FPB_DEFAULTS.addedLabel)),
    addButtonText: languageField("addButtonText", "Add Button Text", getField(values, "fpb.general.addButtonText", FPB_DEFAULTS.addButtonText)),
    reviewButtonText: languageField("reviewButtonText", "Review Button Text", getField(values, "fpb.general.reviewButtonText", FPB_DEFAULTS.reviewButtonText)),
    selectBundleProductsLabel: languageField("selectBundleProductsLabel", "Select Bundle Products label", getField(values, "fpb.general.selectBundleProductsLabel", FPB_DEFAULTS.selectBundleProductsLabel)),
  };

  const modals = {
    quantityLabel: languageField("quantityLabel", "Quantity Label", getField(values, "fpb.modals.quantityLabel", FPB_DEFAULTS.quantityLabel)),
    clearCart: {
      title: languageField("clearCartModalTitle", "Modal - Title", getField(values, "fpb.modals.clearCartModalTitle", FPB_DEFAULTS.clearCartModalTitle)),
      description: languageField("clearCartModalDescription", "Modal - Description", getField(values, "fpb.modals.clearCartModalDescription", FPB_DEFAULTS.clearCartModalDescription)),
      clearButtonText: languageField("clearCartButtonText", "Clear Cart Button Text", getField(values, "fpb.modals.clearCartButtonText", FPB_DEFAULTS.clearCartButtonText)),
      cancelButtonText: languageField("clearCartCancelButtonText", "Modal - Cancel Button Text", getField(values, "fpb.modals.clearCartCancelButtonText", FPB_DEFAULTS.clearCartCancelButtonText)),
      confirmButtonText: languageField("clearCartConfirmButtonText", "Modal - Confirm Button Text", getField(values, "fpb.modals.clearCartConfirmButtonText", FPB_DEFAULTS.clearCartConfirmButtonText)),
    },
  };

  const conditions = {
    quantity: {
      greaterThanOrEqualTo: conditionField("Greater than rule message (Quantity)", getField(values, "fpb.conditions.quantity.greaterThanOrEqualTo", FPB_DEFAULTS.quantityGreaterThanOrEqualTo)),
      lessThanOrEqualTo: conditionField("Less than rule message (Quantity)", getField(values, "fpb.conditions.quantity.lessThanOrEqualTo", FPB_DEFAULTS.quantityLessThanOrEqualTo)),
      equalTo: conditionField("Equal to rule message (Quantity)", getField(values, "fpb.conditions.quantity.equalTo", FPB_DEFAULTS.quantityEqualTo)),
    },
    amount: {
      greaterThanOrEqualTo: conditionField("Greater than rule message (Amount)", getField(values, "fpb.conditions.amount.greaterThanOrEqualTo", FPB_DEFAULTS.amountGreaterThanOrEqualTo)),
      lessThanOrEqualTo: conditionField("Less than rule message (Amount)", getField(values, "fpb.conditions.amount.lessThanOrEqualTo", FPB_DEFAULTS.amountLessThanOrEqualTo)),
      equalTo: conditionField("Equal to rule message (Amount)", getField(values, "fpb.conditions.amount.equalTo", FPB_DEFAULTS.amountEqualTo)),
    },
    weight: {
      greaterThanOrEqualTo: conditionField("Greater than rule message (Weight)", getField(values, "fpb.conditions.weight.greaterThanOrEqualTo", FPB_DEFAULTS.weightGreaterThanOrEqualTo)),
      lessThanOrEqualTo: conditionField("Less than rule message (Weight)", getField(values, "fpb.conditions.weight.lessThanOrEqualTo", FPB_DEFAULTS.weightLessThanOrEqualTo)),
      equalTo: conditionField("Equal to rule message (Weight)", getField(values, "fpb.conditions.weight.equalTo", FPB_DEFAULTS.weightEqualTo)),
    },
  };

  return {
    landingPage: {},
    navigationSteps: {},
    productPage: {},
    giftBoxPage: {},
    videoMessage: {
      permissionDenied: languageField("permissionDenied", "Permission Denied", getField(values, "fpb.videoMessage.permissionDenied", FPB_DEFAULTS.permissionDenied)),
      uploadConfirmation: languageField("uploadConfirmation", "Upload Confirmation", getField(values, "fpb.videoMessage.uploadConfirmation", FPB_DEFAULTS.uploadConfirmation)),
      pressToRecord: languageField("pressToRecord", "Press to record", getField(values, "fpb.videoMessage.pressToRecord", FPB_DEFAULTS.pressToRecord)),
      recording: languageField("recording", "Recording", getField(values, "fpb.videoMessage.recording", FPB_DEFAULTS.recording)),
      errorMessage: languageField("videoErrorMessage", "Error Message", getField(values, "fpb.videoMessage.videoErrorMessage", FPB_DEFAULTS.videoErrorMessage)),
      loading: languageField("videoLoading", "Loading", getField(values, "fpb.videoMessage.videoLoading", FPB_DEFAULTS.videoLoading)),
      uploading: languageField("uploading", "Uploading", getField(values, "fpb.videoMessage.uploading", FPB_DEFAULTS.uploading)),
      sendVideoMessageText: languageField("sendVideoMessageText", "Send Video Message Text", getField(values, "fpb.videoMessage.sendVideoMessageText", FPB_DEFAULTS.sendVideoMessageText)),
      messageDeliveryInfo: languageField("messageDeliveryInfo", "Message Delivery Info", getField(values, "fpb.videoMessage.messageDeliveryInfo", FPB_DEFAULTS.messageDeliveryInfo)),
      saveVideoText: languageField("saveVideoText", "Save Video Text", getField(values, "fpb.videoMessage.saveVideoText", FPB_DEFAULTS.saveVideoText)),
      reRecordVideoText: languageField("reRecordVideoText", "Re-Record Video Text", getField(values, "fpb.videoMessage.reRecordVideoText", FPB_DEFAULTS.reRecordVideoText)),
    },
    personalizePage: {
      messageLabel: languageField("messageLabel", "Message Label", getField(values, "fpb.personalizePage.messageLabel", FPB_DEFAULTS.messageLabel)),
      senderNamePlaceholder: languageField("senderNamePlaceholder", "Sender Name Placeholder", getField(values, "fpb.personalizePage.senderNamePlaceholder", FPB_DEFAULTS.senderNamePlaceholder)),
      recipientNamePlaceholder: languageField("recipientNamePlaceholder", "Recipient Name Placeholder", getField(values, "fpb.personalizePage.recipientNamePlaceholder", FPB_DEFAULTS.recipientNamePlaceholder)),
      messagePlaceholder: languageField("messagePlaceholder", "Message Placeholder", getField(values, "fpb.personalizePage.messagePlaceholder", FPB_DEFAULTS.messagePlaceholder)),
      recipientEmailAddressLabel: languageField("recipientEmailAddressLabel", "Recipient Email Address Label", getField(values, "fpb.personalizePage.recipientEmailAddressLabel", FPB_DEFAULTS.recipientEmailAddressLabel)),
      recipientEmailAddressPlaceholder: languageField("recipientEmailAddressPlaceholder", "Recipient Email Address Placeholder", getField(values, "fpb.personalizePage.recipientEmailAddressPlaceholder", FPB_DEFAULTS.recipientEmailAddressPlaceholder)),
      emailValidationMessage: languageField("emailValidationMessage", "Email Validation Message", getField(values, "fpb.personalizePage.emailValidationMessage", FPB_DEFAULTS.emailValidationMessage)),
      sendNowLabel: languageField("sendNowLabel", "Send Now Label", getField(values, "fpb.personalizePage.sendNowLabel", FPB_DEFAULTS.sendNowLabel)),
      sendLaterLabel: languageField("sendLaterLabel", "Send Later Label", getField(values, "fpb.personalizePage.sendLaterLabel", FPB_DEFAULTS.sendLaterLabel)),
      personalizePageSubtext: languageField("personalizePageSubtext", "Personalize Page Subtext", getField(values, "fpb.personalizePage.personalizePageSubtext", FPB_DEFAULTS.personalizePageSubtext)),
      messageRequiredWarning: languageField("messageRequiredWarning", "Message is required warning", getField(values, "fpb.personalizePage.messageRequiredWarning", FPB_DEFAULTS.messageRequiredWarning)),
    },
    reviewPage: {},
    discountRules: {},
    sortBy: {},
    conditions,
    general,
    multipleCategoriesPage: {},
    multipleCategories: {},
    addons: {
      maxAddonProductsAllowed: languageField("maxAddonProductsAllowed", "Max Addon Products Allowed message", getField(values, "fpb.addons.maxAddonProductsAllowed", FPB_DEFAULTS.maxAddonProductsAllowed)),
      addonProductsMandatory: languageField("addonProductsMandatory", "Addon Products Mandatory message", getField(values, "fpb.addons.addonProductsMandatory", FPB_DEFAULTS.addonProductsMandatory)),
      mobileAddonNotification: languageField("mobileAddonNotification", "Mobile Add On Notification", getField(values, "fpb.addons.mobileAddonNotification", FPB_DEFAULTS.mobileAddonNotification)),
    },
    modals,
    toasts: {
      boxSelectionEligibilityToast: languageField("boxSelectionEligibilityToast", "Box Selection Eligibility Toast", getField(values, "fpb.toasts.boxSelectionEligibilityToast", FPB_DEFAULTS.boxSelectionEligibilityToast)),
      removeProductFromFooterText: languageField("removeProductFromFooterText", "Remove Product from Footer Text", getField(values, "fpb.toasts.removeProductFromFooterText", FPB_DEFAULTS.removeProductFromFooterText)),
    },
  };
}

function buildPpbLanguage(values: Record<string, unknown>) {
  return {
    productCard: {
      productCardAddBtnText: languageField("productCardAddBtnText", "Product Add to Cart Button", getField(values, "ppb.productCard.productCardAddBtnText", PPB_DEFAULTS.productCardAddBtnText)),
      productVariantLabelText: languageField("productVariantLabelText", "Product Variant Label", getField(values, "ppb.productCard.productVariantLabelText", PPB_DEFAULTS.productVariantLabelText)),
      productAddedBtnText: languageField("productAddedBtnText", "Product Added label", getField(values, "ppb.productCard.productAddedBtnText", PPB_DEFAULTS.productAddedBtnText)),
      productCardAddBtnText_inPage: languageField("productCardAddBtnText_inPage", "Inline Product - Add Button Text", getField(values, "ppb.productCard.productCardAddBtnText_inPage", PPB_DEFAULTS.productCardAddBtnTextInPage)),
    },
    general: {
      discountRibbonSuffix: languageField("discountRibbonSuffix", "Discount Badge Suffix", getField(values, "ppb.general.discountRibbonSuffix", PPB_DEFAULTS.discountRibbonSuffix)),
      selectSubscriptionPlanButtonText: languageField("selectSubscriptionPlanButtonText", "Subscription Selection Label", getField(values, "ppb.general.selectSubscriptionPlanButtonText", PPB_DEFAULTS.selectSubscriptionPlanButtonText)),
      boxConditionInitialText_inPage: languageField("boxConditionInitialText_inPage", "Inline Add To Cart Button - Quantity Selection message", getField(values, "ppb.general.boxConditionInitialText_inPage", PPB_DEFAULTS.boxConditionInitialTextInPage)),
      bundleCartDrawerBtnText_inPage: languageField("bundleCartDrawerBtnText_inPage", "Inline Cart Drawer Button Text", getField(values, "ppb.general.bundleCartDrawerBtnText_inPage", PPB_DEFAULTS.bundleCartDrawerBtnTextInPage)),
      bundleCartSelectedProductsText_inPage: languageField("bundleCartSelectedProductsText_inPage", "Inline Cart Selected Products Label", getField(values, "ppb.general.bundleCartSelectedProductsText_inPage", PPB_DEFAULTS.bundleCartSelectedProductsTextInPage)),
      subtotalLabelText: languageField("subtotalLabelText", "Subtotal Text", getField(values, "ppb.general.subtotalLabelText", PPB_DEFAULTS.subtotalLabelText)),
      addBundleToCartBtnText: languageField("addBundleToCartBtnText", "Add Bundle Cart label", getField(values, "ppb.general.addBundleToCartBtnText", PPB_DEFAULTS.addToCartBundleBtnText)),
      noProductsAvailable: languageField("noProductsAvailable", "No Products Available label", getField(values, "ppb.general.noProductsAvailable", PPB_DEFAULTS.noProductsAvailable)),
      addToCartBundleBtnLoadingText: languageField("addToCartBundleBtnLoadingText", "Add Bundle Loading label", getField(values, "ppb.general.addToCartBundleBtnLoadingText", PPB_DEFAULTS.addToCartBundleBtnLoadingText)),
      emptyCardText: languageField("emptyCardText", "Add Empty Product Card Text", getField(values, "ppb.general.emptyCardText", PPB_DEFAULTS.emptyCardText)),
      stepsDrawerPillText: languageField("stepsDrawerPillText", "Steps Drawer Pill Text", getField(values, "ppb.general.stepsDrawerPillText", PPB_DEFAULTS.stepsDrawerPillText)),
      inventoryLimitReachedText: languageField("inventoryLimitReachedText", "Inventory Limit Reached Label", getField(values, "ppb.general.inventoryLimitReachedText", PPB_DEFAULTS.inventoryLimitReachedText)),
      boxSelectionEligibilityToast_inPage: languageField("boxSelectionEligibilityToast_inPage", "Box Selection Eligibility Toast", getField(values, "ppb.general.boxSelectionEligibilityToast_inPage", PPB_DEFAULTS.boxSelectionEligibilityToastInPage)),
    },
    footer: {
      footerPrevBtnText: languageField("footerPrevBtnText", "Footer Previous Button", getField(values, "ppb.footer.footerPrevBtnText", PPB_DEFAULTS.footerPrevBtnText)),
      footerNextBtnText: languageField("footerNextBtnText", "Footer Next Button", getField(values, "ppb.footer.footerNextBtnText", PPB_DEFAULTS.footerNextBtnText)),
      footerFinishBtnText: languageField("footerFinishBtnText", "Footer Finish Button", getField(values, "ppb.footer.footerFinishBtnText", PPB_DEFAULTS.footerFinishBtnText)),
    },
    conditions: {
      amount: {
        greaterThanOrEqualTo: conditionField("Greater than rule message (Amount)", getField(values, "ppb.conditions.amount.greaterThanOrEqualTo", PPB_DEFAULTS.amountGreaterThanOrEqualTo)),
        lessThanOrEqualTo: conditionField("Less than rule message (Amount)", getField(values, "ppb.conditions.amount.lessThanOrEqualTo", PPB_DEFAULTS.amountLessThanOrEqualTo)),
        equalTo: conditionField("Equal to rule message (Amount)", getField(values, "ppb.conditions.amount.equalTo", PPB_DEFAULTS.amountEqualTo)),
      },
      quantity: {
        greaterThanOrEqualTo: conditionField("Greater than rule message (Quantity)", getField(values, "ppb.conditions.quantity.greaterThanOrEqualTo", PPB_DEFAULTS.quantityGreaterThanOrEqualTo)),
        lessThanOrEqualTo: conditionField("Less than rule message (Quantity)", getField(values, "ppb.conditions.quantity.lessThanOrEqualTo", PPB_DEFAULTS.quantityLessThanOrEqualTo)),
        equalTo: conditionField("Equal to rule message (Quantity)", getField(values, "ppb.conditions.quantity.equalTo", PPB_DEFAULTS.quantityEqualTo)),
      },
    },
  };
}

function getSharedCartLabels(sharedCartAndCheckout: Record<keyof SharedCartLabels, LanguageField>): SharedCartLabels {
  return {
    bundleContainsLabel: sharedCartAndCheckout.bundleContainsLabel.value,
    bundleOriginalPriceLabel: sharedCartAndCheckout.bundleOriginalPriceLabel.value,
    bundleDiscountDisplayLabel: sharedCartAndCheckout.bundleDiscountDisplayLabel.value,
  };
}

export function buildPpbCustomTextSettings(ppbLanguage: JsonObject) {
  const productCard = ppbLanguage.productCard as Record<string, LanguageField>;
  const general = ppbLanguage.general as Record<string, LanguageField>;
  const footer = ppbLanguage.footer as Record<string, LanguageField>;
  const conditions = ppbLanguage.conditions as JsonObject;

  return {
    productCardAddBtnText: productCard.productCardAddBtnText.value,
    productCardOutOfStockBtnText: "Out of Stock",
    productVariantLabelText: productCard.productVariantLabelText.value,
    footerPrevBtnText: footer.footerPrevBtnText.value,
    footerNextBtnText: footer.footerNextBtnText.value,
    footerFinishBtnText: footer.footerFinishBtnText.value,
    addToCartBundleBtnText: general.addBundleToCartBtnText.value,
    subtotalLabelText: general.subtotalLabelText.value,
    addToCartBundleBtnLoadingText: general.addToCartBundleBtnLoadingText.value,
    noProductsAvailable: general.noProductsAvailable.value,
    inventoryLimitReachedText: general.inventoryLimitReachedText.value,
    emptyCardText: general.emptyCardText.value,
    conditions,
    boxSelectionEligibilityToast_inPage: general.boxSelectionEligibilityToast_inPage.value,
    productCardAddBtnText_inPage: productCard.productCardAddBtnText_inPage.value,
    discountAppliedPillText_inPage: "You're saving {{PRICE_DIFF}}",
    subtotalLabelText_inPage: general.subtotalLabelText.value,
    boxConditionInitialText_inPage: general.boxConditionInitialText_inPage.value,
    productAddedBtnText: productCard.productAddedBtnText.value,
    bundleCartDrawerBtnText_inPage: general.bundleCartDrawerBtnText_inPage.value,
    bundleCartSelectedProductsText_inPage: general.bundleCartSelectedProductsText_inPage.value,
    discountRibbonSuffix: general.discountRibbonSuffix.value,
    selectSubscriptionPlanButtonText: general.selectSubscriptionPlanButtonText.value,
    stepsDrawerPillText: general.stepsDrawerPillText.value,
    defaultProductUnavailableBtnText: "Out of Stock",
  };
}

function buildFpbTextOverrides(fpbLanguage: JsonObject) {
  const general = fpbLanguage.general as Record<string, LanguageField>;
  return {
    productAddButton: general.addToBoxButtonText.value,
    addToCartButton: general.addToCartButtonText.value,
    nextButton: general.nextButtonText.value,
    noProductsAvailable: general.noProductsAvailableText.value,
    chooseOptionsButton: general.chooseOptionsButtonText.value,
    loadMoreProductsButton: general.loadMoreProductsButtonText.value,
    addingToCart: general.preparingBundleLabel.value,
    includedBadge: general.addedLabel.value,
    reviewButton: general.reviewButtonText.value,
  };
}

function buildPpbTextOverrides(customTextSettings: Record<string, unknown>) {
  const conditions = customTextSettings.conditions as JsonObject | undefined;
  const quantityConditions = conditions?.quantity as Record<string, LanguageField> | undefined;
  const amountConditions = conditions?.amount as Record<string, LanguageField> | undefined;

  return {
    productCardAddButton: String(customTextSettings.productCardAddBtnText),
    productCardInlineAddButton: String(customTextSettings.productCardAddBtnText_inPage),
    productVariantLabel: String(customTextSettings.productVariantLabelText),
    addToCartButton: String(customTextSettings.addToCartBundleBtnText),
    addingToCart: String(customTextSettings.addToCartBundleBtnLoadingText),
    nextButton: String(customTextSettings.footerNextBtnText),
    doneButton: String(customTextSettings.footerFinishBtnText),
    includedBadge: String(customTextSettings.productAddedBtnText),
    noProductsAvailable: String(customTextSettings.noProductsAvailable),
    viewBundleItems: String(customTextSettings.bundleCartDrawerBtnText_inPage),
    bundleCartSelectedProductsText: String(customTextSettings.bundleCartSelectedProductsText_inPage),
    boxSelectionEligibilityToast_inPage: String(customTextSettings.boxSelectionEligibilityToast_inPage),
    conditionQuantityGreaterThanOrEqualTo: String(quantityConditions?.greaterThanOrEqualTo?.value),
    conditionQuantityLessThanOrEqualTo: String(quantityConditions?.lessThanOrEqualTo?.value),
    conditionQuantityEqualTo: String(quantityConditions?.equalTo?.value),
    conditionAmountGreaterThanOrEqualTo: String(amountConditions?.greaterThanOrEqualTo?.value),
    conditionAmountLessThanOrEqualTo: String(amountConditions?.lessThanOrEqualTo?.value),
    conditionAmountEqualTo: String(amountConditions?.equalTo?.value),
  };
}

export function buildSettingsLanguageRuntime(payload: Record<string, unknown>) {
  const values = getLanguageFieldValues(payload);
  const sharedCartAndCheckout = buildSharedCartFields(values);
  const sharedCartLabels = getSharedCartLabels(sharedCartAndCheckout);
  const fpbLanguageData = buildFpbLanguage(values);
  const ppbLanguageData = buildPpbLanguage(values);
  const ppbCustomTextSettings = buildPpbCustomTextSettings(ppbLanguageData);
  const languageMode = payload.isMultilanguageEnabled === false ? "SINGLE" : "MULTIPLE";
  const selectedLanguage = typeof payload.selectedLanguage === "string" ? payload.selectedLanguage : "English";
  const languageData: SettingsLanguageDocument = {
    languageMode,
    en: fpbLanguageData,
    mixAndMatchTextData: {
      en: ppbLanguageData,
    },
    sharedComponents: {
      en: {
        cartAndCheckout: sharedCartAndCheckout,
      },
    },
  };

  return {
    buttonAddToCartText: (fpbLanguageData.general as Record<string, LanguageField>).addToBoxButtonText.value,
    settingsLanguage: {
      languageMode,
      activeLocale: "en",
      selectedLanguage,
      languageData,
      fpbLanguageData: {
        ...fpbLanguageData,
        sharedComponents: languageData.sharedComponents.en,
      },
      ppbCustomTextSettings,
      sharedCartLabels,
    } satisfies SettingsLanguageRuntime,
  };
}

export function buildSettingsLanguageResponse(settingsLanguage: unknown, bundleType: LanguageBundleType | string) {
  const runtime = settingsLanguage && typeof settingsLanguage === "object"
    ? settingsLanguage as SettingsLanguageRuntime
    : buildSettingsLanguageRuntime({}).settingsLanguage;
  const normalizedBundleType = bundleType === BundleType.FULL_PAGE ? BundleType.FULL_PAGE : BundleType.PRODUCT_PAGE;
  const textOverrides = normalizedBundleType === BundleType.FULL_PAGE
    ? buildFpbTextOverrides(runtime.fpbLanguageData)
    : buildPpbTextOverrides(runtime.ppbCustomTextSettings);

  return {
    bundleType: normalizedBundleType,
    languageMode: runtime.languageMode,
    activeLocale: runtime.activeLocale,
    selectedLanguage: runtime.selectedLanguage,
    languageData: runtime.languageData,
    activeLanguageData: normalizedBundleType === BundleType.FULL_PAGE
      ? runtime.fpbLanguageData
      : runtime.languageData.mixAndMatchTextData.en,
    fpbLanguageData: runtime.fpbLanguageData,
    ppbCustomTextSettings: runtime.ppbCustomTextSettings,
    sharedCartLabels: runtime.sharedCartLabels,
    textOverrides,
  };
}
