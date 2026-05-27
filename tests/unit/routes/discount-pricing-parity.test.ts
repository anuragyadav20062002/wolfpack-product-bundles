/**
 * Unit tests — flat PricingRule parsers
 *
 * Spec: test-spec/discount-pricing-parity.spec.md
 * Issue: [discount-pricing-parity-1]
 */

import {
  parsePricingRule,
  parsePricingConfiguration,
  migrateNestedRule,
} from "../../../app/lib/pricing-rule-parser";

// ---------------------------------------------------------------------------
// parsePricingRule — valid flat format
// ---------------------------------------------------------------------------

describe("parsePricingRule — valid flat format", () => {
  it("parses a minimal quantity percentage rule", () => {
    const raw = { id: "r1", conditionType: "quantity", conditionValue: 2, discountValue: 10 };
    const result = parsePricingRule(raw);
    expect(result).toMatchObject({
      id: "r1",
      conditionType: "quantity",
      conditionValue: 2,
      discountValue: 10,
    });
    expect(result.customerBuys).toBeUndefined();
    expect(result.customerGets).toBeUndefined();
    expect(result.bxyDiscountType).toBeUndefined();
    expect(result.bxyApplyMode).toBeUndefined();
  });

  it("parses an amount rule", () => {
    const raw = { id: "r2", conditionType: "amount", conditionValue: 5000, discountValue: 500 };
    const result = parsePricingRule(raw);
    expect(result.conditionType).toBe("amount");
    expect(result.conditionValue).toBe(5000);
    expect(result.discountValue).toBe(500);
  });

  it("parses a full BXY rule with all fields", () => {
    const raw = {
      id: "r3",
      conditionType: "quantity",
      conditionValue: 2,
      discountValue: 100,
      customerBuys: 2,
      customerGets: 1,
      bxyDiscountType: "percentage",
      bxyApplyMode: "lowest_priced",
    };
    const result = parsePricingRule(raw);
    expect(result.customerBuys).toBe(2);
    expect(result.customerGets).toBe(1);
    expect(result.bxyDiscountType).toBe("percentage");
    expect(result.bxyApplyMode).toBe("lowest_priced");
  });

  it("parses BXY rule without optional applyMode", () => {
    const raw = {
      id: "r4",
      conditionType: "quantity",
      conditionValue: 3,
      discountValue: 50,
      customerBuys: 3,
      customerGets: 1,
      bxyDiscountType: "fixed_amount",
    };
    const result = parsePricingRule(raw);
    expect(result.bxyDiscountType).toBe("fixed_amount");
    expect(result.bxyApplyMode).toBeUndefined();
  });

  it("coerces numeric string values to numbers", () => {
    const raw = { id: "r5", conditionType: "quantity", conditionValue: "3", discountValue: "20" };
    const result = parsePricingRule(raw);
    expect(result.conditionValue).toBe(3);
    expect(result.discountValue).toBe(20);
  });
});

// ---------------------------------------------------------------------------
// parsePricingRule — invalid / missing fields
// ---------------------------------------------------------------------------

describe("parsePricingRule — invalid input", () => {
  it("throws or returns null when id is missing", () => {
    const raw = { conditionType: "quantity", conditionValue: 2, discountValue: 10 };
    expect(() => parsePricingRule(raw)).toThrow();
  });

  it("throws or returns null when conditionType is invalid", () => {
    const raw = { id: "r7", conditionType: "items", conditionValue: 2, discountValue: 5 };
    expect(() => parsePricingRule(raw)).toThrow();
  });

  it("throws or returns null when conditionValue is negative", () => {
    const raw = { id: "r8", conditionType: "quantity", conditionValue: -1, discountValue: 10 };
    expect(() => parsePricingRule(raw)).toThrow();
  });

  it("throws when input is null", () => {
    expect(() => parsePricingRule(null)).toThrow();
  });

  it("throws when input is a string", () => {
    expect(() => parsePricingRule("foo")).toThrow();
  });
});

// ---------------------------------------------------------------------------
// migrateNestedRule — converts old nested shape to flat
// ---------------------------------------------------------------------------

