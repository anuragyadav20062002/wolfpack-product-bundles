import { createNewPricingRule, DiscountMethod } from "../../../app/types/pricing";

describe("createNewPricingRule live admin defaults", () => {
  it("creates a percentage-off default rule", () => {
    expect(createNewPricingRule(DiscountMethod.PERCENTAGE_OFF)).toMatchObject({
      conditionType: "quantity",
      conditionValue: 2,
      discountValue: 5,
    });
  });

  it("creates a fixed-amount default rule in cents", () => {
    expect(createNewPricingRule(DiscountMethod.FIXED_AMOUNT_OFF)).toMatchObject({
      conditionType: "quantity",
      conditionValue: 2,
      discountValue: 500,
    });
  });

  it("creates a fixed-bundle-price default rule in cents", () => {
    expect(createNewPricingRule(DiscountMethod.FIXED_BUNDLE_PRICE)).toMatchObject({
      conditionType: "quantity",
      conditionValue: 2,
      discountValue: 500,
    });
  });

  it("creates a Buy X, get Y default offer", () => {
    expect(createNewPricingRule(DiscountMethod.BUY_X_GET_Y)).toMatchObject({
      conditionType: "quantity",
      conditionValue: 2,
      discountValue: 100,
      customerBuys: 2,
      customerGets: 1,
      bxyDiscountType: "percentage",
      bxyApplyMode: "lowest_priced",
    });
  });
});
