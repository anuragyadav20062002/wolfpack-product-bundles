import { buildPriceAdjustmentConfig } from "../../../app/services/bundles/metafield-sync/utils/price-adjustment";

describe("buildPriceAdjustmentConfig", () => {
  it("serializes all pricing rules for runtime tier selection", () => {
    const priceAdjustment = buildPriceAdjustmentConfig({
      enabled: true,
      method: "fixed_bundle_price",
      rules: [
        {
          id: "rule-2",
          conditionType: "quantity",
          conditionValue: 2,
          discountValue: 770,
          fixedBundlePrice: 4999,
        },
        {
          id: "rule-3",
          conditionType: "quantity",
          conditionValue: 3,
          discountValue: 1540,
          fixedBundlePrice: 6999,
        },
      ],
    });

    expect(priceAdjustment).toMatchObject({
      method: "fixed_bundle_price",
      value: 4999,
      conditions: {
        type: "quantity",
        operator: "gte",
        value: 2,
      },
      rules: [
        {
          method: "fixed_bundle_price",
          value: 4999,
          conditions: {
            type: "quantity",
            operator: "gte",
            value: 2,
          },
        },
        {
          method: "fixed_bundle_price",
          value: 6999,
          conditions: {
            type: "quantity",
            operator: "gte",
            value: 3,
          },
        },
      ],
    });
  });
});
