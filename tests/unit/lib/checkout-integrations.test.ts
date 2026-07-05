import {
  CHECKOUT_INTEGRATION_PROVIDER_OPTIONS,
  getCheckoutIntegrationProvider,
  isDiscountCodeCheckoutIntegrationProvider,
  isSupportedCheckoutIntegrationProvider,
  normalizeCheckoutIntegrationProvider,
} from "../../../app/lib/checkout-integrations";

describe("checkout integration provider registry", () => {
  it("exposes every provider listed in the EB checkout and side-cart functions article", () => {
    expect(CHECKOUT_INTEGRATION_PROVIDER_OPTIONS).toEqual([
      "Shopify checkout",
      "Theme cart drawer",
      "GoKwik",
      "Shopflo",
      "Zecpay",
      "Rebuy",
      "Shiprocket / Fastrr",
      "Monster cart",
      "Upcart",
      "Kaching Cart",
    ]);
  });

  it("normalizes labels and provider IDs into stable provider IDs", () => {
    expect(normalizeCheckoutIntegrationProvider("Shiprocket / Fastrr")).toBe("shiprocket_fastrr");
    expect(normalizeCheckoutIntegrationProvider("shiprocket_fastrr")).toBe("shiprocket_fastrr");
    expect(normalizeCheckoutIntegrationProvider("Kaching Cart")).toBe("kaching_cart");
    expect(normalizeCheckoutIntegrationProvider("Paste custom script")).toBe("native");
  });

  it("marks only checkout handoff providers as discount-code providers", () => {
    expect(isDiscountCodeCheckoutIntegrationProvider("gokwik")).toBe(true);
    expect(isDiscountCodeCheckoutIntegrationProvider("shopflo")).toBe(true);
    expect(isDiscountCodeCheckoutIntegrationProvider("zecpay")).toBe(true);
    expect(isDiscountCodeCheckoutIntegrationProvider("shiprocket_fastrr")).toBe(true);
    expect(isDiscountCodeCheckoutIntegrationProvider("upcart")).toBe(false);
    expect(isDiscountCodeCheckoutIntegrationProvider("kaching_cart")).toBe(false);
  });

  it("keeps app-proxy discount code creation closed to checkout handoff providers", () => {
    expect(isSupportedCheckoutIntegrationProvider("zecpay")).toBe(true);
    expect(isSupportedCheckoutIntegrationProvider("shiprocket_fastrr")).toBe(true);
    expect(isSupportedCheckoutIntegrationProvider("upcart")).toBe(false);
    expect(isSupportedCheckoutIntegrationProvider("monster_cart")).toBe(false);
  });

  it("keeps callback mode metadata for side-cart integrations", () => {
    expect(getCheckoutIntegrationProvider("theme_cart_drawer")).toMatchObject({
      id: "theme_cart_drawer",
      callbackMode: "side_cart",
      requiresDiscountCode: false,
    });
    expect(getCheckoutIntegrationProvider("rebuy")).toMatchObject({
      id: "rebuy",
      callbackMode: "cart_refresh",
      requiresDiscountCode: false,
    });
  });
});
