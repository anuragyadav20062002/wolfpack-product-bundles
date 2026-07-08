import {
  buildRuntimeTokenPayload,
  generateCartTransformRuntimeTokenSecret,
  normalizeProductVariantGid,
  signRuntimeCartToken,
  type RuntimeTokenPayload,
  validateRuntimeTokenSelection,
  verifyRuntimeCartToken,
} from "../../../app/services/cart-transform-runtime-token.server";

function makeBundle(overrides: Record<string, unknown> = {}) {
  return {
    id: "bundle-1",
    shopId: "test-shop.myshopify.com",
    bundleType: "full_page",
    name: "Daily Essentials",
    shopifyProductId: "gid://shopify/Product/PARENT",
    steps: [
      {
        minQuantity: 1,
        StepProduct: [
          {
            productId: "gid://shopify/Product/1",
            variants: [
              { id: "gid://shopify/ProductVariant/101" },
              { variantId: "102" },
            ],
          },
        ],
        StepCategory: [
          {
            products: [
              {
                id: "gid://shopify/Product/2",
                variants: [{ variantGraphqlId: "gid://shopify/ProductVariant/201" }],
              },
            ],
          },
        ],
      },
    ],
    pricing: {
      enabled: true,
      method: "percentage_off",
      rules: [{ conditionType: "quantity", conditionValue: 2, discountValue: 15 }],
    },
    personalizationData: null,
    ...overrides,
  };
}

describe("cart transform runtime token service", () => {
  it("normalizes Shopify variant IDs into ProductVariant GIDs", () => {
    expect(normalizeProductVariantGid("101")).toBe("gid://shopify/ProductVariant/101");
    expect(normalizeProductVariantGid(202)).toBe("gid://shopify/ProductVariant/202");
    expect(normalizeProductVariantGid("gid://shopify/ProductVariant/303")).toBe("gid://shopify/ProductVariant/303");
    expect(normalizeProductVariantGid("gid://shopify/Product/404")).toBeNull();
  });

  it("signs and verifies the exact base64url payload string", () => {
    const payload = {
      version: 1,
      shop: "test-shop.myshopify.com",
      bundleId: "bundle-1",
      bundleType: "full_page",
      offerGroupId: "FBP-bundle-1_ABC",
      parentVariantId: "gid://shopify/ProductVariant/PARENT",
      bundleName: "Daily Essentials",
      components: [{ variantId: "gid://shopify/ProductVariant/101", quantity: 2 }],
      addons: [],
      priceAdjustment: { method: "percentage_off", value: 15 },
    } satisfies RuntimeTokenPayload;
    const secret = generateCartTransformRuntimeTokenSecret("test-shop.myshopify.com", "api-secret");

    const token = signRuntimeCartToken(payload, secret);

    expect(verifyRuntimeCartToken(token, secret)).toEqual(payload);
  });

  it("rejects tampered payloads", () => {
    const secret = generateCartTransformRuntimeTokenSecret("test-shop.myshopify.com", "api-secret");
    const token = signRuntimeCartToken({
      version: 1,
      shop: "test-shop.myshopify.com",
      bundleId: "bundle-1",
      bundleType: "full_page",
      offerGroupId: "FBP-bundle-1_ABC",
      parentVariantId: "gid://shopify/ProductVariant/PARENT",
      bundleName: "Daily Essentials",
      components: [{ variantId: "gid://shopify/ProductVariant/101", quantity: 1 }],
      addons: [],
      priceAdjustment: { method: "percentage_off", value: 15 },
    }, secret);
    const [payloadPart, signaturePart] = token.split(".");
    const payload = JSON.parse(Buffer.from(payloadPart, "base64url").toString("utf8"));
    payload.components[0].quantity = 2;
    const tamperedPayloadPart = Buffer.from(JSON.stringify(payload)).toString("base64url");

    expect(verifyRuntimeCartToken(`${tamperedPayloadPart}.${signaturePart}`, secret)).toBeNull();
  });

  it("validates selected components against the current bundle config", () => {
    const selection = validateRuntimeTokenSelection(makeBundle(), {
      components: [
        { variantId: "101", quantity: 1 },
        { variantId: "gid://shopify/ProductVariant/201", quantity: 2 },
      ],
      addons: [],
    });

    expect(selection.components).toEqual([
      { variantId: "gid://shopify/ProductVariant/101", quantity: 1 },
      { variantId: "gid://shopify/ProductVariant/201", quantity: 2 },
    ]);
  });

  it("validates selected components from persisted category selectedProducts", () => {
    const selection = validateRuntimeTokenSelection(makeBundle({
      steps: [
        {
          StepProduct: [],
          StepCategory: [
            {
              products: [],
              selectedProducts: [
                {
                  id: "gid://shopify/Product/3",
                  variants: [{ id: "gid://shopify/ProductVariant/301" }],
                },
              ],
            },
          ],
        },
      ],
    }), {
      components: [{ variantId: "301", quantity: 1 }],
      addons: [],
    });

    expect(selection.components).toEqual([
      { variantId: "gid://shopify/ProductVariant/301", quantity: 1 },
    ]);
  });

  it("validates selected components from runtime category products with variant gid fields", () => {
    const selection = validateRuntimeTokenSelection(makeBundle({
      steps: [
        {
          StepProduct: [],
          categories: [
            {
              products: [
                {
                  id: "gid://shopify/Product/4",
                  variants: [{ id: "401", gid: "gid://shopify/ProductVariant/401" }],
                },
              ],
            },
          ],
        },
      ],
    }), {
      components: [{ variantId: "gid://shopify/ProductVariant/401", quantity: 1 }],
      addons: [],
    });

    expect(selection.components).toEqual([
      { variantId: "gid://shopify/ProductVariant/401", quantity: 1 },
    ]);
  });

  it("rejects selected variants outside the bundle config", () => {
    expect(() => validateRuntimeTokenSelection(makeBundle(), {
      components: [{ variantId: "gid://shopify/ProductVariant/999", quantity: 1 }],
      addons: [],
    })).toThrow(/not part of bundle/i);
  });

  it("builds a signed payload from a validated DB bundle", () => {
    const payload = buildRuntimeTokenPayload({
      shop: "test-shop.myshopify.com",
      bundle: makeBundle(),
      parentVariantId: "gid://shopify/ProductVariant/PARENT",
      offerGroupId: "FBP-bundle-1_ABC",
      bundleType: "full_page",
      selection: {
        components: [{ variantId: "102", quantity: 1 }],
        addons: [{ variantId: "gid://shopify/ProductVariant/201", quantity: 1, discount: { type: "PERCENTAGE", value: 10 } }],
      },
    });

    expect(payload).toMatchObject({
      version: 1,
      shop: "test-shop.myshopify.com",
      bundleId: "bundle-1",
      bundleType: "full_page",
      offerGroupId: "FBP-bundle-1_ABC",
      parentVariantId: "gid://shopify/ProductVariant/PARENT",
      components: [{ variantId: "gid://shopify/ProductVariant/102", quantity: 1 }],
      addons: [{ variantId: "gid://shopify/ProductVariant/201", quantity: 1, discount: { type: "PERCENTAGE", value: 10 } }],
    });
    expect(payload.priceAdjustment).toMatchObject({
      method: "percentage_off",
      value: 15,
    });
  });
});
