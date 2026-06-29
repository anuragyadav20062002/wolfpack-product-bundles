export {};

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { BundlePricingExtension } = require("../../../extensions/bundle-checkout-ui/src/Checkout.tsx");

describe("BundlePricingExtension EB native checkout parity", () => {
  const originalShopify = (global as any).shopify;

  afterEach(() => {
    (global as any).shopify = originalShopify;
  });

  it("does not render a custom panel for bundle parent lines with native checkout attributes", () => {
    (global as any).shopify = {
      target: {
        value: {
          attributes: [
            { key: "_is_bundle_parent", value: "true" },
            { key: "_bundle_total_retail_cents", value: "165800" },
            { key: "_bundle_total_price_cents", value: "157510" },
            { key: "_bundle_total_savings_cents", value: "8290" },
          ],
        },
      },
      cost: {
        totalAmount: {
          value: {
            currencyCode: "USD",
          },
        },
      },
    };

    expect(BundlePricingExtension({})).toBeNull();
  });
});
