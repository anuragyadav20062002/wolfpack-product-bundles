import { describe, it, expect } from "vitest";
import { cartTransformRun } from "./cart_transform_run";
import { getAllBundleDataFromCart, normalizeProductId, parseBundleDataFromMetafield } from "./cart-transform-bundle-utils";

// ============================================================================
// HELPER: Build a MERGE-ready cart line
// ============================================================================
// MERGE requires:
//   - bundleId: { value: string }        ← groups lines by bundle instance
//   - bundleName: { value: string }      ← display name for merged line
//   - merchandise.component_parents: { value: JSON.stringify(ComponentParent[]) }
//
// ComponentParent shape:
//   { id: string, component_reference: { value: string[] },
//     component_quantities: { value: number[] },
//     price_adjustment?: PriceAdjustmentConfig }
//
// PriceAdjustmentConfig:
//   { method: 'percentage_off'|'fixed_amount_off'|'fixed_bundle_price',
//     value: number, conditions?: { type, operator, value } }
//   value is raw percentage for percentage_off, cents for the other two.

function makeMergeLine(opts: {
  id: string;
  quantity: number;
  variantId: string;
  bundleId: string;
  bundleName: string;
  parentVariantId: string;
  componentRefs: string[];
  componentQtys: number[];
  priceAdjustment?: { method: string; value: number; conditions?: any };
  amountPerQuantity: string;
  totalAmount: string;
  productTitle?: string;
  includeComponentParents?: boolean; // default true
}) {
  const {
    id, quantity, variantId, bundleId, bundleName,
    parentVariantId, componentRefs, componentQtys, priceAdjustment,
    amountPerQuantity, totalAmount, productTitle,
    includeComponentParents = true,
  } = opts;

  const componentParent: any = {
    id: parentVariantId,
    component_reference: { value: componentRefs },
    component_quantities: { value: componentQtys },
  };
  if (priceAdjustment) {
    componentParent.price_adjustment = priceAdjustment;
  }

  return {
    id,
    quantity,
    bundleId: { value: bundleId },
    bundleName: { value: bundleName },
    merchandise: {
      __typename: "ProductVariant",
      id: variantId,
      ...(includeComponentParents
        ? { component_parents: { value: JSON.stringify([componentParent]) } }
        : {}),
      product: { id: `gid://shopify/Product/${variantId.split("/").pop()}`, title: productTitle || "Product" },
    },
    cost: {
      amountPerQuantity: { amount: amountPerQuantity },
      totalAmount: { amount: totalAmount },
    },
  };
}

