import {
  discoverSalesChannels,
  publishProductToSalesChannels,
} from "../../../app/services/shopify-publications.server";

jest.mock("../../../app/lib/logger", () => ({
  AppLogger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

const { AppLogger } = jest.requireMock("../../../app/lib/logger");

function makeResponse(data: Record<string, unknown>) {
  return {
    json: async () => data,
  };
}

describe("shopify-publications", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("discovers valid sales channel publications", async () => {
    const admin = {
      graphql: jest.fn().mockResolvedValue(makeResponse({
        data: {
          publications: {
            edges: [
              { node: { id: "gid://shopify/Publication/1", name: "Online Store" } },
              { node: { id: "gid://shopify/Publication/2", name: "Point of Sale" } },
              { node: { id: "", name: "Broken" } },
            ],
          },
        },
      })),
    } as any;

    await expect(discoverSalesChannels(admin)).resolves.toEqual([
      { id: "gid://shopify/Publication/1", name: "Online Store" },
      { id: "gid://shopify/Publication/2", name: "Point of Sale" },
    ]);
  });

  it("publishes products to discovered sales channels", async () => {
    const admin = {
      graphql: jest
        .fn()
        .mockResolvedValueOnce(makeResponse({
          data: {
            publications: {
              edges: [
                { node: { id: "gid://shopify/Publication/1", name: "Online Store" } },
                { node: { id: "gid://shopify/Publication/2", name: "Point of Sale" } },
              ],
            },
          },
        }))
        .mockResolvedValueOnce(makeResponse({
          data: {
            publishablePublish: {
              userErrors: [],
            },
          },
        })),
    } as any;

    await publishProductToSalesChannels(admin, "gid://shopify/Product/1", "test-operation");

    expect(admin.graphql).toHaveBeenCalledTimes(2);
    expect(admin.graphql).toHaveBeenLastCalledWith(
      expect.stringContaining("publishablePublish"),
      {
        variables: {
          id: "gid://shopify/Product/1",
          input: [
            { publicationId: "gid://shopify/Publication/1" },
            { publicationId: "gid://shopify/Publication/2" },
          ],
        },
      },
    );
    expect(AppLogger.info).toHaveBeenCalledWith(
      "Product published to sales channels",
      expect.objectContaining({
        operation: "test-operation",
        productId: "gid://shopify/Product/1",
        channelCount: 2,
      }),
    );
  });

  it("does not throw when Shopify returns publication user errors", async () => {
    const admin = {
      graphql: jest
        .fn()
        .mockResolvedValueOnce(makeResponse({
          data: {
            publications: {
              edges: [
                { node: { id: "gid://shopify/Publication/1", name: "Online Store" } },
              ],
            },
          },
        }))
        .mockResolvedValueOnce(makeResponse({
          data: {
            publishablePublish: {
              userErrors: [{ field: ["input"], message: "Already published" }],
            },
          },
        })),
    } as any;

    await expect(
      publishProductToSalesChannels(admin, "gid://shopify/Product/1", "test-operation"),
    ).resolves.toBeUndefined();

    expect(AppLogger.warn).toHaveBeenCalledWith(
      "Shopify returned user errors while publishing product",
      expect.objectContaining({
        operation: "test-operation",
        productId: "gid://shopify/Product/1",
      }),
    );
  });
});
