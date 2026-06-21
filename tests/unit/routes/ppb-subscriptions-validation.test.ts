/**
 * Unit tests — PPB subscription validation handler
 */

import { handleValidateSellingPlanGroups } from "../../../app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/handlers/subscriptions.server";
import { SUBSCRIPTION_NO_COMMON_PLAN_MESSAGE } from "../../../app/lib/bundle-config/product-page-admin-sections";

type ProductRecord = {
  id: string;
  title: string;
  sellingPlanGroups: {
    id: string;
    name: string;
  }[];
};

jest.mock("../../../app/db.server", () => ({
  __esModule: true,
  default: {
    bundle: {
      findFirst: jest.fn(),
    },
  },
}));

jest.mock("../../../app/lib/logger", () => ({
  AppLogger: {
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    startTimer: jest.fn(() => jest.fn()),
  },
}));

const getDb = () => require("../../../app/db.server").default;
const SESSION = { shop: "test-shop.myshopify.com" } as any;

function makeBundleResponse(overrides: Partial<{
  products: ProductRecord[];
  collectionProductIds: string[];
}>) {
  const collectionId = "gid://shopify/Collection/555";
  const productIdsFromCollection = overrides.collectionProductIds ?? [];

  return (query: string) => {
    if (query.includes("CollectionProductsForSellingPlanValidation")) {
      return Promise.resolve({
        json: async () => ({
          data: {
            nodes: [
              {
                id: collectionId,
                products: {
                  edges: productIdsFromCollection.map((id) => ({ node: { id } })),
                },
              },
            ],
          },
        }),
      } as any);
    }

    if (query.includes("ProductsWithSellingPlanGroups")) {
      return Promise.resolve({
        json: async () => ({
          data: {
            nodes: (overrides.products ?? []).map((product) => ({
              id: product.id,
              title: product.title,
              sellingPlanGroups: { nodes: product.sellingPlanGroups },
            })),
          },
        }),
      } as any);
    }

    return Promise.resolve({ json: async () => ({ data: {} }) } as any);
  };
}

describe("PPB subscription validation handler", () => {
  const baseBundle = {
    id: "bundle-1",
    shopId: "test-shop.myshopify.com",
    bundleType: "product_page",
    steps: [
      {
        id: "step-1",
        StepProduct: [{ id: "gid://shopify/Product/111" }],
        StepCategory: [
          {
            id: "cat-1",
            products: [],
            collections: [{ id: "gid://shopify/Collection/555" }],
          },
        ],
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns valid when direct and collection-backed products share a selling plan group", async () => {
    const admin = {
      graphql: jest.fn(
        makeBundleResponse({
          collectionProductIds: ["gid://shopify/Product/222"],
          products: [
            {
              id: "gid://shopify/Product/111",
              title: "Direct Product",
              sellingPlanGroups: [{ id: "gid://shopify/SellingPlanGroup/monthly", name: "Monthly" }],
            },
            {
              id: "gid://shopify/Product/222",
              title: "Collection Product",
              sellingPlanGroups: [{ id: "gid://shopify/SellingPlanGroup/monthly", name: "Monthly" }],
            },
          ],
        }),
      ),
    } as any;

    getDb().bundle.findFirst.mockResolvedValue(baseBundle);

    const response = await handleValidateSellingPlanGroups(admin, SESSION, "bundle-1");
    const body = await response.json() as any;

    expect(response.status).toBe(200);
    expect(body).toEqual({
      success: true,
      isValid: true,
      productCount: 2,
      plans: [
        { id: "gid://shopify/SellingPlanGroup/monthly", name: "Monthly" },
      ],
      message: null,
    });
  });

  it("includes collection-backed products and returns no-common-plan when there is no overlap", async () => {
    const admin = {
      graphql: jest.fn(
        makeBundleResponse({
          collectionProductIds: ["gid://shopify/Product/333"],
          products: [
            {
              id: "gid://shopify/Product/111",
              title: "Direct Product",
              sellingPlanGroups: [{ id: "gid://shopify/SellingPlanGroup/monthly", name: "Monthly" }],
            },
            {
              id: "gid://shopify/Product/333",
              title: "Collection Product",
              sellingPlanGroups: [{ id: "gid://shopify/SellingPlanGroup/weekly", name: "Weekly" }],
            },
          ],
        }),
      ),
    } as any;

    getDb().bundle.findFirst.mockResolvedValue(baseBundle);

    const response = await handleValidateSellingPlanGroups(admin, SESSION, "bundle-1");
    const body = await response.json() as any;

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.isValid).toBe(false);
    expect(body.productCount).toBe(2);
    expect(body.plans).toEqual([]);
    expect(body.message).toBe(SUBSCRIPTION_NO_COMMON_PLAN_MESSAGE);
  });
});
