jest.mock("@heymantle/client", () => ({
  MantleClient: jest.fn(),
}));

jest.mock("../../../app/lib/logger", () => ({
  AppLogger: {
    warn: jest.fn(),
  },
}));

const { MantleClient } = require("@heymantle/client");

describe("buildMantleProviderConfig", () => {
  beforeEach(() => {
    MantleClient.mockReset();
  });

  it("returns null when Mantle credentials or Shopify access token are missing", async () => {
    const { buildMantleProviderConfig } = await import("../../../app/services/mantle.server");
    const admin = { graphql: jest.fn() };

    await expect(buildMantleProviderConfig({
      appId: "",
      apiKey: "api-key",
      shopDomain: "test-shop.myshopify.com",
      accessToken: "shopify-token",
      admin,
    })).resolves.toBeNull();

    await expect(buildMantleProviderConfig({
      appId: "app-id",
      apiKey: "api-key",
      shopDomain: "test-shop.myshopify.com",
      accessToken: "",
      admin,
    })).resolves.toBeNull();

    expect(admin.graphql).not.toHaveBeenCalled();
    expect(MantleClient).not.toHaveBeenCalled();
  });

  it("identifies the Shopify shop server-side and returns the React provider config", async () => {
    const identify = jest.fn().mockResolvedValue({ apiToken: "customer-token" });
    MantleClient.mockImplementation(() => ({ identify }));
    const admin = {
      graphql: jest.fn().mockResolvedValue({
        json: jest.fn().mockResolvedValue({
          data: {
            shop: {
              id: "gid://shopify/Shop/123",
              name: "Test Shop",
              email: "owner@example.com",
              myshopifyDomain: "test-shop.myshopify.com",
            },
          },
        }),
      }),
    };
    const { buildMantleProviderConfig } = await import("../../../app/services/mantle.server");

    await expect(buildMantleProviderConfig({
      appId: "app-id",
      apiKey: "api-key",
      apiUrl: "https://mantle.example.test/v1",
      shopDomain: "test-shop.myshopify.com",
      accessToken: "shopify-token",
      admin,
    })).resolves.toEqual({
      appId: "app-id",
      apiUrl: "https://mantle.example.test/v1",
      customerApiToken: "customer-token",
    });

    expect(MantleClient).toHaveBeenCalledWith({
      appId: "app-id",
      apiKey: "api-key",
      apiUrl: "https://mantle.example.test/v1",
    });
    expect(identify).toHaveBeenCalledWith({
      platform: "shopify",
      platformId: "gid://shopify/Shop/123",
      myshopifyDomain: "test-shop.myshopify.com",
      accessToken: "shopify-token",
      name: "Test Shop",
      email: "owner@example.com",
    });
  });
});
