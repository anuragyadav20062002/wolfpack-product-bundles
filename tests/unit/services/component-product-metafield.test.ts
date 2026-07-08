import { updateComponentProductMetafields } from "../../../app/services/bundles/metafield-sync/operations/component-product.server";
import {
  getFirstVariantId,
  batchGetProductVariants,
} from "../../../app/utils/variant-lookup.server";

jest.mock("../../../app/lib/logger", () => ({
  AppLogger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    startTimer: jest.fn(() => jest.fn()),
  },
}));

jest.mock("../../../app/utils/variant-lookup.server", () => ({
  getFirstVariantId: jest.fn(),
  batchGetProductVariants: jest.fn(),
}));

const mockGetFirstVariantId = getFirstVariantId as jest.MockedFunction<typeof getFirstVariantId>;
const mockBatchGetProductVariants = batchGetProductVariants as jest.MockedFunction<typeof batchGetProductVariants>;

type CollectionMap = Record<string, string[]>;

function makeAdmin(collectionResponses: CollectionMap = {}) {
  const graphql = jest.fn().mockImplementation((query: string, opts?: any) => {
    if (typeof query === "string" && query.includes("getCollectionProductIds")) {
      const handle = opts?.variables?.handle as string | undefined;
      const productIds = (handle && collectionResponses[handle]) || [];
      return Promise.resolve({
        json: () =>
          Promise.resolve({
            data: {
              collection: {
                products: {
                  edges: productIds.map((id: string) => ({ node: { id } })),
                },
              },
            },
          }),
      });
    }
    // Default: SetComponentMetafields mutation response
    return Promise.resolve({
      json: () =>
        Promise.resolve({
          data: {
            metafieldsSet: {
              metafields: [{ id: "mf-1", namespace: "$app", key: "component_parents" }],
              userErrors: [],
            },
          },
        }),
    });
  });
  return { graphql };
}

function getMetafieldSetCalls(admin: any) {
  return admin.graphql.mock.calls
    .filter((c: any[]) => typeof c[0] === "string" && c[0].includes("SetComponentMetafields"))
    .map((c: any[]) => c[1].variables.metafields[0]);
}

function getCollectionQueryCalls(admin: any) {
  return admin.graphql.mock.calls.filter(
    (c: any[]) => typeof c[0] === "string" && c[0].includes("getCollectionProductIds"),
  );
}

