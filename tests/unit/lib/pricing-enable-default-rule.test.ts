import { ensurePricingRulesForEnabledState } from "../../../app/lib/pricing-enable-default-rule";
import { DiscountMethod, type PricingRule } from "../../../app/types/pricing";

describe("ensurePricingRulesForEnabledState", () => {
  it("seeds a default rule when pricing is enabled with no rules", () => {
    const rules = ensurePricingRulesForEnabledState({
      enabled: true,
      method: DiscountMethod.PERCENTAGE_OFF,
      rules: [],
    });

    expect(rules).toHaveLength(1);
    expect(rules[0]).toMatchObject({
      conditionType: "quantity",
      conditionValue: 2,
      discountValue: 5,
    });
  });

  it("keeps empty rules empty when pricing is disabled", () => {
    expect(
      ensurePricingRulesForEnabledState({
        enabled: false,
        method: DiscountMethod.PERCENTAGE_OFF,
        rules: [],
      }),
    ).toEqual([]);
  });

  it("preserves existing pricing rules when pricing is enabled", () => {
    const existingRules: PricingRule[] = [
      {
        id: "rule-existing",
        conditionType: "quantity",
        conditionValue: 3,
        discountValue: 10,
      },
    ];

    expect(
      ensurePricingRulesForEnabledState({
        enabled: true,
        method: DiscountMethod.PERCENTAGE_OFF,
        rules: existingRules,
      }),
    ).toBe(existingRules);
  });
});
