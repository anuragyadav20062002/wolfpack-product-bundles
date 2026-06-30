import { readFullPageWidgetSources } from './widget-source-helpers';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PricingCalculator } = require("../../../app/assets/widgets/shared/pricing-calculator.js");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { fullPageStepFooterMethods } =
  require("../../../app/assets/widgets/full-page/methods/step-footer-methods.js");

describe("Full Page widget direct Add-ons contract", () => {
  it("derives an add-on step from direct personalizationData", () => {
    const source = readFullPageWidgetSources();

    expect(source).toContain("applyPersonalizationAddonProducts()");
    expect(source).toContain("buildAddonStepFromPersonalization()");
    expect(source).toContain("const addonProducts = personalizationData?.addonProducts;");
    expect(source).toContain("selectedAddonProducts");
    expect(source).toContain("displayVariantsAsIndividualProducts_addons");
    expect(source).toContain("this.selectedBundle.steps = [...(this.selectedBundle.steps || []), addonStep];");
  });

  it("renders direct add-on eligibility messages with tier variables", () => {
    const source = readFullPageWidgetSources();

    expect(source).toContain("getAddonEligibilityState(step)");
    expect(source).toContain("renderAddonEligibilityMessage(step, eligibilityState)");
    expect(source).toContain("addonsConditionDiff");
    expect(source).toContain("addonsDiscountValue");
    expect(source).toContain("addonsDiscountValueUnit");
    expect(source).toContain("side-panel-addon-message");
  });

  it("renders the direct add-on section title before the tier message", () => {
    const source = readFullPageWidgetSources();

    expect(source).toContain("renderAddonSectionTitle(step)");
    expect(source).toContain("side-panel-addon-title");
    expect(source).toContain("step?.freeGiftName || step?.addonTitle || step?.addonLabel");
  });

  it("does not emit chargeable add-ons as free-gift cart lines", () => {
    const source = readFullPageWidgetSources();

    expect(source).toContain("step?.isFreeGift && step?.addonDisplayFree === true");
    expect(source).not.toContain("if (step?.isFreeGift) properties['_bundle_step_type'] = 'free_gift';");
  });

  it("emits chargeable add-on discount data for Cart Transform", () => {
    const source = readFullPageWidgetSources();

    expect(source).toContain("getAddonLineDiscount(step)");
    expect(source).toContain("if (step?.isFreeGift && step?.addonDisplayFree !== true && addonEval?.tier) {");
    expect(source).toContain("properties._bundle_step_type = addonDiscount && step?.addonDisplayFree !== true");
    expect(source).toContain("`addon:${addonDiscount.type}:${addonDiscount.value}`");
    expect(source).toContain(": 'addon';");
  });

  it("keeps selected add-on discount savings out of parent cart display properties", () => {
    const originalWindow = (global as any).window;
    const paidStep = { id: "paid-step" };
    const paidAddonStep = { id: "addon-step", isFreeGift: true, addonDisplayFree: false };

    try {
      (global as any).window = {
        Shopify: { currency: { active: "USD", format: ["$", "{{amount}}"].join("") } },
      };

      const sourceProperties = fullPageStepFooterMethods.buildCartLineSourceProperties.call(
        {
          selectedBundle: { pricing: { enabled: false, rules: [] } },
        },
        [
          { product: { title: "Paid product", price: 10000 }, quantity: 1, step: paidStep },
          { product: { title: "Paid add-on", price: 6000 }, quantity: 1, step: paidAddonStep },
        ],
      );

      expect(JSON.parse(sourceProperties._bundle_display_properties)).toEqual({
        box: "1",
        items: "1 x Paid product",
        retailPrice: "$100.00",
      });
    } finally {
      (global as any).window = originalWindow;
    }
  });

  it("uses combined base plus selected add-on discount for visible Full Page totals", () => {
    const source = readFullPageWidgetSources();

    expect(source).toContain("const finalPrice = combinedDiscountInfo.hasDiscount ? combinedDiscountInfo.finalPrice : totalPrice;");
    expect(source).toContain("totalPrice, finalPrice, combinedDiscountInfo, currencyInfo, isLastStep");
    expect(source).toContain("${combinedDiscountInfo.hasDiscount ? `<span class=\"side-panel-total-original\">");
  });

  it("uses combined discount for FPB summary tray, progress, and modal messaging paths", () => {
    const source = readFullPageWidgetSources();

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
