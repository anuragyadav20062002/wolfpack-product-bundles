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

  it("preserves fallback variant inventory fields when inventory scope is granted", async () => {
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
      quantityAvailable: 0,
      currentlyNotInStock: false,
    });
  });
});
