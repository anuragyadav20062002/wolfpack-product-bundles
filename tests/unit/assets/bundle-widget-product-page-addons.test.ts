import { readProductPageWidgetSources } from './widget-source-helpers';

// ============================================================
// PPB product-page direct add-ons discount + cart contract tests
// ============================================================

describe("Product Page widget direct Add-ons contract", () => {
  it("tracks the add-on discount helpers and product selection keys path", () => {
    const source = readProductPageWidgetSources();

    expect(source).toContain("getAddonLineDiscount(step)");
    expect(source).toContain("getAddonProductSelectionKeys(step)");
    expect(source).toContain("calculateSelectedAddonDiscountAmount()");
    expect(source).toContain("getDiscountInfoWithSelectedAddonDiscount(discountInfo, totalPrice)");
    expect(source).toContain("const discount = step?.addonDiscount || tier?.discount || {}");
    expect(source).toContain("chargeableAddonProductKeys.has(String(this.extractId(item.variantId) || item.variantId))");
  });

  it("renders add-on-related UI text and labels from step config", () => {
    const source = readProductPageWidgetSources();

    expect(source).toContain("addonLabel");
    expect(source).toContain("addonAddText");
    expect(source).toContain("addonReplaceText");
    expect(source).toContain("step.isFreeGift && step.addonLabel");
    expect(source).toContain("isFreeGift && step.addonLabel");
    expect(source).toContain("addonDisplayFree: step.addonDisplayFree === true,");
  });

  it("does not emit chargeable add-ons as free-gift cart lines", () => {
    const source = readProductPageWidgetSources();

    expect(source).toContain("step?.isFreeGift && step?.addonDisplayFree === true");
    expect(source).toContain("const isChargeableAddonStep = step?.isFreeGift === true && step?.addonDisplayFree !== true;");
    expect(source).toContain("if (isChargeableAddonStep && addonEval?.tier) {");
    expect(source).toContain("properties._bundle_step_type = addonDiscount && step?.addonDisplayFree !== true");
    expect(source).toContain("`addon:${addonDiscount.type}:${addonDiscount.value}`");
    expect(source).not.toContain("if (step?.isFreeGift) properties['_bundle_step_type'] = 'free_gift';");
  });

  it("includes selected add-on discount savings in cart display properties", () => {
    const source = readProductPageWidgetSources();

    expect(source).toContain("buildCartLineSourceProperties(selectedLines)");
    expect(source).toContain("const combinedDiscountAmount = Math.min(totalPrice, baseDiscountAmount + addonDiscountAmount);");
    expect(source).toContain("const discountInfo = PricingCalculator.calculateDiscount(");
    expect(source).toContain("const combinedDiscountInfo = this.getDiscountInfoWithSelectedAddonDiscount(discountInfo, totalPrice);");
    expect(source).toContain("const discountAmount = Math.max(0, Number(combinedDiscountInfo.discountAmount || 0));");
    expect(source).toContain("const chargeableAddonStep = steps.find(candidate => candidate?.isFreeGift === true && candidate?.addonDisplayFree !== true && this.getAddonLineDiscount(candidate));");
    expect(source).toContain("const isChargeableAddonItem = Number(item.stepIndex) === chargeableAddonStepIndex || (item.isFreeGift === true && item.addonDisplayFree !== true);");
    expect(source).toContain("const discountPercentage = combinedDiscountInfo.discountPercentage");
    expect(source).toContain("buildCartLineSourceProperties({");
    expect(source).toContain("discountPercentage,");
    expect(source).toContain("youSave");
    expect(source).toContain("amountPercentage");
    expect(source).toContain("const addonDiscountAmount");
  });

  it("uses combined base + selected add-on discount for visible product-page totals", () => {
    const source = readProductPageWidgetSources();

    expect(source).toContain("const combinedDiscountInfo = this.getDiscountInfoWithSelectedAddonDiscount(discountInfo, totalPrice);");
    expect(source).toContain("const formattedPrice = CurrencyManager.convertAndFormat(combinedDiscountInfo.finalPrice, currencyInfo);");
    expect(source).toContain("const buttonLabel = this._resolveText('addToCartButton', 'Add Bundle to Cart');");
    expect(source).toContain("button.textContent = `${buttonLabel} \\u2022 ${formattedPrice}`;");
    expect(source).toContain("totalPillFinal.textContent = CurrencyManager.convertAndFormat(combinedDiscountInfo.finalPrice, currencyInfo);");
  });

  it("uses combined discount for PPB modal/footer pricing and messaging paths", () => {
    const source = readProductPageWidgetSources();

    expect(source).toContain("this.updateModalHeaderText(totalPrice, totalQuantity, combinedDiscountInfo, currencyInfo);");
    expect(source).toContain("this.updateFooterTotalPrices(totalPrice, combinedDiscountInfo, currencyInfo);");
    expect(source).toContain("this.updateModalDiscountMessaging(totalPrice, totalQuantity, combinedDiscountInfo, currencyInfo);");
    expect(source).toContain("updateModalFooterMessaging()");
    expect(source).toContain("this.renderFooter();");
  });

  it("counts chargeable add-ons in bundle totals while skipping true free gifts", () => {
    const selectedProducts = [
      { paidVariant: 1 },
      { addonVariant: 1 },
    ];
    const stepProductData = [
      [{ variantId: "paidVariant", price: 10000 }],
      [{ variantId: "addonVariant", price: 6000 }],
    ];

    expect(require("../../../app/assets/widgets/shared/pricing-calculator.js").PricingCalculator.calculateBundleTotal(
      selectedProducts,
      stepProductData,
      [{ name: "Step 1" }, { isFreeGift: true, addonDisplayFree: false }],
    )).toMatchObject({
      totalPrice: 16000,
      totalQuantity: 2,
      unitPrices: [10000, 6000],
    });

    expect(require("../../../app/assets/widgets/shared/pricing-calculator.js").PricingCalculator.calculateBundleTotal(
      selectedProducts,
      stepProductData,
      [{ name: "Step 1" }, { isFreeGift: true, addonDisplayFree: true }],
    )).toMatchObject({
      totalPrice: 10000,
      totalQuantity: 1,
      unitPrices: [10000],
    });
  });
});
