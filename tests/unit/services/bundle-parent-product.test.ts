import db from "../../../app/db.server";
import {
  ensureBundleParentProduct,
  BundleParentProductError,
} from "../../../app/services/bundles/bundle-parent-product.server";

jest.mock("../../../app/db.server", () => ({
  __esModule: true,
  default: { bundle: { update: jest.fn() } },
}));

jest.mock("../../../app/lib/logger", () => ({
  AppLogger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

const mockedDb = db as jest.Mocked<typeof db>;

const bundle = {
  id: "bundle-1",
  name: "Build Your Box",
  shopifyProductId: null,
  shopifyProductHandle: null,
};

function response(data: Record<string, unknown>) {
  return { json: async () => data };
}

function createdProduct(handle = "build-your-box-1") {
  return {
    data: {
      productCreate: {
        product: {
          id: "gid://shopify/Product/10",
          handle,
          status: "UNLISTED",
          variants: {
            nodes: [{ id: "gid://shopify/ProductVariant/20" }],
          },
        },
        userErrors: [],
      },
    },
  };
}

function makeCreateAdmin(options: { publicationErrors?: unknown[]; variantErrors?: unknown[] } = {}) {
  return {
    graphql: jest.fn(async (query: string) => {
      if (query.includes("GetBundleParentShop")) {
        return response({ data: { shop: { name: "Merchant Shop" } } });
      }
      if (query.includes("CreateBundleParentProduct")) {
        return response(createdProduct());
      }
      if (query.includes("ConfigureBundleParentVariant")) {
        return response({
          data: {
            productVariantsBulkUpdate: {
              productVariants: [{ id: "gid://shopify/ProductVariant/20" }],
              userErrors: options.variantErrors ?? [],
            },
          },
        });
      }
      if (query.includes("GetOnlineStorePublication")) {
        return response({
          data: {
            publications: {
              nodes: [
                {
                  id: "gid://shopify/Publication/1",
                  catalog: {
                    title: "Channel Catalog 1 for Online Store",
                    apps: { nodes: [{ title: "Online Store" }] },
                  },
                },
                {
                  id: "gid://shopify/Publication/2",
                  catalog: {
                    title: "Channel Catalog 2 for Point of Sale",
                    apps: { nodes: [{ title: "Point of Sale" }] },
                  },
                },
              ],
            },
          },
        });
      }
      if (query.includes("PublishBundleParentProduct")) {
        return response({
          data: {
            publishablePublish: { userErrors: options.publicationErrors ?? [] },
          },
        });
      }
      throw new Error(`Unexpected GraphQL operation: ${query}`);
    }),
  } as any;
}

beforeEach(() => {
  jest.clearAllMocks();
  process.env.SHOPIFY_APP_URL = "https://app.example.test";
  (mockedDb.bundle.update as jest.Mock).mockResolvedValue({});
});

describe("ensureBundleParentProduct", () => {
  it("creates the same neutral parent contract for FPB and PPB callers", async () => {
    const fpbAdmin = makeCreateAdmin();
    const ppbAdmin = makeCreateAdmin();

    await ensureBundleParentProduct({
      admin: fpbAdmin,
      shopDomain: "test-shop.myshopify.com",
      appUrl: process.env.SHOPIFY_APP_URL,
      bundle,
    });
    await ensureBundleParentProduct({
      admin: ppbAdmin,
      shopDomain: "test-shop.myshopify.com",
      appUrl: process.env.SHOPIFY_APP_URL,
      bundle,
    });

    const fpbCreate = fpbAdmin.graphql.mock.calls.find(([query]: [string]) =>
      query.includes("CreateBundleParentProduct"),
    );
    const ppbCreate = ppbAdmin.graphql.mock.calls.find(([query]: [string]) =>
      query.includes("CreateBundleParentProduct"),
    );

    expect(fpbCreate?.[1]).toEqual(ppbCreate?.[1]);
    expect(fpbCreate?.[1]).toEqual({
      variables: {
        product: expect.objectContaining({
          title: "Build Your Box",
          handle: "build-your-box",
          productType: "product",
          vendor: "Merchant Shop",
          status: "UNLISTED",
          descriptionHtml: expect.stringContaining("Your Bundle is Unlisted"),
          tags: [
            "WP-Bundles",
            "wolfpack-bundle-parent",
            "wolfpack-hide-bundle-options",
          ],
        }),
        media: [
          {
            originalSource: "https://app.example.test/bundle-product-placeholder.avif",
            alt: null,
            mediaContentType: "IMAGE",
          },
        ],
      },
    });
  });

  it("persists Shopify's actual handle before configuring the variant and publication", async () => {
    const admin = makeCreateAdmin();

    const result = await ensureBundleParentProduct({
      admin,
      shopDomain: "test-shop.myshopify.com",
      appUrl: process.env.SHOPIFY_APP_URL,
      bundle,
    });

    expect(result).toEqual({
      productId: "gid://shopify/Product/10",
      variantId: "gid://shopify/ProductVariant/20",
      handle: "build-your-box-1",
      status: "UNLISTED",
      created: true,
    });
    expect(mockedDb.bundle.update).toHaveBeenCalledWith({
      where: { id: "bundle-1", shopId: "test-shop.myshopify.com" },
      data: {
        shopifyProductId: "gid://shopify/Product/10",
        shopifyProductHandle: "build-your-box-1",
      },
    });

    const updateOrder = (mockedDb.bundle.update as jest.Mock).mock.invocationCallOrder[0];
    const variantCall = admin.graphql.mock.calls.findIndex(([query]: [string]) =>
      query.includes("ConfigureBundleParentVariant"),
    );
    const publicationCall = admin.graphql.mock.calls.findIndex(([query]: [string]) =>
      query.includes("PublishBundleParentProduct"),
    );
    expect(updateOrder).toBeLessThan(admin.graphql.mock.invocationCallOrder[variantCall]);
    expect(updateOrder).toBeLessThan(admin.graphql.mock.invocationCallOrder[publicationCall]);
  });

  it("enforces the neutral variant and publishes only to Online Store", async () => {
    const admin = makeCreateAdmin();

    await ensureBundleParentProduct({
      admin,
      shopDomain: "test-shop.myshopify.com",
      appUrl: process.env.SHOPIFY_APP_URL,
      bundle,
    });

    expect(admin.graphql).toHaveBeenCalledWith(
      expect.stringContaining("ConfigureBundleParentVariant"),
      {
        variables: {
          productId: "gid://shopify/Product/10",
          variants: [
            {
              id: "gid://shopify/ProductVariant/20",
              price: "0.00",
              inventoryPolicy: "CONTINUE",
              taxable: false,
              requiresComponents: true,
            },
          ],
        },
      },
    );
    expect(admin.graphql).toHaveBeenCalledWith(
      expect.stringContaining("PublishBundleParentProduct"),
      {
        variables: {
          id: "gid://shopify/Product/10",
          input: [{ publicationId: "gid://shopify/Publication/1" }],
        },
      },
    );
  });

  it("preserves merchant metadata and refreshes only the stored handle for an existing product", async () => {
    const existingBundle = {
      ...bundle,
      shopifyProductId: "gid://shopify/Product/10",
      shopifyProductHandle: "old-handle",
    };
    const admin = makeCreateAdmin();
    admin.graphql.mockImplementation(async (query: string) => {
      if (query.includes("GetBundleParentProduct")) {
        return response({
          data: {
            product: {
              id: "gid://shopify/Product/10",
              title: "Merchant Title",
              handle: "merchant-handle",
              status: "ACTIVE",
              variants: { nodes: [{ id: "gid://shopify/ProductVariant/20" }] },
            },
          },
        });
      }
      if (query.includes("ConfigureBundleParentVariant")) {
        return response({ data: { productVariantsBulkUpdate: { productVariants: [], userErrors: [] } } });
      }
      if (query.includes("GetOnlineStorePublication")) {
        return response({
          data: {
            publications: {
              nodes: [
                {
                  id: "gid://shopify/Publication/1",
                  catalog: { title: "Channel Catalog 1 for Online Store" },
                },
              ],
            },
          },
        });
      }
      if (query.includes("PublishBundleParentProduct")) {
        return response({ data: { publishablePublish: { userErrors: [] } } });
      }
      throw new Error(`Unexpected GraphQL operation: ${query}`);
    });

    const result = await ensureBundleParentProduct({
      admin,
      shopDomain: "test-shop.myshopify.com",
      appUrl: process.env.SHOPIFY_APP_URL,
      bundle: existingBundle,
    });

    expect(result).toMatchObject({ handle: "merchant-handle", status: "ACTIVE", created: false });
    expect(admin.graphql.mock.calls.some(([query]: [string]) => query.includes("productUpdate"))).toBe(false);
    expect(admin.graphql.mock.calls.some(([query]: [string]) => query.includes("productCreate"))).toBe(false);
    expect(mockedDb.bundle.update).toHaveBeenCalledWith({
      where: { id: "bundle-1", shopId: "test-shop.myshopify.com" },
      data: { shopifyProductHandle: "merchant-handle" },
    });
  });

  it("recreates a deleted stored product in the same operation", async () => {
    const admin = makeCreateAdmin();
    const original = admin.graphql.getMockImplementation()!;
    admin.graphql.mockImplementation(async (query: string, options?: unknown) => {
      if (query.includes("GetBundleParentProduct")) {
        return response({ data: { product: null } });
      }
      return original(query, options);
    });

    const result = await ensureBundleParentProduct({
      admin,
      shopDomain: "test-shop.myshopify.com",
      appUrl: process.env.SHOPIFY_APP_URL,
      bundle: { ...bundle, shopifyProductId: "gid://shopify/Product/deleted" },
    });

    expect(result.created).toBe(true);
    expect(admin.graphql.mock.calls.filter(([query]: [string]) => query.includes("CreateBundleParentProduct"))).toHaveLength(1);
  });

  it("keeps the created product persisted when a later publication fails", async () => {
    const admin = makeCreateAdmin({
      publicationErrors: [{ field: ["input"], message: "Publication rejected" }],
    });

    await expect(
      ensureBundleParentProduct({
        admin,
        shopDomain: "test-shop.myshopify.com",
        appUrl: process.env.SHOPIFY_APP_URL,
        bundle,
      }),
    ).rejects.toEqual(
      expect.objectContaining<Partial<BundleParentProductError>>({
        name: "BundleParentProductError",
        operation: "publish parent product",
        message: expect.stringContaining("Publication rejected"),
      }),
    );
    expect(mockedDb.bundle.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ shopifyProductId: "gid://shopify/Product/10" }),
      }),
    );
  });

  it("reuses the persisted product when retrying after a post-create failure", async () => {
    const firstAdmin = makeCreateAdmin({
      publicationErrors: [{ field: ["input"], message: "Publication rejected" }],
    });
    await expect(
      ensureBundleParentProduct({
        admin: firstAdmin,
        shopDomain: "test-shop.myshopify.com",
        appUrl: process.env.SHOPIFY_APP_URL,
        bundle,
      }),
    ).rejects.toBeInstanceOf(BundleParentProductError);

    const retryAdmin = makeCreateAdmin();
    retryAdmin.graphql.mockImplementation(async (query: string) => {
      if (query.includes("GetBundleParentProduct")) {
        return response({
          data: {
            product: {
              id: "gid://shopify/Product/10",
              handle: "build-your-box-1",
              status: "UNLISTED",
              variants: { nodes: [{ id: "gid://shopify/ProductVariant/20" }] },
            },
          },
        });
      }
      if (query.includes("ConfigureBundleParentVariant")) {
        return response({ data: { productVariantsBulkUpdate: { productVariants: [], userErrors: [] } } });
      }
      if (query.includes("GetOnlineStorePublication")) {
        return response({
          data: {
            publications: {
              nodes: [
                {
                  id: "gid://shopify/Publication/1",
                  catalog: { title: "Channel Catalog 1 for Online Store" },
                },
              ],
            },
          },
        });
      }
      if (query.includes("PublishBundleParentProduct")) {
        return response({ data: { publishablePublish: { userErrors: [] } } });
      }
      throw new Error(`Unexpected GraphQL operation: ${query}`);
    });

    const retryResult = await ensureBundleParentProduct({
      admin: retryAdmin,
      shopDomain: "test-shop.myshopify.com",
      appUrl: process.env.SHOPIFY_APP_URL,
      bundle: {
        ...bundle,
        shopifyProductId: "gid://shopify/Product/10",
        shopifyProductHandle: "build-your-box-1",
      },
    });

    expect(retryResult.created).toBe(false);
    expect(retryAdmin.graphql.mock.calls.some(([query]: [string]) => query.includes("CreateBundleParentProduct"))).toBe(false);
  });
});
