import { loader } from "../../../app/routes/api/api.storefront-products";
import { getOfflineSessionForShop } from "../../../app/services/offline-token.server";

jest.mock("../../../app/db.server", () => ({
  __esModule: true,
  default: {},
}));

jest.mock("../../../app/shopify.server", () => ({
  sessionStorage: {},
}));

jest.mock("../../../app/lib/logger", () => ({
  AppLogger: {
    debug: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  },
}));

jest.mock("../../../app/services/offline-token.server", () => ({
  getOfflineSessionForShop: jest.fn(),
}));

jest.mock("../../../app/services/storefront-token.server", () => ({
  createStorefrontAccessToken: jest.fn(),
}));

const mockFetch = jest.fn();

describe("api.storefront-products loader", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = mockFetch as any;
    (getOfflineSessionForShop as jest.Mock).mockResolvedValue({
      accessToken: "admin-token",
      storefrontAccessToken: "storefront-token",
      scope: "unauthenticated_read_product_inventory,unauthenticated_read_product_listings",
    });
  });

  afterEach(() => {
    delete (global as any).fetch;
  });

  it("normalizes sellable zero-quantity fallback variants as unbounded inventory", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            nodes: [
              {
                id: "gid://shopify/Product/111",
                title: "Tracked Product",
                handle: "tracked-product",
                description: "Detailed product copy",
                descriptionHtml: "<p>Detailed <strong>product</strong> copy</p>",
                featuredImage: null,
                variants: {
                  edges: [
                    {
                      node: {
                        id: "gid://shopify/ProductVariant/222",
                        title: "Default Title",
                        availableForSale: true,
                        quantityAvailable: 0,
                        currentlyNotInStock: false,
                        price: { amount: "10.00", currencyCode: "USD" },
                        compareAtPrice: null,
                        image: null,
                      },
                    },
                  ],
                },
              },
            ],
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

    const response = await loader({
      request: new Request("https://app.example/api/storefront-products?ids=gid://shopify/Product/111&shop=test.myshopify.com"),
      params: {},
      context: {},
    } as any);
    const body = await response.json() as { products: any[] };
    const firstRequestBody = JSON.parse(mockFetch.mock.calls[0][1].body);

    expect(firstRequestBody.query).toContain("quantityAvailable");
    expect(firstRequestBody.query).toContain("currentlyNotInStock");
    expect(body.products[0].variants[0]).toMatchObject({
      available: true,
      quantityAvailable: null,
      currentlyNotInStock: false,
    });
    expect(body.products[0].description).toBe("Detailed product copy");
    expect(body.products[0].descriptionHtml).toBe("<p>Detailed <strong>product</strong> copy</p>");
  });

  it("hydrates all product variants without requesting selling plan allocations when scope is absent", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            nodes: [
              {
                id: "gid://shopify/Product/111",
                title: "Variant Product",
                handle: "variant-product",
                description: "",
                descriptionHtml: "",
                featuredImage: null,
                variants: {
                  edges: [
                    {
                      node: {
                        id: "gid://shopify/ProductVariant/222",
                        title: "6",
                        availableForSale: true,
                        quantityAvailable: 0,
                        currentlyNotInStock: false,
                        price: { amount: "10.00", currencyCode: "USD" },
                        compareAtPrice: null,
                        image: null,
                      },
                    },
                  ],
                },
              },
            ],
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          errors: [
            {
              message: "Access denied for quantityAvailable field. Required access: `unauthenticated_read_product_inventory` access scope.",
              extensions: { code: "ACCESS_DENIED" },
            },
          ],
          data: {
            product: {
              variants: {
                pageInfo: { hasNextPage: false, endCursor: null },
                edges: [
                  {
                    node: {
                      id: "gid://shopify/ProductVariant/222",
                      title: "6",
                      availableForSale: true,
                      quantityAvailable: 0,
                      currentlyNotInStock: false,
                      price: { amount: "10.00", currencyCode: "USD" },
                      compareAtPrice: null,
                      weight: 0,
                      weightUnit: "GRAMS",
                      image: null,
                    },
                  },
                  {
                    node: {
                      id: "gid://shopify/ProductVariant/444",
                      title: "7",
                      availableForSale: true,
                      quantityAvailable: 3,
                      currentlyNotInStock: false,
                      price: { amount: "11.00", currencyCode: "USD" },
                      compareAtPrice: null,
                      weight: 0,
                      weightUnit: "GRAMS",
                      image: null,
                    },
                  },
                ],
              },
            },
          },
        }),
      });

    const response = await loader({
      request: new Request("https://app.example/api/storefront-products?ids=gid://shopify/Product/111&shop=test.myshopify.com"),
      params: {},
      context: {},
    } as any);
    const body = await response.json() as { products: any[] };
    const variantsRequestBody = JSON.parse(mockFetch.mock.calls[1][1].body);

    expect(variantsRequestBody.query).not.toContain("sellingPlanAllocations");
    expect(body.products[0].variants).toHaveLength(2);
    expect(body.products[0].variants.map((variant) => variant.title)).toEqual(["6", "7"]);
  });

  it("hydrates selling plan allocation IDs from selling plan IDs when scope is granted", async () => {
    (getOfflineSessionForShop as jest.Mock).mockResolvedValue({
      accessToken: "admin-token",
      storefrontAccessToken: "storefront-token",
      scope: "unauthenticated_read_product_inventory,unauthenticated_read_product_listings,unauthenticated_read_selling_plans",
    });
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            nodes: [
              {
                id: "gid://shopify/Product/111",
                title: "Subscription Product",
                handle: "subscription-product",
                description: "",
                descriptionHtml: "",
                featuredImage: null,
                variants: {
                  edges: [
                    {
                      node: {
                        id: "gid://shopify/ProductVariant/222",
                        title: "Default Title",
                        availableForSale: true,
                        quantityAvailable: 3,
                        currentlyNotInStock: false,
                        price: { amount: "10.00", currencyCode: "USD" },
                        compareAtPrice: null,
                        image: null,
                      },
                    },
                  ],
                },
              },
            ],
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            product: {
              variants: {
                pageInfo: { hasNextPage: false, endCursor: null },
                edges: [
                  {
                    node: {
                      id: "gid://shopify/ProductVariant/222",
                      title: "Default Title",
                      availableForSale: true,
                      quantityAvailable: 3,
                      currentlyNotInStock: false,
                      price: { amount: "10.00", currencyCode: "USD" },
                      compareAtPrice: null,
                      weight: 0,
                      weightUnit: "GRAMS",
                      image: null,
                      sellingPlanAllocations: {
                        edges: [
                          {
                            node: {
                              priceAdjustments: [],
                              sellingPlan: {
                                id: "gid://shopify/SellingPlan/333",
                                name: "Monthly",
                              },
                            },
                          },
                        ],
                      },
                    },
                  },
                ],
              },
            },
          },
        }),
      });

    const response = await loader({
      request: new Request("https://app.example/api/storefront-products?ids=gid://shopify/Product/111&shop=test.myshopify.com"),
      params: {},
      context: {},
    } as any);
    const body = await response.json() as { products: any[] };
    const variantsRequestBody = JSON.parse(mockFetch.mock.calls[1][1].body);

    expect(variantsRequestBody.query).toContain("sellingPlanAllocations");
    expect(variantsRequestBody.query).not.toMatch(/sellingPlanAllocations[\s\S]*node\s*{\s*id\b/);
    expect(body.products[0].variants[0].sellingPlanAllocations[0]).toMatchObject({
      id: "gid://shopify/SellingPlan/333",
      sellingPlan: {
        id: "gid://shopify/SellingPlan/333",
        name: "Monthly",
      },
    });
  });
});
