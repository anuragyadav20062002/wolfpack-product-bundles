/**
 * Unit tests — mapDiscountMethod
 *
 * Issue: [ppb-edit-bundle-flow-1]
 */

import { mapDiscountMethod } from "../../../app/utils/discount-mappers";
import { DiscountMethod } from "../../../app/types/pricing";

describe("mapDiscountMethod", () => {
  it("maps DiscountMethod.PERCENTAGE_OFF to string", () => {
    expect(mapDiscountMethod(DiscountMethod.PERCENTAGE_OFF)).toBe("percentage_off");
  });

  it("maps DiscountMethod.FIXED_AMOUNT_OFF to string", () => {
    expect(mapDiscountMethod(DiscountMethod.FIXED_AMOUNT_OFF)).toBe("fixed_amount_off");
  });

  it("maps DiscountMethod.FIXED_BUNDLE_PRICE to string", () => {
    expect(mapDiscountMethod(DiscountMethod.FIXED_BUNDLE_PRICE)).toBe("fixed_bundle_price");
  });

  it("maps DiscountMethod.BUY_X_GET_Y to string", () => {
    expect(mapDiscountMethod(DiscountMethod.BUY_X_GET_Y)).toBe("buy_x_get_y");
  });

  it("maps raw string 'buy_x_get_y' to string", () => {
    expect(mapDiscountMethod("buy_x_get_y")).toBe("buy_x_get_y");
  });

  it("falls back to percentage_off for unknown methods", () => {
    expect(mapDiscountMethod("unknown_method")).toBe("percentage_off");
  });
});