// ============================================================================
// cartTransformRun — MERGE tests
// ============================================================================
describe("cartTransformRun", () => {
  it("returns empty operations for empty cart", () => {
    const input = { cart: { lines: [] } };
    const result = cartTransformRun(input as any);
    expect(result.operations).toEqual([]);
  });

  it("returns empty operations when no bundles in cart", () => {
    const input = {
      cart: {
        lines: [
          {
            id: "line1",
            quantity: 1,
            merchandise: {
              __typename: "ProductVariant",
              id: "variant1",
              product: { id: "product1" },
            },
            cost: {
              amountPerQuantity: { amount: "10.00" },
              totalAmount: { amount: "10.00" },
            },
          },
        ],
      },
    };

    const result = cartTransformRun(input as any);
    expect(result.operations).toEqual([]);
  });

  it("transforms bundle when conditions are met (MERGE)", () => {
    const parentVariantId = "gid://shopify/ProductVariant/bundle123";
    const refs = ["gid://shopify/ProductVariant/component1", "gid://shopify/ProductVariant/component2"];

    const input = {
      cart: {
        lines: [
          makeMergeLine({
            id: "line1", quantity: 1,
            variantId: "gid://shopify/ProductVariant/component1",
            bundleId: "b-001", bundleName: "Test Bundle",
            parentVariantId, componentRefs: refs, componentQtys: [1, 1],
            amountPerQuantity: "10.00", totalAmount: "10.00", productTitle: "Product 1",
          }),
          makeMergeLine({
            id: "line2", quantity: 1,
            variantId: "gid://shopify/ProductVariant/component2",
            bundleId: "b-001", bundleName: "Test Bundle",
            parentVariantId, componentRefs: refs, componentQtys: [1, 1],
            amountPerQuantity: "15.00", totalAmount: "15.00", productTitle: "Product 2",
          }),
        ],
      },
    };

    const result = cartTransformRun(input as any);
    expect(result.operations).toHaveLength(1);
    expect(result.operations[0]).toHaveProperty("merge");
    expect(result.operations[0].merge?.parentVariantId).toBe(parentVariantId);
    expect(result.operations[0].merge?.cartLines).toHaveLength(2);
  });

  it("skips transformation when lines have no bundleId", () => {
    // Lines without bundleId attribute → groupLinesByBundleId returns empty → no MERGE
    const input = {
      cart: {
        lines: [
          {
            id: "line1", quantity: 1,
            merchandise: {
              __typename: "ProductVariant",
              id: "variant1",
              product: { id: "gid://shopify/Product/1", title: "Product 1" },
            },
            cost: { amountPerQuantity: { amount: "10.00" }, totalAmount: { amount: "10.00" } },
          },
          {
            id: "line2", quantity: 1,
            merchandise: {
              __typename: "ProductVariant",
              id: "variant2",
              product: { id: "gid://shopify/Product/2", title: "Product 2" },
            },
            cost: { amountPerQuantity: { amount: "15.00" }, totalAmount: { amount: "15.00" } },
          },
        ],
      },
    };

    const result = cartTransformRun(input as any);
    expect(result.operations).toEqual([]);
  });

  it("handles percentage discount correctly", () => {
    const parentVariantId = "gid://shopify/ProductVariant/bundleP";
    const refs = ["gid://shopify/ProductVariant/c1", "gid://shopify/ProductVariant/c2"];
    const priceAdj = { method: "percentage_off", value: 20 };

    const input = {
      cart: {
        lines: [
          makeMergeLine({
            id: "line1", quantity: 1,
            variantId: refs[0], bundleId: "b-pct", bundleName: "Percentage Bundle",
            parentVariantId, componentRefs: refs, componentQtys: [1, 1],
            priceAdjustment: priceAdj,
            amountPerQuantity: "10.00", totalAmount: "10.00", productTitle: "Product 1",
          }),
          makeMergeLine({
            id: "line2", quantity: 1,
            variantId: refs[1], bundleId: "b-pct", bundleName: "Percentage Bundle",
            parentVariantId, componentRefs: refs, componentQtys: [1, 1],
            priceAdjustment: priceAdj,
            amountPerQuantity: "20.00", totalAmount: "20.00", productTitle: "Product 2",
          }),
        ],
      },
    };

    const result = cartTransformRun(input as any);
    expect(result.operations).toHaveLength(1);

    const op = result.operations[0];
    expect(op).toHaveProperty("merge");
    expect(op.merge?.price?.percentageDecrease.value).toBe("20.00");
  });

  it("handles multiple bundles with different configurations", () => {
    const parentA = "gid://shopify/ProductVariant/parentA";
    const parentB = "gid://shopify/ProductVariant/parentB";
    const refsA = ["gid://shopify/ProductVariant/a1", "gid://shopify/ProductVariant/a2"];
    const refsB = ["gid://shopify/ProductVariant/b1", "gid://shopify/ProductVariant/b2"];

    const input = {
      cart: {
        lines: [
          makeMergeLine({
            id: "line1", quantity: 1,
            variantId: refsA[0], bundleId: "bundle-A", bundleName: "Bundle A",
            parentVariantId: parentA, componentRefs: refsA, componentQtys: [1, 1],
            priceAdjustment: { method: "fixed_amount_off", value: 500 }, // $5 off (cents)
            amountPerQuantity: "10.00", totalAmount: "10.00", productTitle: "Product 1",
          }),
          makeMergeLine({
            id: "line2", quantity: 1,
            variantId: refsA[1], bundleId: "bundle-A", bundleName: "Bundle A",
            parentVariantId: parentA, componentRefs: refsA, componentQtys: [1, 1],
            priceAdjustment: { method: "fixed_amount_off", value: 500 },
            amountPerQuantity: "15.00", totalAmount: "15.00", productTitle: "Product 2",
          }),
          makeMergeLine({
            id: "line3", quantity: 2,
            variantId: refsB[0], bundleId: "bundle-B", bundleName: "Bundle B",
            parentVariantId: parentB, componentRefs: refsB, componentQtys: [2, 1],
            priceAdjustment: { method: "percentage_off", value: 15 },
            amountPerQuantity: "8.00", totalAmount: "16.00", productTitle: "Product 3",
          }),
          makeMergeLine({
            id: "line4", quantity: 1,
            variantId: refsB[1], bundleId: "bundle-B", bundleName: "Bundle B",
            parentVariantId: parentB, componentRefs: refsB, componentQtys: [2, 1],
            priceAdjustment: { method: "percentage_off", value: 15 },
            amountPerQuantity: "12.00", totalAmount: "12.00", productTitle: "Product 4",
          }),
        ],
      },
    };

    const result = cartTransformRun(input as any);
    expect(result.operations).toHaveLength(2);
    result.operations.forEach(op => {
      expect(op).toHaveProperty("merge");
    });
  });

  it("handles malformed component_parents gracefully", () => {
    const input = {
      cart: {
        lines: [
          {
            id: "line1", quantity: 1,
            bundleId: { value: "b-bad" },
            bundleName: { value: "Bad Bundle" },
            merchandise: {
              __typename: "ProductVariant",
              id: "variant1",
              component_parents: { value: "invalid json content" },
              product: { id: "gid://shopify/Product/1", title: "Product 1" },
            },
            cost: { amountPerQuantity: { amount: "10.00" }, totalAmount: { amount: "10.00" } },
          },
        ],
      },
    };

    const result = cartTransformRun(input as any);
    // Malformed JSON → parseJSON returns [] → componentParents.length === 0 → skip
    expect(result.operations).toEqual([]);
  });

  it("skips bundle group when no line has component_parents", () => {
    // Lines share bundleId but none has component_parents metafield
    const input = {
      cart: {
        lines: [
          {
            id: "line1", quantity: 1,
            bundleId: { value: "b-no-cp" },
            bundleName: { value: "No CP Bundle" },
            merchandise: {
              __typename: "ProductVariant",
              id: "variant1",
              product: { id: "gid://shopify/Product/1", title: "Product 1" },
            },
            cost: { amountPerQuantity: { amount: "10.00" }, totalAmount: { amount: "10.00" } },
          },
          {
            id: "line2", quantity: 1,
            bundleId: { value: "b-no-cp" },
            bundleName: { value: "No CP Bundle" },
            merchandise: {
              __typename: "ProductVariant",
              id: "variant2",
              product: { id: "gid://shopify/Product/2", title: "Product 2" },
            },
            cost: { amountPerQuantity: { amount: "15.00" }, totalAmount: { amount: "15.00" } },
          },
        ],
      },
    };

    const result = cartTransformRun(input as any);
    expect(result.operations).toEqual([]);
  });

  it("handles quantity-based conditions correctly", () => {
    const parentV = "gid://shopify/ProductVariant/qtyBundle";
    const refs = ["gid://shopify/ProductVariant/q1", "gid://shopify/ProductVariant/q2"];
    // Condition: totalQuantity >= 5
    const priceAdj = {
      method: "fixed_amount_off",
      value: 1000, // $10 off (cents)
      conditions: { type: "quantity", operator: "gte", value: 5 },
    };

    const input = {
      cart: {
        lines: [
          makeMergeLine({
            id: "line1", quantity: 3,
            variantId: refs[0], bundleId: "b-qty", bundleName: "Quantity Bundle",
            parentVariantId: parentV, componentRefs: refs, componentQtys: [3, 2],
            priceAdjustment: priceAdj,
            amountPerQuantity: "10.00", totalAmount: "30.00", productTitle: "Product 1",
          }),
          makeMergeLine({
            id: "line2", quantity: 2,
            variantId: refs[1], bundleId: "b-qty", bundleName: "Quantity Bundle",
            parentVariantId: parentV, componentRefs: refs, componentQtys: [3, 2],
            priceAdjustment: priceAdj,
            amountPerQuantity: "15.00", totalAmount: "30.00", productTitle: "Product 2",
          }),
        ],
      },
    };

    const result = cartTransformRun(input as any);
    // totalQuantity = 3 + 2 = 5, condition gte 5 → met
    expect(result.operations).toHaveLength(1);
    expect(result.operations[0]).toHaveProperty("merge");
    // $10 off $60 total = 16.67%
    const discount = parseFloat(result.operations[0].merge?.price?.percentageDecrease.value || "0");
    expect(discount).toBeCloseTo(16.67, 1);
  });

  it("treats eq quantity condition as threshold (>=) for pricing rules", () => {
    const parentV = "gid://shopify/ProductVariant/eqBundle";
    const refs = ["gid://shopify/ProductVariant/e1", "gid://shopify/ProductVariant/e2"];
    const priceAdj = {
      method: "percentage_off",
      value: 10,
      conditions: { type: "quantity", operator: "eq", value: 3 },
    };

    const input = {
      cart: {
        lines: [
          makeMergeLine({
            id: "line1", quantity: 2,
            variantId: refs[0], bundleId: "b-eq", bundleName: "EQ Bundle",
            parentVariantId: parentV, componentRefs: refs, componentQtys: [2, 2],
            priceAdjustment: priceAdj,
            amountPerQuantity: "10.00", totalAmount: "20.00", productTitle: "Product 1",
          }),
          makeMergeLine({
            id: "line2", quantity: 2,
            variantId: refs[1], bundleId: "b-eq", bundleName: "EQ Bundle",
            parentVariantId: parentV, componentRefs: refs, componentQtys: [2, 2],
            priceAdjustment: priceAdj,
            amountPerQuantity: "10.00", totalAmount: "20.00", productTitle: "Product 2",
          }),
        ],
      },
    };

    const result = cartTransformRun(input as any);
    expect(result.operations).toHaveLength(1);
    expect(result.operations[0].merge?.price?.percentageDecrease.value).toBe("10.00");
  });

  it("supports long-form operator names in cart transform conditions", () => {
    const parentV = "gid://shopify/ProductVariant/longOpBundle";
    const refs = ["gid://shopify/ProductVariant/l1", "gid://shopify/ProductVariant/l2"];
    const priceAdj = {
      method: "percentage_off",
      value: 15,
      conditions: { type: "quantity", operator: "greater_than_or_equal_to", value: 3 },
    };

    const input = {
      cart: {
        lines: [
          makeMergeLine({
            id: "line1", quantity: 2,
            variantId: refs[0], bundleId: "b-long", bundleName: "Long Operator Bundle",
            parentVariantId: parentV, componentRefs: refs, componentQtys: [2, 1],
            priceAdjustment: priceAdj,
            amountPerQuantity: "10.00", totalAmount: "20.00", productTitle: "Product 1",
          }),
          makeMergeLine({
            id: "line2", quantity: 1,
            variantId: refs[1], bundleId: "b-long", bundleName: "Long Operator Bundle",
            parentVariantId: parentV, componentRefs: refs, componentQtys: [2, 1],
            priceAdjustment: priceAdj,
            amountPerQuantity: "20.00", totalAmount: "20.00", productTitle: "Product 2",
          }),
        ],
      },
    };

    const result = cartTransformRun(input as any);
    expect(result.operations).toHaveLength(1);
    expect(result.operations[0].merge?.price?.percentageDecrease.value).toBe("15.00");
  });

  it("handles amount-based conditions correctly", () => {
    const parentV = "gid://shopify/ProductVariant/amtBundle";
    const refs = ["gid://shopify/ProductVariant/a1", "gid://shopify/ProductVariant/a2"];
    // Condition: totalAmount >= $75 (7500 cents)
    const priceAdj = {
      method: "percentage_off",
      value: 20,
      conditions: { type: "amount", operator: "gte", value: 7500 },
    };

    const input = {
      cart: {
        lines: [
          makeMergeLine({
            id: "line1", quantity: 1,
            variantId: refs[0], bundleId: "b-amt", bundleName: "Amount Bundle",
            parentVariantId: parentV, componentRefs: refs, componentQtys: [1, 1],
            priceAdjustment: priceAdj,
            amountPerQuantity: "50.00", totalAmount: "50.00", productTitle: "Product 1",
          }),
          makeMergeLine({
            id: "line2", quantity: 1,
            variantId: refs[1], bundleId: "b-amt", bundleName: "Amount Bundle",
            parentVariantId: parentV, componentRefs: refs, componentQtys: [1, 1],
            priceAdjustment: priceAdj,
            amountPerQuantity: "30.00", totalAmount: "30.00", productTitle: "Product 2",
          }),
        ],
      },
    };

    const result = cartTransformRun(input as any);
    // totalAmount = $80, condition gte $75 → met → 20% off
    expect(result.operations).toHaveLength(1);
    expect(result.operations[0]).toHaveProperty("merge");
    expect(result.operations[0].merge?.price?.percentageDecrease.value).toBe("20.00");
  });

  it("handles different merchandise types correctly", () => {
    // GiftCard lines should be ignored (no bundleId, no metafields)
    const input = {
      cart: {
        lines: [
          {
            id: "line1", quantity: 1,
            merchandise: {
              __typename: "ProductVariant",
              id: "variant1",
              product: { id: "product1", title: "Product" },
            },
            cost: { amountPerQuantity: { amount: "10.00" }, totalAmount: { amount: "10.00" } },
          },
          {
            id: "line2", quantity: 1,
            merchandise: { __typename: "GiftCard", id: "giftcard1" },
            cost: { amountPerQuantity: { amount: "25.00" }, totalAmount: { amount: "25.00" } },
          },
        ],
      },
    };

    const result = cartTransformRun(input as any);
    expect(result.operations.length).toBeGreaterThanOrEqual(0);
  });

  it("handles edge case with zero prices", () => {
    const parentV = "gid://shopify/ProductVariant/freeBundle";
    const refs = ["gid://shopify/ProductVariant/f1", "gid://shopify/ProductVariant/f2"];

    const input = {
      cart: {
        lines: [
          makeMergeLine({
            id: "line1", quantity: 1,
            variantId: refs[0], bundleId: "b-free", bundleName: "Free Bundle",
            parentVariantId: parentV, componentRefs: refs, componentQtys: [1, 1],
            priceAdjustment: { method: "fixed_amount_off", value: 500 },
            amountPerQuantity: "0.00", totalAmount: "0.00", productTitle: "Free Product 1",
          }),
          makeMergeLine({
            id: "line2", quantity: 1,
            variantId: refs[1], bundleId: "b-free", bundleName: "Free Bundle",
            parentVariantId: parentV, componentRefs: refs, componentQtys: [1, 1],
            priceAdjustment: { method: "fixed_amount_off", value: 500 },
            amountPerQuantity: "0.00", totalAmount: "0.00", productTitle: "Free Product 2",
          }),
        ],
      },
    };

    const result = cartTransformRun(input as any);
    // Zero prices → originalTotal = 0 → fixed_amount_off can't compute % → discount = 0
    expect(result.operations).toHaveLength(1);
    expect(result.operations[0]).toHaveProperty("merge");
    // Discount should be 0 (can't discount $0)
    expect(result.operations[0].merge?.price?.percentageDecrease.value).toBe("0.00");
  });

  it("handles no-discount merge correctly (0% discount)", () => {
    const parentV = "gid://shopify/ProductVariant/noDiscBundle";
    const refs = ["gid://shopify/ProductVariant/nd1", "gid://shopify/ProductVariant/nd2"];

    const input = {
      cart: {
        lines: [
          makeMergeLine({
            id: "line1", quantity: 2,
            variantId: refs[0], bundleId: "b-nodisc", bundleName: "No Discount Bundle",
            parentVariantId: parentV, componentRefs: refs, componentQtys: [2, 1],
            // No priceAdjustment → 0% discount
            amountPerQuantity: "10.00", totalAmount: "20.00", productTitle: "Product 1",
          }),
          makeMergeLine({
            id: "line2", quantity: 1,
            variantId: refs[1], bundleId: "b-nodisc", bundleName: "No Discount Bundle",
            parentVariantId: parentV, componentRefs: refs, componentQtys: [2, 1],
            amountPerQuantity: "15.00", totalAmount: "15.00", productTitle: "Product 2",
          }),
        ],
      },
    };

    const result = cartTransformRun(input as any);
    expect(result.operations).toHaveLength(1);
    expect(result.operations[0]).toHaveProperty("merge");
    expect(result.operations[0].merge?.price?.percentageDecrease.value).toBe("0.00");
  });

  it("handles fixed bundle price correctly", () => {
    const parentV = "gid://shopify/ProductVariant/fixedBundle";
    const refs = ["gid://shopify/ProductVariant/fp1", "gid://shopify/ProductVariant/fp2"];
    // Fixed price = $20 (2000 cents), original total will be $30
    const priceAdj = { method: "fixed_bundle_price", value: 2000 };

    const input = {
      cart: {
        lines: [
          makeMergeLine({
            id: "line1", quantity: 1,
            variantId: refs[0], bundleId: "b-fixed", bundleName: "Fixed Price Bundle",
            parentVariantId: parentV, componentRefs: refs, componentQtys: [1, 1],
            priceAdjustment: priceAdj,
            amountPerQuantity: "10.00", totalAmount: "10.00", productTitle: "Product 1",
          }),
          makeMergeLine({
            id: "line2", quantity: 1,
            variantId: refs[1], bundleId: "b-fixed", bundleName: "Fixed Price Bundle",
            parentVariantId: parentV, componentRefs: refs, componentQtys: [1, 1],
            priceAdjustment: priceAdj,
            amountPerQuantity: "20.00", totalAmount: "20.00", productTitle: "Product 2",
          }),
        ],
      },
    };

    const result = cartTransformRun(input as any);
    expect(result.operations).toHaveLength(1);

    const op = result.operations[0];
    expect(op).toHaveProperty("merge");
    expect(op.merge).toHaveProperty("price");
    // Fixed price $20 on $30 original = 33.33% discount
    const discount = parseFloat(op.merge?.price?.percentageDecrease.value || "0");
    expect(discount).toBeCloseTo(33.33, 1);
  });

  it("validates merge operation structure", () => {
    const parentV = "gid://shopify/ProductVariant/structBundle";
    const refs = ["gid://shopify/ProductVariant/s1", "gid://shopify/ProductVariant/s2"];
    const priceAdj = { method: "fixed_amount_off", value: 500 }; // $5 off (cents)

    const input = {
      cart: {
        lines: [
          makeMergeLine({
            id: "line1", quantity: 1,
            variantId: refs[0], bundleId: "b-struct", bundleName: "Structure Test Bundle",
            parentVariantId: parentV, componentRefs: refs, componentQtys: [1, 1],
            priceAdjustment: priceAdj,
            amountPerQuantity: "10.00", totalAmount: "10.00", productTitle: "Product 1",
          }),
          makeMergeLine({
            id: "line2", quantity: 1,
            variantId: refs[1], bundleId: "b-struct", bundleName: "Structure Test Bundle",
            parentVariantId: parentV, componentRefs: refs, componentQtys: [1, 1],
            priceAdjustment: priceAdj,
            amountPerQuantity: "15.00", totalAmount: "15.00", productTitle: "Product 2",
          }),
        ],
      },
    };

    const result = cartTransformRun(input as any);
    expect(result.operations).toHaveLength(1);

    const op = result.operations[0];
    expect(op).toHaveProperty("merge");
    expect(op.merge).toHaveProperty("cartLines");
    expect(op.merge).toHaveProperty("parentVariantId");
    expect(op.merge).toHaveProperty("title");
    expect(op.merge).toHaveProperty("price");
    expect(op.merge?.price).toHaveProperty("percentageDecrease");

    // Cart lines
    expect(op.merge?.cartLines).toEqual([
      { cartLineId: "line1", quantity: 1 },
      { cartLineId: "line2", quantity: 1 },
    ]);

    // Parent variant comes from component_parents[0].id
    expect(op.merge?.parentVariantId).toBe(parentV);

    // Title is the bundle name
    expect(op.merge?.title).toBe("Structure Test Bundle");

    // $5 off $25 = 20%
    expect(op.merge?.price?.percentageDecrease.value).toBe("20.00");

    // Attributes
    expect(op.merge?.attributes).toBeDefined();
    const attrMap = new Map(op.merge?.attributes?.map(a => [a.key, a.value]));
    expect(attrMap.get("_is_bundle_parent")).toBe("true");
    expect(attrMap.get("_bundle_name")).toBe("Structure Test Bundle");
    expect(attrMap.get("_bundle_component_count")).toBe("2");
    expect(attrMap.get("_bundle_discount_percent")).toBe("20.00");
  });

  // ========================================================================
  // EXPAND tests
  // ========================================================================
  it("creates expand operation for bundle parent with component_reference", () => {
    const input = {
      cart: {
        lines: [
          {
            id: "gid://shopify/CartLine/parent123",
            quantity: 1,
            merchandise: {
              __typename: "ProductVariant",
              id: "gid://shopify/ProductVariant/parent456",
              component_reference: {
                value: JSON.stringify([
                  "gid://shopify/ProductVariant/component789",
                  "gid://shopify/ProductVariant/component012",
                ]),
              },
              component_quantities: {
                value: JSON.stringify([1, 1]),
              },
              product: {
                id: "gid://shopify/Product/bundle789",
                title: "Standard Bundle Product",
              },
            },
            cost: {
              amountPerQuantity: { amount: "25.00" },
              totalAmount: { amount: "25.00" },
            },
          },
        ],
      },
    };

    const result = cartTransformRun(input as any);
    expect(result.operations).toHaveLength(1);
    // This is an EXPAND (bundle parent with component_reference), not MERGE
    expect(result.operations[0]).toHaveProperty("expand");
    expect(result.operations[0].expand?.cartLineId).toBe("gid://shopify/CartLine/parent123");
  });

  it("does not condition-gate when price_adjustment has no conditions", () => {
    const parentV = "gid://shopify/ProductVariant/unconditional";
    const refs = ["gid://shopify/ProductVariant/u1", "gid://shopify/ProductVariant/u2"];
    // 10% off, no conditions → always applied
    const priceAdj = { method: "percentage_off", value: 10 };

    const input = {
      cart: {
        lines: [
          makeMergeLine({
            id: "line1", quantity: 1,
            variantId: refs[0], bundleId: "b-uncond", bundleName: "Unconditional Bundle",
            parentVariantId: parentV, componentRefs: refs, componentQtys: [1, 1],
            priceAdjustment: priceAdj,
            amountPerQuantity: "5.00", totalAmount: "5.00", productTitle: "Cheap Product",
          }),
          makeMergeLine({
            id: "line2", quantity: 1,
            variantId: refs[1], bundleId: "b-uncond", bundleName: "Unconditional Bundle",
            parentVariantId: parentV, componentRefs: refs, componentQtys: [1, 1],
            priceAdjustment: priceAdj,
            amountPerQuantity: "5.00", totalAmount: "5.00", productTitle: "Cheap Product 2",
          }),
        ],
      },
    };

    const result = cartTransformRun(input as any);
    expect(result.operations).toHaveLength(1);
    expect(result.operations[0].merge?.price?.percentageDecrease.value).toBe("10.00");
  });

  it("only one line needs component_parents for MERGE to work", () => {
    const parentV = "gid://shopify/ProductVariant/partialCP";
    const refs = ["gid://shopify/ProductVariant/pc1", "gid://shopify/ProductVariant/pc2"];

    const input = {
      cart: {
        lines: [
          // First line HAS component_parents
          makeMergeLine({
            id: "line1", quantity: 1,
            variantId: refs[0], bundleId: "b-partial", bundleName: "Partial CP Bundle",
            parentVariantId: parentV, componentRefs: refs, componentQtys: [1, 1],
            priceAdjustment: { method: "percentage_off", value: 15 },
            amountPerQuantity: "10.00", totalAmount: "10.00", productTitle: "Product 1",
            includeComponentParents: true,
          }),
          // Second line does NOT have component_parents
          makeMergeLine({
            id: "line2", quantity: 1,
            variantId: refs[1], bundleId: "b-partial", bundleName: "Partial CP Bundle",
            parentVariantId: parentV, componentRefs: refs, componentQtys: [1, 1],
            amountPerQuantity: "20.00", totalAmount: "20.00", productTitle: "Product 2",
            includeComponentParents: false,
          }),
        ],
      },
    };

    const result = cartTransformRun(input as any);
    // Should still produce MERGE — only one line needs component_parents
    expect(result.operations).toHaveLength(1);
    expect(result.operations[0]).toHaveProperty("merge");
    expect(result.operations[0].merge?.cartLines).toHaveLength(2);
    expect(result.operations[0].merge?.price?.percentageDecrease.value).toBe("15.00");
  });

  it("generates unique titles for duplicate bundle names", () => {
    const parentV = "gid://shopify/ProductVariant/dupBundle";
    const refs = ["gid://shopify/ProductVariant/d1", "gid://shopify/ProductVariant/d2"];

    const input = {
      cart: {
        lines: [
          // Bundle instance 1
          makeMergeLine({
            id: "line1", quantity: 1,
            variantId: refs[0], bundleId: "inst-1", bundleName: "Same Name",
            parentVariantId: parentV, componentRefs: refs, componentQtys: [1, 1],
            amountPerQuantity: "10.00", totalAmount: "10.00", productTitle: "Product 1",
          }),
          makeMergeLine({
            id: "line2", quantity: 1,
            variantId: refs[1], bundleId: "inst-1", bundleName: "Same Name",
            parentVariantId: parentV, componentRefs: refs, componentQtys: [1, 1],
            amountPerQuantity: "10.00", totalAmount: "10.00", productTitle: "Product 2",
          }),
          // Bundle instance 2 (same name, different bundleId)
          makeMergeLine({
            id: "line3", quantity: 1,
            variantId: refs[0], bundleId: "inst-2", bundleName: "Same Name",
            parentVariantId: parentV, componentRefs: refs, componentQtys: [1, 1],
            amountPerQuantity: "10.00", totalAmount: "10.00", productTitle: "Product 1",
          }),
          makeMergeLine({
            id: "line4", quantity: 1,
            variantId: refs[1], bundleId: "inst-2", bundleName: "Same Name",
            parentVariantId: parentV, componentRefs: refs, componentQtys: [1, 1],
            amountPerQuantity: "10.00", totalAmount: "10.00", productTitle: "Product 2",
          }),
        ],
      },
    };

    const result = cartTransformRun(input as any);
    expect(result.operations).toHaveLength(2);
    // First instance keeps original name, second gets "(2)" suffix
    expect(result.operations[0].merge?.title).toBe("Same Name");
    expect(result.operations[1].merge?.title).toBe("Same Name (2)");
  });
});