describe("updateComponentProductMetafields", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockGetFirstVariantId.mockResolvedValue({
      success: true,
      variantId: "gid://shopify/ProductVariant/PARENT",
    } as any);

    mockBatchGetProductVariants.mockResolvedValue(new Map());
  });

  // ─── Regression guards: existing StepProduct / products[] paths ─────────────

  it("writes metafield to every cached variant for StepProduct entries", async () => {
    const admin = makeAdmin();
    const config = {
      steps: [
        {
          minQuantity: 1,
          StepProduct: [
            {
              productId: "gid://shopify/Product/123",
              variants: [
                { id: "gid://shopify/ProductVariant/1A" },
                { id: "gid://shopify/ProductVariant/1B" },
              ],
            },
          ],
        },
      ],
      pricing: { enabled: false },
    };

    await updateComponentProductMetafields(admin as any, "gid://shopify/Product/999", config);

    const writes = getMetafieldSetCalls(admin);
    expect(writes).toHaveLength(2);
    expect(writes.map((w: any) => w.ownerId).sort()).toEqual([
      "gid://shopify/ProductVariant/1A",
      "gid://shopify/ProductVariant/1B",
    ]);
    // Should NOT call the collection query when no collections are configured
    expect(getCollectionQueryCalls(admin)).toHaveLength(0);
    // Should NOT need batch variant fetch when DB cache covers everything
    expect(mockBatchGetProductVariants).not.toHaveBeenCalled();
  });

  it("normalizes numeric cached StepProduct variant IDs before writing component_parents", async () => {
    const admin = makeAdmin();
    const config = {
      steps: [
        {
          minQuantity: 1,
          StepProduct: [
            {
              productId: "gid://shopify/Product/123",
              variants: [
                { id: "51659604984106" },
                { variantId: 51658221388074 },
              ],
            },
          ],
        },
      ],
      pricing: {
        enabled: true,
        method: "fixed_bundle_price",
        rules: [{ conditionType: "quantity", conditionValue: 2, discountValue: 770, fixedBundlePrice: 770 }],
      },
    };

    await updateComponentProductMetafields(admin as any, "gid://shopify/Product/999", config);

    const writes = getMetafieldSetCalls(admin);
    expect(writes.map((write: any) => write.ownerId).sort()).toEqual([
      "gid://shopify/ProductVariant/51658221388074",
      "gid://shopify/ProductVariant/51659604984106",
    ]);
    const parsed = JSON.parse(writes[0].value);
    expect(parsed[0].component_reference.value).toEqual([
      "gid://shopify/ProductVariant/51659604984106",
      "gid://shopify/ProductVariant/51658221388074",
    ]);
    expect(parsed[0].price_adjustment).toMatchObject({
      method: "fixed_bundle_price",
      value: 770,
      conditions: { type: "quantity", operator: "gte", value: 2 },
    });
  });

  it("falls back to batchGetProductVariants when StepProduct has no cached variants", async () => {
    mockBatchGetProductVariants.mockResolvedValue(
      new Map([["123", { success: true, variantIds: ["gid://shopify/ProductVariant/F1"] }]]),
    );
    const admin = makeAdmin();
    const config = {
      steps: [
        {
          minQuantity: 1,
          StepProduct: [{ productId: "gid://shopify/Product/123", variants: [] }],
        },
      ],
      pricing: { enabled: false },
    };

    await updateComponentProductMetafields(admin as any, "gid://shopify/Product/999", config);

    expect(mockBatchGetProductVariants).toHaveBeenCalledWith(admin, ["gid://shopify/Product/123"]);
    const writes = getMetafieldSetCalls(admin);
    expect(writes).toHaveLength(1);
    expect(writes[0].ownerId).toBe("gid://shopify/ProductVariant/F1");
  });

  it("writes fallback product component_parents to every fetched variant", async () => {
    mockBatchGetProductVariants.mockResolvedValue(
      new Map([[
        "123",
        {
          success: true,
          variantIds: [
            "gid://shopify/ProductVariant/F1",
            "gid://shopify/ProductVariant/F2",
          ],
        },
      ]]),
    );
    const admin = makeAdmin();
    const config = {
      steps: [
        {
          minQuantity: 1,
          StepProduct: [{ productId: "gid://shopify/Product/123", variants: [] }],
        },
      ],
      pricing: { enabled: false },
    };

    await updateComponentProductMetafields(admin as any, "gid://shopify/Product/999", config);

    const writes = getMetafieldSetCalls(admin);
    expect(writes.map((write: any) => write.ownerId).sort()).toEqual([
      "gid://shopify/ProductVariant/F1",
      "gid://shopify/ProductVariant/F2",
    ]);
    const parsed = JSON.parse(writes[0].value);
    expect(parsed[0].component_reference.value).toEqual([
      "gid://shopify/ProductVariant/F1",
      "gid://shopify/ProductVariant/F2",
    ]);
  });

  it("uses products[] fallback when StepProduct is absent", async () => {
    mockBatchGetProductVariants.mockResolvedValue(
      new Map([["456", { success: true, variantIds: ["gid://shopify/ProductVariant/F2"] }]]),
    );
    const admin = makeAdmin();
    const config = {
      steps: [
        {
          minQuantity: 1,
          products: [{ id: "gid://shopify/Product/456" }],
        },
      ],
      pricing: { enabled: false },
    };

    await updateComponentProductMetafields(admin as any, "gid://shopify/Product/999", config);

    const writes = getMetafieldSetCalls(admin);
    expect(writes).toHaveLength(1);
    expect(writes[0].ownerId).toBe("gid://shopify/ProductVariant/F2");
  });

  it("writes every cached products[] variant without first-variant lookup", async () => {
    const admin = makeAdmin();
    const config = {
      steps: [
        {
          minQuantity: 1,
          products: [
            {
              id: "gid://shopify/Product/456",
              variants: [
                { id: "gid://shopify/ProductVariant/F2A" },
                { id: "gid://shopify/ProductVariant/F2B" },
              ],
            },
          ],
        },
      ],
      pricing: { enabled: false },
    };

    await updateComponentProductMetafields(admin as any, "gid://shopify/Product/999", config);

    expect(mockBatchGetProductVariants).not.toHaveBeenCalled();
    const writes = getMetafieldSetCalls(admin);
    expect(writes).toHaveLength(2);
    expect(writes.map((write: any) => write.ownerId).sort()).toEqual([
      "gid://shopify/ProductVariant/F2A",
      "gid://shopify/ProductVariant/F2B",
    ]);
  });

  it("writes StepCategory product component_parents to every cached variant", async () => {
    const admin = makeAdmin();
    const config = {
      steps: [
        {
          minQuantity: 1,
          StepProduct: [],
          products: [],
          StepCategory: [
            {
              name: "Category 1",
              products: [
                {
                  id: "gid://shopify/Product/789",
                  variants: [
                    { id: "gid://shopify/ProductVariant/V789A" },
                    { id: "gid://shopify/ProductVariant/V789B" },
                  ],
                },
              ],
            },
          ],
        },
      ],
      pricing: { enabled: false },
    };

    await updateComponentProductMetafields(admin as any, "gid://shopify/Product/999", config);

    expect(mockBatchGetProductVariants).not.toHaveBeenCalled();
    const writes = getMetafieldSetCalls(admin);
    expect(writes).toHaveLength(2);
    expect(writes.map((write: any) => write.ownerId).sort()).toEqual([
      "gid://shopify/ProductVariant/V789A",
      "gid://shopify/ProductVariant/V789B",
    ]);
    const parsed = JSON.parse(writes[0].value);
    expect(parsed[0].component_reference.value).toEqual([
      "gid://shopify/ProductVariant/V789A",
      "gid://shopify/ProductVariant/V789B",
    ]);
  });

  it("stores Buy X get Y buy/get metadata and total quantity threshold", async () => {
    const admin = makeAdmin();
    const config = {
      steps: [
        {
          minQuantity: 1,
          StepProduct: [
            {
              productId: "gid://shopify/Product/123",
              variants: [{ id: "gid://shopify/ProductVariant/BXY1" }],
            },
          ],
        },
      ],
      pricing: {
        enabled: true,
        method: "buy_x_get_y",
        rules: [
          {
            conditionType: "quantity",
            conditionValue: 2,
            discountValue: 100,
            customerBuys: 2,
            customerGets: 1,
            discountType: "percentage",
            applyDiscountTo: "lowest_priced",
          },
        ],
      },
    };

    await updateComponentProductMetafields(admin as any, "gid://shopify/Product/999", config);

    const writes = getMetafieldSetCalls(admin);
    expect(writes).toHaveLength(1);
    const parsed = JSON.parse(writes[0].value);
    expect(parsed[0].price_adjustment).toMatchObject({
      method: "buy_x_get_y",
      value: 100,
      customerBuys: 2,
      customerGets: 1,
      discountType: "percentage",
      applyDiscountTo: "lowest_priced",
      conditions: {
        type: "quantity",
        operator: "gte",
        value: 3,
      },
    });
  });

  it("writes direct Add-ons selected variants as bundle components", async () => {
    const admin = makeAdmin();
    const config = {
      steps: [
        {
          minQuantity: 1,
          StepProduct: [
            {
              productId: "gid://shopify/Product/123",
              variants: [{ id: "gid://shopify/ProductVariant/PAID" }],
            },
          ],
        },
      ],
      personalizationData: {
        isPersonalizationEnabled: true,
        addonProducts: {
          isEnabled: true,
          tiers: [
            {
              selectedAddonProducts: [
                {
                  graphqlId: "gid://shopify/Product/9999",
                  title: "Selected Add-on",
                  variants: [
                    {
                      variantGraphqlId: "gid://shopify/ProductVariant/ADDON",
                      price: "600.00",
                    },
                  ],
                },
              ],
              discount: { type: "PERCENTAGE", value: 10 },
            },
          ],
        },
      },
      pricing: {
        enabled: true,
        method: "fixed_amount_off",
        rules: [{ conditionType: "quantity", conditionValue: 2, discountValue: 500 }],
      },
    };

    await updateComponentProductMetafields(admin as any, "gid://shopify/Product/999", config);

    const writes = getMetafieldSetCalls(admin);
    expect(writes.map((write: any) => write.ownerId).sort()).toEqual([
      "gid://shopify/ProductVariant/ADDON",
      "gid://shopify/ProductVariant/PAID",
    ]);
    const parsed = JSON.parse(writes.find((write: any) => write.ownerId.endsWith("/ADDON")).value);
    expect(parsed[0].component_reference.value).toEqual([
      "gid://shopify/ProductVariant/PAID",
      "gid://shopify/ProductVariant/ADDON",
    ]);
    expect(parsed[0].price_adjustment).toMatchObject({
      method: "fixed_amount_off",
      value: 500,
      conditions: { type: "quantity", operator: "gte", value: 2 },
    });
  });

  // ─── New collection-only path (the Pearletti fix) ───────────────────────────

  it("resolves products from step.collections and writes component_parents to each first variant", async () => {
    mockBatchGetProductVariants.mockResolvedValue(
      new Map([
        ["100", { success: true, variantIds: ["gid://shopify/ProductVariant/V100"] }],
        ["200", { success: true, variantIds: ["gid://shopify/ProductVariant/V200"] }],
        ["300", { success: true, variantIds: ["gid://shopify/ProductVariant/V300"] }],
      ]),
    );
    const admin = makeAdmin({
      "buy-any-3": [
        "gid://shopify/Product/100",
        "gid://shopify/Product/200",
        "gid://shopify/Product/300",
      ],
    });
    const config = {
      steps: [
        {
          minQuantity: 1,
          StepProduct: [],
          products: [],
          collections: [
            { id: "gid://shopify/Collection/1", handle: "buy-any-3", title: "Buy Any 3" },
          ],
        },
      ],
      pricing: { enabled: false },
    };

    await updateComponentProductMetafields(admin as any, "gid://shopify/Product/999", config);

    // Collection was queried by handle
    const collQueries = getCollectionQueryCalls(admin);
    expect(collQueries).toHaveLength(1);
    expect(collQueries[0][1].variables).toEqual({ handle: "buy-any-3" });

    // Batch lookup was issued for all 3 collection-resolved product IDs
    expect(mockBatchGetProductVariants).toHaveBeenCalledWith(admin, [
      "gid://shopify/Product/100",
      "gid://shopify/Product/200",
      "gid://shopify/Product/300",
    ]);

    // component_parents written to each of the 3 first variants
    const writes = getMetafieldSetCalls(admin);
    expect(writes).toHaveLength(3);
    expect(writes.map((w: any) => w.ownerId).sort()).toEqual([
      "gid://shopify/ProductVariant/V100",
      "gid://shopify/ProductVariant/V200",
      "gid://shopify/ProductVariant/V300",
    ]);

    // Each write carries the full component_reference list so the cart transform
    // can find a matching metafield on any one of the bundle's cart lines
    const first = writes[0];
    expect(first.namespace).toBe("$app");
    expect(first.key).toBe("component_parents");
    expect(first.type).toBe("json");
    const parsed = JSON.parse(first.value);
    expect(parsed[0].id).toBe("gid://shopify/ProductVariant/PARENT");
    expect(parsed[0].component_reference.value).toEqual([
      "gid://shopify/ProductVariant/V100",
      "gid://shopify/ProductVariant/V200",
      "gid://shopify/ProductVariant/V300",
    ]);
  });

  it("merges StepProduct + collection products without duplicate writes for shared products", async () => {
    mockBatchGetProductVariants.mockResolvedValue(
      new Map([["300", { success: true, variantIds: ["gid://shopify/ProductVariant/V300"] }]]),
    );
    const admin = makeAdmin({
      shared: [
        "gid://shopify/Product/200", // also in StepProduct → should be deduped
        "gid://shopify/Product/300", // new from collection
      ],
    });
    const config = {
      steps: [
        {
          minQuantity: 1,
          StepProduct: [
            {
              productId: "gid://shopify/Product/200",
              variants: [{ id: "gid://shopify/ProductVariant/V200" }],
            },
          ],
          collections: [{ handle: "shared" }],
        },
      ],
      pricing: { enabled: false },
    };

    await updateComponentProductMetafields(admin as any, "gid://shopify/Product/999", config);

    // batch fetch only for product 300; 200 is already cached via StepProduct
    expect(mockBatchGetProductVariants).toHaveBeenCalledWith(admin, ["gid://shopify/Product/300"]);

    // 2 unique variants written: V200 (StepProduct) + V300 (collection)
    const writes = getMetafieldSetCalls(admin);
    expect(writes).toHaveLength(2);
    expect(writes.map((w: any) => w.ownerId).sort()).toEqual([
      "gid://shopify/ProductVariant/V200",
      "gid://shopify/ProductVariant/V300",
    ]);
  });

  it("skips collection entries with missing or empty handle without crashing", async () => {
    const admin = makeAdmin();
    const config = {
      steps: [
        {
          minQuantity: 1,
          StepProduct: [
            {
              productId: "gid://shopify/Product/123",
              variants: [{ id: "gid://shopify/ProductVariant/V123" }],
            },
          ],
          collections: [{ id: "gid://shopify/Collection/x" }, { handle: "" }],
        },
      ],
      pricing: { enabled: false },
    };

    await updateComponentProductMetafields(admin as any, "gid://shopify/Product/999", config);

    expect(getCollectionQueryCalls(admin)).toHaveLength(0);
    // StepProduct path still wrote
    expect(getMetafieldSetCalls(admin)).toHaveLength(1);
  });

  it("logs a warning and continues when a collection fetch throws", async () => {
    const admin = {
      graphql: jest.fn().mockImplementation((query: string) => {
        if (query.includes("getCollectionProductIds")) {
          return Promise.reject(new Error("network down"));
        }
        return Promise.resolve({
          json: () =>
            Promise.resolve({
              data: { metafieldsSet: { metafields: [], userErrors: [] } },
            }),
        });
      }),
    };
    const config = {
      steps: [
        {
          minQuantity: 1,
          StepProduct: [
            {
              productId: "gid://shopify/Product/123",
              variants: [{ id: "gid://shopify/ProductVariant/V123" }],
            },
          ],
          collections: [{ handle: "broken" }],
        },
      ],
      pricing: { enabled: false },
    };

    await expect(
      updateComponentProductMetafields(admin as any, "gid://shopify/Product/999", config),
    ).resolves.not.toThrow();

    // StepProduct write still happened despite the collection error
    const writes = admin.graphql.mock.calls
      .filter((c: any[]) => typeof c[0] === "string" && c[0].includes("SetComponentMetafields"))
      .map((c: any[]) => c[1].variables.metafields[0]);
    expect(writes).toHaveLength(1);
    expect(writes[0].ownerId).toBe("gid://shopify/ProductVariant/V123");
  });

  it("throws when bundle variant lookup fails", async () => {
    mockGetFirstVariantId.mockResolvedValueOnce({
      success: false,
      error: "product not found",
    } as any);
    const admin = makeAdmin();
    const config = {
      steps: [{ collections: [{ handle: "x" }] }],
      pricing: { enabled: false },
    };

    await expect(
      updateComponentProductMetafields(admin as any, "gid://shopify/Product/missing", config),
    ).rejects.toThrow(/Cannot update component metafields/);
  });
});
