import { loader } from "../../../app/routes/api/api.storefront-collections";
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
    warn: jest.fn(),
  },
}));

jest.mock("../../../app/services/offline-token.server", () => ({
  getOfflineSessionForShop: jest.fn(),
}));

const mockFetch = jest.fn();

describe("api.storefront-collections loader", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = mockFetch as any;
    (getOfflineSessionForShop as jest.Mock).mockResolvedValue({
      storefrontAccessToken: "storefront-token",
    });
  });

  afterEach(() => {
    delete (global as any).fetch;
  });

  it("preserves variant weight fields for category weight rules", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          collections: {
            edges: [
              {
                node: {
                  id: "gid://shopify/Collection/1",
                  handle: "rings",
                  products: {
                    edges: [
                      {
                        node: {
                          id: "gid://shopify/Product/111",
                          title: "Ring",
                          handle: "ring",
                          featuredImage: { url: "https://cdn.example/ring.jpg" },
                          variants: {
                            edges: [
                              {
                                node: {
                                  id: "gid://shopify/ProductVariant/222",
                                  title: "Default Title",
                                  price: { amount: "10.00", currencyCode: "USD" },
                                  compareAtPrice: null,
                                  availableForSale: true,
                                  weight: 4,
                                  weightUnit: "OUNCES",
                                  image: { url: "https://cdn.example/variant.jpg" },
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
            ],
          },
        },
      }),
    });

    const response = await loader({
      request: new Request("https://app.example/api/storefront-collections?handles=rings&shop=test.myshopify.com"),
      params: {},
      context: {},
    } as any);
    const body = await response.json() as { products: any[] };

    expect(body.products[0].variants[0]).toMatchObject({
      id: "gid://shopify/ProductVariant/222",
      weight: 4,
      weightUnit: "OUNCES",
    });
  });

  it("preserves variant option fields for grouped product variant selectors", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          collections: {
            edges: [
              {
                node: {
                  id: "gid://shopify/Collection/1",
                  handle: "meals",
                  products: {
                    edges: [
                      {
                        node: {
                          id: "gid://shopify/Product/111",
                          title: "Meal Subscription",
                          handle: "meal-subscription",
                          featuredImage: { url: "https://cdn.example/meal.jpg" },
                          options: [
                            { name: "Meals", values: ["4 meals", "6 meals"] },
                            { name: "Frequency", values: ["Weekly"] },
                          ],
                          variants: {
                            edges: [
                              {
                                node: {
                                  id: "gid://shopify/ProductVariant/222",
                                  title: "4 meals / Weekly",
                                  selectedOptions: [
                                    { name: "Meals", value: "4 meals" },
                                    { name: "Frequency", value: "Weekly" },
                                  ],
                                  price: { amount: "63.60", currencyCode: "USD" },
                                  compareAtPrice: null,
                                  availableForSale: true,
                                  weight: 0,
                                  weightUnit: "GRAMS",
                                  image: null,
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
            ],
          },
        },
      }),
    });

    const response = await loader({
      request: new Request("https://app.example/api/storefront-collections?handles=meals&shop=test.myshopify.com"),
      params: {},
      context: {},
    } as any);
    const body = await response.json() as { products: any[] };

    expect(body.products[0].options).toEqual([
      { name: "Meals", values: ["4 meals", "6 meals"] },
      { name: "Frequency", values: ["Weekly"] },
    ]);
    expect(body.products[0].variants[0]).toMatchObject({
      id: "gid://shopify/ProductVariant/222",
      option1: "4 meals",
      option2: "Weekly",
      option3: null,
    });
  });
});
