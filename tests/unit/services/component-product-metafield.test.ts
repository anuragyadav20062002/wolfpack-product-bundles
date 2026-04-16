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
  batchGetFirstVariants: jest.fn(),
}));

import { updateComponentProductMetafields } from "../../../app/services/bundles/metafield-sync/operations/component-product.server";
import {
  getFirstVariantId,
  batchGetFirstVariants,
} from "../../../app/utils/variant-lookup.server";

const mockGetFirstVariantId = getFirstVariantId as jest.MockedFunction<typeof getFirstVariantId>;
const mockBatchGetFirstVariants = batchGetFirstVariants as jest.MockedFunction<typeof batchGetFirstVariants>;

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

    mockBatchGetFirstVariants.mockResolvedValue(new Map());
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
    expect(mockBatchGetFirstVariants).not.toHaveBeenCalled();
  });

  it("falls back to batchGetFirstVariants when StepProduct has no cached variants", async () => {
    mockBatchGetFirstVariants.mockResolvedValue(
      new Map([["123", { success: true, variantId: "gid://shopify/ProductVariant/F1" }]]),
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

    expect(mockBatchGetFirstVariants).toHaveBeenCalledWith(admin, ["gid://shopify/Product/123"]);
    const writes = getMetafieldSetCalls(admin);
    expect(writes).toHaveLength(1);
    expect(writes[0].ownerId).toBe("gid://shopify/ProductVariant/F1");
  });

  it("uses products[] fallback when StepProduct is absent", async () => {
    mockBatchGetFirstVariants.mockResolvedValue(
      new Map([["456", { success: true, variantId: "gid://shopify/ProductVariant/F2" }]]),
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

  // ─── New collection-only path (the Pearletti fix) ───────────────────────────

  it("resolves products from step.collections and writes component_parents to each first variant", async () => {
    mockBatchGetFirstVariants.mockResolvedValue(
      new Map([
        ["100", { success: true, variantId: "gid://shopify/ProductVariant/V100" }],
        ["200", { success: true, variantId: "gid://shopify/ProductVariant/V200" }],
        ["300", { success: true, variantId: "gid://shopify/ProductVariant/V300" }],
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
    expect(mockBatchGetFirstVariants).toHaveBeenCalledWith(admin, [
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
    mockBatchGetFirstVariants.mockResolvedValue(
      new Map([["300", { success: true, variantId: "gid://shopify/ProductVariant/V300" }]]),
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
    expect(mockBatchGetFirstVariants).toHaveBeenCalledWith(admin, ["gid://shopify/Product/300"]);

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
