import {
  normalizePricingDisplayOptions,
  serializePricingDisplayOptions,
} from "../../../app/lib/pricing-display-options";
import { ConditionOperator, ConditionType, DiscountMethod, type PricingRule } from "../../../app/types/pricing";

function quantityRule(id: string, quantity: number, discountValue: number): PricingRule {
  return {
    id,
    condition: {
      type: ConditionType.QUANTITY,
      operator: ConditionOperator.GTE,
      value: quantity,
    },
    discount: {
      method: DiscountMethod.PERCENTAGE_OFF,
      value: discountValue,
    },
  };
}

function amountRule(id: string, amountCents: number, discountValue: number): PricingRule {
  return {
    id,
    condition: {
      type: ConditionType.AMOUNT,
      operator: ConditionOperator.GTE,
      value: amountCents,
    },
    discount: {
      method: DiscountMethod.FIXED_AMOUNT_OFF,
      value: discountValue,
    },
  };
}

describe("normalizePricingDisplayOptions", () => {
  it("derives bundle quantity option rows from quantity discount rules", () => {
    const result = normalizePricingDisplayOptions({
      rules: [quantityRule("rule-3", 3, 15), quantityRule("rule-5", 5, 25), amountRule("amount-1", 10000, 500)],
      messages: {
        displayOptions: {
          bundleQuantityOptions: {
            enabled: true,
            defaultRuleId: "rule-5",
            optionsByRuleId: {
              "rule-3": { label: "Starter box", subtext: "Small savings" },
            },
          },
        },
      },
    });

    expect(result.bundleQuantityOptions.enabled).toBe(true);
    expect(result.bundleQuantityOptions.defaultRuleId).toBe("rule-5");
    expect(result.bundleQuantityOptions.options).toEqual([
      expect.objectContaining({
        ruleId: "rule-3",
        quantity: 3,
        label: "Starter box",
        subtext: "Small savings",
        isDefault: false,
      }),
      expect.objectContaining({
        ruleId: "rule-5",
        quantity: 5,
        label: "Box of 5",
        subtext: "25% off",
        isDefault: true,
      }),
    ]);
  });

  it("falls back to the first quantity rule when the saved default rule is missing", () => {
    const result = normalizePricingDisplayOptions({
      rules: [quantityRule("rule-2", 2, 10), quantityRule("rule-4", 4, 20)],
      messages: {
        displayOptions: {
          bundleQuantityOptions: {
            enabled: true,
            defaultRuleId: "deleted-rule",
          },
        },
      },
    });

    expect(result.bundleQuantityOptions.defaultRuleId).toBe("rule-2");
    expect(result.bundleQuantityOptions.options[0].isDefault).toBe(true);
    expect(result.bundleQuantityOptions.options[1].isDefault).toBe(false);
  });

  it("marks quantity options blocked when configured steps cannot satisfy the threshold", () => {
    const result = normalizePricingDisplayOptions({
      rules: [quantityRule("rule-5", 5, 20)],
      messages: {
        displayOptions: {
          bundleQuantityOptions: { enabled: true },
        },
      },
      steps: [
        { id: "step-1", enabled: true, maxQuantity: 2 },
        { id: "step-2", enabled: true, maxQuantity: 2 },
      ],
    });

    expect(result.bundleQuantityOptions.options[0].compatibility).toEqual({
      status: "blocked",
      reason: "Configured steps allow up to 4 items, below this 5 item option.",
    });
  });

  it("normalizes full progress bar settings and derives milestones from quantity and amount rules", () => {
    const result = normalizePricingDisplayOptions({
      rules: [quantityRule("rule-3", 3, 15), amountRule("amount-100", 10000, 500)],
      showProgressBar: true,
      messages: {
        displayOptions: {
          progressBar: {
            enabled: true,
            type: "step_based",
            progressText: "Add {{itemsNeeded}} more to unlock {{discountText}}",
            successText: "{{discountText}} unlocked",
          },
        },
      },
    });

    expect(result.progressBar).toEqual({
      enabled: true,
      type: "step_based",
      progressText: "Add {{itemsNeeded}} more to unlock {{discountText}}",
      successText: "{{discountText}} unlocked",
      milestones: [
        expect.objectContaining({ ruleId: "rule-3", conditionType: "quantity", value: 3 }),
        expect.objectContaining({ ruleId: "amount-100", conditionType: "amount", value: 10000 }),
      ],
    });
  });

  it("uses neutral progress bar templates when saved text is missing", () => {
    const result = normalizePricingDisplayOptions({
      rules: [quantityRule("rule-3", 3, 15)],
      messages: {
        displayOptions: {
          progressBar: {
            enabled: true,
            type: "simple",
          },
        },
      },
    });

    expect(result.progressBar.progressText).toBe("Add {{conditionText}} to unlock {{discountText}}");
    expect(result.progressBar.successText).toBe("{{discountText}} unlocked");
  });

  it("defaults progress bar mode to step based to preserve existing widget behavior", () => {
    const result = normalizePricingDisplayOptions({
      rules: [quantityRule("rule-3", 3, 15)],
      showProgressBar: true,
      messages: {},
    });

    expect(result.progressBar.type).toBe("step_based");
  });
});

describe("serializePricingDisplayOptions", () => {
  it("preserves existing message settings while writing displayOptions metadata", () => {
    const normalized = normalizePricingDisplayOptions({
      rules: [quantityRule("rule-3", 3, 15), quantityRule("rule-5", 5, 25)],
      messages: {
        showDiscountMessaging: true,
        ruleMessages: {
          "rule-3": {
            discountText: "Add more",
            successMessage: "Saved",
          },
        },
        displayOptions: {
          bundleQuantityOptions: {
            enabled: true,
            defaultRuleId: "rule-5",
          },
          progressBar: {
            enabled: true,
            type: "simple",
            progressText: "Add {{conditionText}} to unlock {{discountText}}",
            successText: "{{discountText}} unlocked",
          },
        },
      },
    });

    expect(serializePricingDisplayOptions({
      existingMessages: {
        showDiscountMessaging: true,
        ruleMessages: {
          "rule-3": {
            discountText: "Add more",
            successMessage: "Saved",
          },
        },
      },
      options: normalized,
    })).toEqual({
      showDiscountMessaging: true,
      ruleMessages: {
        "rule-3": {
          discountText: "Add more",
          successMessage: "Saved",
        },
      },
      displayOptions: {
        bundleQuantityOptions: {
          enabled: true,
          defaultRuleId: "rule-5",
          optionsByRuleId: {
            "rule-3": { label: "Box of 3", subtext: "15% off" },
            "rule-5": { label: "Box of 5", subtext: "25% off" },
          },
        },
        progressBar: {
          enabled: true,
          type: "simple",
          progressText: "Add {{conditionText}} to unlock {{discountText}}",
          successText: "{{discountText}} unlocked",
        },
      },
    });
  });
});
