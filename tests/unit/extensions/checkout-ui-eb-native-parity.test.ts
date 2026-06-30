export {};

// eslint-disable-next-line @typescript-eslint/no-require-imports
const {
  BundlePricingExtension,
  TotalSavingsExtension,
  calculateCheckoutTotalSavings,
  formatCheckoutMoney,
} = require("../../../extensions/bundle-checkout-ui/src/Checkout.tsx");

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

describe("TotalSavingsExtension EB checkout parity", () => {
  const originalShopify = (global as any).shopify;

  afterEach(() => {
    (global as any).shopify = originalShopify;
  });

  it("renders nothing when checkout has no savings", () => {
    (global as any).shopify = {
      lines: { value: [] },
      discountAllocations: { value: [] },
      cost: {
        totalAmount: {
          value: { amount: 1658, currencyCode: "USD" },
        },
      },
    };

    expect(TotalSavingsExtension({})).toBeNull();
  });

  it("renders EB-style total savings from native checkout discount allocations", () => {
    (global as any).shopify = {
      lines: {
        value: [
          {
            attributes: [{ key: "Box", value: "1" }],
            discountAllocations: [
              { discountedAmount: { amount: 82.9, currencyCode: "USD" } },
            ],
          },
        ],
      },
      discountAllocations: {
        value: [{ discountedAmount: { amount: 82.9, currencyCode: "USD" } }],
      },
      cost: {
        totalAmount: {
          value: { amount: 1575.1, currencyCode: "USD" },
        },
      },
    };

    const rendered = TotalSavingsExtension({});

    expect(rendered.type).toBe("s-grid");
    expect(rendered.props.children[0].props.children).toBe("TOTAL SAVINGS");
    expect(rendered.props.children[1].props.children).toBe("$82.90");
  });

  it("includes Cart Transform bundle savings attributes when native allocations are absent", () => {
    expect(
      calculateCheckoutTotalSavings({
        lines: [
          {
            attributes: [
              { key: "_is_bundle_parent", value: "true" },
              { key: "_bundle_total_savings_cents", value: "8290" },
            ],
            discountAllocations: [],
          },
        ],
        discountAllocations: [],
      }),
    ).toBe(82.9);
  });

  it("formats savings with the active checkout currency", () => {
    expect(formatCheckoutMoney(82.9, "INR")).toBe("₹82.90");
  });
});
