import {
  buildSettingsLanguageResponse,
  buildSettingsLanguageRuntime,
} from "../../../app/lib/settings-language-runtime";

describe("settings language runtime", () => {
  const payload = {
    isMultilanguageEnabled: true,
    selectedLanguage: "English",
    languageFieldValues: {
      "shared.cartCheckout.bundleContainsLabel": "Bundle Items",
      "shared.cartCheckout.bundleOriginalPriceLabel": "Original Total",
      "shared.cartCheckout.bundleDiscountDisplayLabel": "Saved",
      "fpb.general.addToBoxButtonText": "Add To Gift Box",
      "fpb.general.addToCartButtonText": "Checkout Bundle",
      "fpb.general.nextButtonText": "Continue",
      "fpb.general.noProductsAvailableText": "Nothing available",
      "ppb.productCard.productCardAddBtnText": "Pick Product",
      "ppb.productCard.productVariantLabelText": "Choose Variant",
      "ppb.productCard.productAddedBtnText": "Picked x{{allowedQuantity}}",
      "ppb.productCard.productCardAddBtnText_inPage": "Quick Pick +",
      "ppb.general.bundleCartDrawerBtnText_inPage": "Open Picks",
      "ppb.general.bundleCartSelectedProductsText_inPage": "Picked Products",
      "ppb.general.addBundleToCartBtnText": "Add Pack",
      "ppb.general.addToCartBundleBtnLoadingText": "Adding Pack...",
      "ppb.conditions.quantity.greaterThanOrEqualTo": "Choose at least {{conditionQuantity}} items",
      "ppb.conditions.quantity.equalTo": "Choose exactly {{conditionQuantity}} items",
      "ppb.conditions.amount.greaterThanOrEqualTo": "Choose products worth {{conditionAmount}}",
      "ppb.footer.footerNextBtnText": "Next Slot",
      "ppb.footer.footerFinishBtnText": "Finish Pack",
    },
  };

  it("builds an EB-shaped language document and direct storefront runtime", () => {
    const runtime = buildSettingsLanguageRuntime(payload);
    const englishGeneral = runtime.settingsLanguage.languageData.en.general as Record<string, { value: string }>;

    expect(runtime.buttonAddToCartText).toBe("Add To Gift Box");
    expect(runtime.settingsLanguage.languageMode).toBe("MULTIPLE");
    expect(englishGeneral.addToBoxButtonText.value).toBe("Add To Gift Box");
    expect(englishGeneral.addToCartButtonText.value).toBe("Checkout Bundle");
    expect(runtime.settingsLanguage.languageData.sharedComponents.en.cartAndCheckout.bundleContainsLabel.value).toBe("Bundle Items");
    expect(runtime.settingsLanguage.ppbCustomTextSettings.productCardAddBtnText).toBe("Pick Product");
    expect(runtime.settingsLanguage.ppbCustomTextSettings.addToCartBundleBtnText).toBe("Add Pack");
  });

  it("returns FPB storefront text overrides from active locale fields", () => {
    const runtime = buildSettingsLanguageRuntime(payload);
    const response = buildSettingsLanguageResponse(runtime.settingsLanguage, "full_page");

    expect(response.bundleType).toBe("full_page");
    expect(response.textOverrides).toMatchObject({
      productAddButton: "Add To Gift Box",
      addToCartButton: "Checkout Bundle",
      nextButton: "Continue",
      noProductsAvailable: "Nothing available",
    });
    expect(response.sharedCartLabels).toEqual({
      bundleContainsLabel: "Bundle Items",
      bundleOriginalPriceLabel: "Original Total",
      bundleDiscountDisplayLabel: "Saved",
    });
  });

  it("returns PPB storefront custom text settings with separate product and bundle CTA keys", () => {
    const runtime = buildSettingsLanguageRuntime(payload);
    const response = buildSettingsLanguageResponse(runtime.settingsLanguage, "product_page");

    expect(response.bundleType).toBe("product_page");
    expect(response.ppbCustomTextSettings).toMatchObject({
      productCardAddBtnText: "Pick Product",
      productVariantLabelText: "Choose Variant",
      productAddedBtnText: "Picked x{{allowedQuantity}}",
      productCardAddBtnText_inPage: "Quick Pick +",
      bundleCartDrawerBtnText_inPage: "Open Picks",
      bundleCartSelectedProductsText_inPage: "Picked Products",
      conditions: {
        quantity: {
          greaterThanOrEqualTo: expect.objectContaining({ value: "Choose at least {{conditionQuantity}} items" }),
          equalTo: expect.objectContaining({ value: "Choose exactly {{conditionQuantity}} items" }),
        },
        amount: {
          greaterThanOrEqualTo: expect.objectContaining({ value: "Choose products worth {{conditionAmount}}" }),
        },
      },
      addToCartBundleBtnText: "Add Pack",
      addToCartBundleBtnLoadingText: "Adding Pack...",
      footerNextBtnText: "Next Slot",
      footerFinishBtnText: "Finish Pack",
    });
    expect(response.textOverrides).toMatchObject({
      productCardAddButton: "Pick Product",
      productCardInlineAddButton: "Quick Pick +",
      productVariantLabel: "Choose Variant",
      addToCartButton: "Add Pack",
      addingToCart: "Adding Pack...",
      nextButton: "Next Slot",
      doneButton: "Finish Pack",
      includedBadge: "Picked x{{allowedQuantity}}",
      viewBundleItems: "Open Picks",
      bundleCartSelectedProductsText: "Picked Products",
      conditionQuantityGreaterThanOrEqualTo: "Choose at least {{conditionQuantity}} items",
      conditionQuantityEqualTo: "Choose exactly {{conditionQuantity}} items",
      conditionAmountGreaterThanOrEqualTo: "Choose products worth {{conditionAmount}}",
    });
  });
});
