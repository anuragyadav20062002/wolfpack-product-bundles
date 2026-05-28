import { readFileSync } from "node:fs";
import { join } from "node:path";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PricingCalculator } = require("../../../app/assets/widgets/shared/pricing-calculator.js");

describe("Full Page widget direct Add-ons contract", () => {
  it("derives an add-on step from direct personalizationData", () => {
    const source = readFileSync(
      join(process.cwd(), "app/assets/bundle-widget-full-page.js"),
      "utf8",
    );

    expect(source).toContain("applyPersonalizationAddonProducts()");
    expect(source).toContain("buildAddonStepFromPersonalization()");
    expect(source).toContain("const addonProducts = personalizationData?.addonProducts;");
    expect(source).toContain("selectedAddonProducts");
    expect(source).toContain("displayVariantsAsIndividualProducts_addons");
    expect(source).toContain("this.selectedBundle.steps = [...(this.selectedBundle.steps || []), addonStep];");
  });

  it("renders direct add-on eligibility messages with tier variables", () => {
    const source = readFileSync(
      join(process.cwd(), "app/assets/bundle-widget-full-page.js"),
      "utf8",
    );

    expect(source).toContain("getAddonEligibilityState(step)");
    expect(source).toContain("renderAddonEligibilityMessage(step, eligibilityState)");
    expect(source).toContain("addonsConditionDiff");
    expect(source).toContain("addonsDiscountValue");
    expect(source).toContain("addonsDiscountValueUnit");
    expect(source).toContain("side-panel-addon-message");
  });

  it("renders the direct add-on section title before the tier message", () => {
    const source = readFileSync(
      join(process.cwd(), "app/assets/bundle-widget-full-page.js"),
      "utf8",
    );

    expect(source).toContain("renderAddonSectionTitle(step)");
    expect(source).toContain("side-panel-addon-title");
    expect(source).toContain("step?.freeGiftName || step?.addonTitle || step?.addonLabel");
  });

  it("does not emit chargeable add-ons as free-gift cart lines", () => {
    const source = readFileSync(
      join(process.cwd(), "app/assets/bundle-widget-full-page.js"),
      "utf8",
    );

    expect(source).toContain("step?.isFreeGift && step?.addonDisplayFree === true");
    expect(source).not.toContain("if (step?.isFreeGift) properties['_bundle_step_type'] = 'free_gift';");
  });

  it("emits chargeable add-on discount data for Cart Transform", () => {
    const source = readFileSync(
      join(process.cwd(), "app/assets/bundle-widget-full-page.js"),
      "utf8",
    );

    expect(source).toContain("getAddonLineDiscount(step)");
    expect(source).toContain("if (addonDiscount && step?.addonDisplayFree !== true) {");
    expect(source).toContain("properties['_bundle_step_type'] = addonDiscount");
    expect(source).toContain("`addon:${addonDiscount.type}:${addonDiscount.value}`");
    expect(source).toContain(": 'addon';");
  });

  it("includes selected add-on discount savings in cart display properties", () => {
    const source = readFileSync(
      join(process.cwd(), "app/assets/bundle-widget-full-page.js"),
      "utf8",
    );

    expect(source).toContain("calculateSelectedAddonDiscountAmount()");
    expect(source).toContain("getDiscountInfoWithSelectedAddonDiscount(discountInfo, totalPrice)");
    expect(source).toContain("const combinedDiscountAmount = Math.min(totalPrice, baseDiscountAmount + addonDiscountAmount);");
    expect(source).toContain("discountPercentage: totalPrice > 0 ? (combinedDiscountAmount / totalPrice) * 100 : 0,");
    expect(source).toContain("const combinedDiscountInfo = this.getDiscountInfoWithSelectedAddonDiscount(discountInfo, totalPrice);");
    expect(source).toContain("return this.getAllSelectedProductsData().reduce((total, item) => {");
    expect(source).toContain("const step = steps[item.stepIndex];");
    expect(source).toContain("const chargeableAddonStep = steps.find(candidate => candidate?.isFreeGift === true && candidate?.addonDisplayFree !== true && this.getAddonLineDiscount(candidate));");
    expect(source).toContain("const chargeableAddonStepIndex = steps.indexOf(chargeableAddonStep);");
    expect(source).toContain("const chargeableAddonProductKeys = this.getAddonProductSelectionKeys(chargeableAddonStep);");
    expect(source).toContain("getAddonProductSelectionKeys(step)");
    expect(source).toContain("chargeableAddonProductKeys.has(String(this.extractId(item.variantId) || item.variantId))");
    expect(source).toContain("const isChargeableAddonItem = Number(item.stepIndex) === chargeableAddonStepIndex || (item.isFreeGift === true && item.addonDisplayFree !== true);");
    expect(source).toContain("const isChargeableAddonProduct = chargeableAddonProductKeys.has(String(this.extractId(item.variantId) || item.variantId))");
    expect(source).toContain("if (!isChargeableAddonItem && !isChargeableAddonProduct) return total;");
    expect(source).not.toContain("const discountPercentage = discountInfo.discountPercentage\n      ||");
    expect(source).toContain("const discountPercentage = totalPrice > 0 ? (discountAmount / totalPrice) * 100 : 0;");
    expect(source).toContain("if (!addonDiscount) return total;");
  });

  it("uses combined base plus selected add-on discount for visible Full Page totals", () => {
    const source = readFileSync(
      join(process.cwd(), "app/assets/bundle-widget-full-page.js"),
      "utf8",
    );

    expect(source).toContain("const finalPrice = combinedDiscountInfo.hasDiscount ? combinedDiscountInfo.finalPrice : totalPrice;");
    expect(source).toContain("totalPrice, finalPrice, combinedDiscountInfo, currencyInfo, isLastStep");
    expect(source).toContain("${combinedDiscountInfo.hasDiscount ? `<span class=\"side-panel-total-original\">");
  });

  it("uses combined discount for FPB summary tray, progress, and modal messaging paths", () => {
    const source = readFileSync(
      join(process.cwd(), "app/assets/bundle-widget-full-page.js"),
      "utf8",
    );

    expect(source).toContain("combinedDiscountInfo.hasDiscount");
    expect(source).toContain("const progressBar = this._renderDiscountProgress({");
    expect(source).toContain("combinedDiscountInfo,");
    expect(source).toContain("const discountInfo = this.getDiscountInfoWithSelectedAddonDiscount(");
    expect(source).toContain("this.selectedBundle, totalPrice, totalQuantity, combinedDiscountInfo, currencyInfo");
    expect(source).toContain("this.updateModalHeaderText(totalPrice, totalQuantity, combinedDiscountInfo, currencyInfo);");
    expect(source).toContain("this.updateModalDiscountMessaging(totalPrice, totalQuantity, combinedDiscountInfo, currencyInfo);");
    expect(source).toContain("this.updateFooterTotalPrices(totalPrice, combinedDiscountInfo, currencyInfo);");
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

    expect(PricingCalculator.calculateBundleTotal(
      selectedProducts,
      stepProductData,
      [{ name: "Step 1" }, { isFreeGift: true, addonDisplayFree: false }],
    )).toMatchObject({
      totalPrice: 16000,
      totalQuantity: 2,
      unitPrices: [10000, 6000],
    });

    expect(PricingCalculator.calculateBundleTotal(
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