describe("migrateNestedRule — nested → flat conversion", () => {
  it("converts a nested percentage quantity rule", () => {
    const nested = {
      id: "r1",
      condition: { type: "quantity", operator: "gte", value: 3 },
      discount: { method: "percentage_off", value: 15 },
    };
    const result = migrateNestedRule(nested);
    expect(result).toMatchObject({
      id: "r1",
      conditionType: "quantity",
      conditionValue: 3,
      discountValue: 15,
    });
    expect((result as any).condition).toBeUndefined();
    expect((result as any).discount).toBeUndefined();
    expect((result as any).operator).toBeUndefined();
  });

  it("converts a nested amount fixed rule", () => {
    const nested = {
      id: "r2",
      condition: { type: "amount", operator: "gte", value: 10000 },
      discount: { method: "fixed_amount_off", value: 500 },
    };
    const result = migrateNestedRule(nested);
    expect(result.conditionType).toBe("amount");
    expect(result.conditionValue).toBe(10000);
    expect(result.discountValue).toBe(500);
  });

  it("converts BXY nested rule and drops step IDs", () => {
    const nested = {
      id: "r3",
      condition: { type: "quantity", operator: "gte", value: 2 },
      discount: { method: "buy_x_get_y", value: 0 },
      getQty: 1,
      buyStepId: "step-1",
      getStepId: "step-2",
    };
    const result = migrateNestedRule(nested);
    expect(result.conditionType).toBe("quantity");
    expect(result.conditionValue).toBe(2);
    expect(result.discountValue).toBe(0);
    expect(result.customerBuys).toBe(2);
    expect(result.customerGets).toBe(1);
    expect((result as any).buyStepId).toBeUndefined();
    expect((result as any).getStepId).toBeUndefined();
  });

  it("passes through already-flat rules unchanged", () => {
    const flat = { id: "r4", conditionType: "quantity", conditionValue: 2, discountValue: 10 };
    const result = migrateNestedRule(flat as any);
    expect(result).toMatchObject(flat);
  });

  it("falls back to top-level discountValue when discount object is absent", () => {
    const nested = {
      id: "r5",
      condition: { type: "quantity", operator: "gte", value: 2 },
      discountValue: 20,
    };
    const result = migrateNestedRule(nested as any);
    expect(result.conditionValue).toBe(2);
    expect(result.discountValue).toBe(20);
  });
});

// ---------------------------------------------------------------------------
// parsePricingConfiguration — happy path
// ---------------------------------------------------------------------------

describe("parsePricingConfiguration — happy path", () => {
  it("parses an enabled config with two flat rules", () => {
    const raw = {
      enabled: true,
      method: "percentage_off",
      rules: [
        { id: "r1", conditionType: "quantity", conditionValue: 2, discountValue: 10 },
        { id: "r2", conditionType: "quantity", conditionValue: 4, discountValue: 20 },
      ],
      display: { showFooter: true, showDiscountProgressBar: false },
      messages: { progress: "Add more", qualified: "Congrats", showInCart: true },
    };
    const result = parsePricingConfiguration(raw);
    expect(result.enabled).toBe(true);
    expect(result.method).toBe("percentage_off");
    expect(result.rules).toHaveLength(2);
    expect(result.rules[0].conditionValue).toBe(2);
    expect(result.display.showFooter).toBe(true);
  });

  it("parses a disabled config with empty rules array", () => {
    const raw = {
      enabled: false,
      method: "percentage_off",
      rules: [],
      display: { showFooter: true, showDiscountProgressBar: false },
      messages: { progress: "", qualified: "", showInCart: false },
    };
    const result = parsePricingConfiguration(raw);
    expect(result.enabled).toBe(false);
    expect(result.rules).toHaveLength(0);
  });

  it("preserves tierTextByRuleId in messages", () => {
    const raw = {
      enabled: true,
      method: "percentage_off",
      rules: [{ id: "r1", conditionType: "quantity", conditionValue: 3, discountValue: 15 }],
      display: { showFooter: true, showDiscountProgressBar: true },
      messages: {
        progress: "Add more",
        qualified: "Congrats",
        showInCart: true,
        tierTextByRuleId: {
          r1: { tierText: "Add 3", tierSubtext: "1 at 100% off" },
        },
      },
    };
    const result = parsePricingConfiguration(raw);
    expect(result.messages.tierTextByRuleId).toBeDefined();
    expect(result.messages.tierTextByRuleId!["r1"].tierText).toBe("Add 3");
    expect(result.messages.tierTextByRuleId!["r1"].tierSubtext).toBe("1 at 100% off");
  });

  it("preserves tierTextByLocaleByRuleId in messages", () => {
    const raw = {
      enabled: true,
      method: "percentage_off",
      rules: [{ id: "r1", conditionType: "quantity", conditionValue: 3, discountValue: 15 }],
      display: { showFooter: true, showDiscountProgressBar: true },
      messages: {
        progress: "Add more",
        qualified: "Congrats",
        showInCart: true,
        tierTextByLocaleByRuleId: {
          fr: { r1: { tierText: "Ajouter 3", tierSubtext: "1 à 100% de réduction" } },
        },
      },
    };
    const result = parsePricingConfiguration(raw);
    expect(result.messages.tierTextByLocaleByRuleId).toBeDefined();
    expect(result.messages.tierTextByLocaleByRuleId!["fr"]["r1"].tierText).toBe("Ajouter 3");
  });
});