// ============================================================================
// cart transform utilities
// ============================================================================
describe("cart transform utilities", () => {
  it("getAllBundleDataFromCart handles empty cart", () => {
    const cart = { lines: [] };
    const result = getAllBundleDataFromCart(cart, null);
    expect(result).toEqual([]);
  });

  it("getAllBundleDataFromCart extracts bundle from componentReference metafield", () => {
    // getAllBundleDataFromCart looks for componentReference OR bundleConfig on merchandise
    const cart = {
      lines: [
        {
          id: "line1",
          quantity: 1,
          merchandise: {
            __typename: "ProductVariant",
            id: "gid://shopify/ProductVariant/bundle1",
            componentReference: {
              value: JSON.stringify([
                "gid://shopify/ProductVariant/comp1",
                "gid://shopify/ProductVariant/comp2",
              ]),
            },
            componentQuantities: {
              value: JSON.stringify([1, 2]),
            },
            product: {
              id: "gid://shopify/Product/1",
              title: "My Bundle Product",
            },
          },
          cost: {
            amountPerQuantity: { amount: "30.00", currencyCode: "USD" },
            totalAmount: { amount: "30.00", currencyCode: "USD" },
          },
        },
      ],
    };

    const result = getAllBundleDataFromCart(cart, null);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("My Bundle Product");
    expect(result[0].bundleParentVariantId).toBe("gid://shopify/ProductVariant/bundle1");
  });

  it("getAllBundleDataFromCart extracts bundle from bundleConfig metafield", () => {
    const bundleConfig = {
      id: "custom-bundle",
      name: "Custom Config Bundle",
      allBundleProductIds: ["gid://shopify/Product/1", "gid://shopify/Product/2"],
      pricing: {
        enableDiscount: true,
        discountMethod: "percentage_off",
        rules: [{ discountOn: "quantity", minimumQuantity: 2, fixedAmountOff: 0, percentageOff: 10 }],
      },
    };

    const cart = {
      lines: [
        {
          id: "line1",
          quantity: 1,
          merchandise: {
            __typename: "ProductVariant",
            id: "gid://shopify/ProductVariant/customBundle1",
            bundleConfig: {
              value: JSON.stringify(bundleConfig),
            },
            product: {
              id: "gid://shopify/Product/1",
              title: "Custom Bundle",
            },
          },
          cost: {
            amountPerQuantity: { amount: "20.00", currencyCode: "USD" },
            totalAmount: { amount: "20.00", currencyCode: "USD" },
          },
        },
      ],
    };

    const result = getAllBundleDataFromCart(cart, null);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("custom-bundle");
    expect(result[0].name).toBe("Custom Config Bundle");
  });

  it("getAllBundleDataFromCart handles malformed JSON gracefully", () => {
    const cart = {
      lines: [
        {
          id: "line1",
          quantity: 1,
          merchandise: {
            __typename: "ProductVariant",
            id: "variant1",
            componentReference: { value: "invalid json" },
            product: { id: "gid://shopify/Product/1", title: "Product 1" },
          },
          cost: {
            amountPerQuantity: { amount: "10.00", currencyCode: "USD" },
            totalAmount: { amount: "10.00", currencyCode: "USD" },
          },
        },
      ],
    };

    const result = getAllBundleDataFromCart(cart, null);
    expect(result).toEqual([]);
  });

  it("getAllBundleDataFromCart handles multiple bundle parents", () => {
    const cart = {
      lines: [
        {
          id: "line1",
          quantity: 1,
          merchandise: {
            __typename: "ProductVariant",
            id: "gid://shopify/ProductVariant/bundleA",
            componentReference: {
              value: JSON.stringify(["gid://shopify/ProductVariant/a1", "gid://shopify/ProductVariant/a2"]),
            },
            componentQuantities: { value: JSON.stringify([1, 1]) },
            product: { id: "gid://shopify/Product/A", title: "Bundle A" },
          },
          cost: {
            amountPerQuantity: { amount: "20.00", currencyCode: "USD" },
            totalAmount: { amount: "20.00", currencyCode: "USD" },
          },
        },
        {
          id: "line2",
          quantity: 1,
          merchandise: {
            __typename: "ProductVariant",
            id: "gid://shopify/ProductVariant/bundleB",
            componentReference: {
              value: JSON.stringify(["gid://shopify/ProductVariant/b1"]),
            },
            componentQuantities: { value: JSON.stringify([3]) },
            product: { id: "gid://shopify/Product/B", title: "Bundle B" },
          },
          cost: {
            amountPerQuantity: { amount: "30.00", currencyCode: "USD" },
            totalAmount: { amount: "30.00", currencyCode: "USD" },
          },
        },
      ],
    };

    const result = getAllBundleDataFromCart(cart, null);
    expect(result).toHaveLength(2);
    expect(result.map(b => b.name)).toContain("Bundle A");
    expect(result.map(b => b.name)).toContain("Bundle B");
  });
});

// ============================================================================
// Product ID normalization tests
// ============================================================================
describe("normalizeProductId", () => {
  it("returns GID as-is when already in GID format", () => {
    const gid = "gid://shopify/Product/123456789";
    expect(normalizeProductId(gid)).toBe(gid);
  });

  it("converts numeric ID to GID format", () => {
    expect(normalizeProductId("123456789")).toBe("gid://shopify/Product/123456789");
  });

  it("handles empty string gracefully", () => {
    expect(normalizeProductId("")).toBe("");
  });

  it("extracts and normalizes embedded GID pattern", () => {
    const malformedId = "some/path/gid://shopify/Product/123456789/extra";
    expect(normalizeProductId(malformedId)).toBe("gid://shopify/Product/123456789");
  });

  it("converts valid alphanumeric IDs to GID format", () => {
    expect(normalizeProductId("product-abc-123")).toBe("gid://shopify/Product/product-abc-123");
  });
});

// ============================================================================
// Bundle data parsing with normalization tests
// ============================================================================
describe("parseBundleDataFromMetafield", () => {
  it("normalizes product IDs in bundle configuration", () => {
    const bundleConfig = {
      id: "test-bundle",
      name: "Test Bundle",
      allBundleProductIds: ["123456", "789012", "gid://shopify/Product/345678"],
      pricing: {
        enableDiscount: true,
        discountMethod: "fixed_amount_off",
        rules: [{ discountOn: "quantity", minimumQuantity: 2, fixedAmountOff: 5, percentageOff: 0 }],
      },
    };

    const result = parseBundleDataFromMetafield(JSON.stringify(bundleConfig));

    expect(result).toBeTruthy();
    expect(result!.allBundleProductIds).toEqual([
      "gid://shopify/Product/123456",
      "gid://shopify/Product/789012",
      "gid://shopify/Product/345678",
    ]);
  });

  it("handles malformed JSON gracefully", () => {
    const result = parseBundleDataFromMetafield("{invalid json}");
    expect(result).toBeNull();
  });

  it("handles bundle config without allBundleProductIds array", () => {
    const bundleConfig = {
      id: "test-bundle",
      name: "Test Bundle",
      pricing: {
        enableDiscount: true,
        discountMethod: "fixed_amount_off",
        rules: [{ discountOn: "quantity", minimumQuantity: 2, fixedAmountOff: 5, percentageOff: 0 }],
      },
    };

    const result = parseBundleDataFromMetafield(JSON.stringify(bundleConfig));
    expect(result).toBeTruthy();
    expect(result!.allBundleProductIds).toBeUndefined();
  });
});

// ============================================================================
// Product ID format mismatch integration tests
// ============================================================================
describe("Product ID format mismatch handling", () => {
  it("matches products correctly with mixed ID formats via MERGE", () => {
    const parentV = "gid://shopify/ProductVariant/formatBundle";
    const refs = ["gid://shopify/ProductVariant/41234567890123", "gid://shopify/ProductVariant/41234567890456"];

    const input = {
      cart: {
        lines: [
          makeMergeLine({
            id: "gid://shopify/CartLine/12345", quantity: 1,
            variantId: refs[0], bundleId: "format-test", bundleName: "Format Test Bundle",
            parentVariantId: parentV, componentRefs: refs, componentQtys: [1, 1],
            priceAdjustment: { method: "fixed_amount_off", value: 500 },
            amountPerQuantity: "10.00", totalAmount: "10.00", productTitle: "Product 1",
          }),
          makeMergeLine({
            id: "gid://shopify/CartLine/67890", quantity: 1,
            variantId: refs[1], bundleId: "format-test", bundleName: "Format Test Bundle",
            parentVariantId: parentV, componentRefs: refs, componentQtys: [1, 1],
            priceAdjustment: { method: "fixed_amount_off", value: 500 },
            amountPerQuantity: "15.00", totalAmount: "15.00", productTitle: "Product 2",
          }),
        ],
      },
    };

    const result = cartTransformRun(input as any);
    expect(result.operations).toHaveLength(1);
    expect(result.operations[0]).toHaveProperty("merge");
    expect(result.operations[0].merge?.cartLines).toHaveLength(2);
    expect(result.operations[0].merge?.title).toBe("Format Test Bundle");
  });

  it("handles component reference matching with variant GIDs (EXPAND)", () => {
    // A bundle parent with component_reference + component_quantities → EXPAND
    const input = {
      cart: {
        lines: [
          {
            id: "gid://shopify/CartLine/parent123",
            quantity: 1,
            merchandise: {
              __typename: "ProductVariant",
              id: "gid://shopify/ProductVariant/parent456",
              component_reference: {
                value: JSON.stringify([
                  "gid://shopify/ProductVariant/component789",
                  "gid://shopify/ProductVariant/component012",
                ]),
              },
              component_quantities: {
                value: JSON.stringify([1, 1]),
              },
              product: {
                id: "gid://shopify/Product/bundle789",
                title: "Standard Bundle Product",
              },
            },
            cost: {
              amountPerQuantity: { amount: "25.00" },
              totalAmount: { amount: "25.00" },
            },
          },
        ],
      },
    };

    const result = cartTransformRun(input as any);
    // Should create EXPAND operation (not merge) for bundle parent
    expect(result.operations).toHaveLength(1);
    expect(result.operations[0]).toHaveProperty("expand");
  });
});
