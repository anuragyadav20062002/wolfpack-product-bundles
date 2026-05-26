/**
 * Unit tests — PPB handleSyncProduct
 *
 * Spec: test-spec/edit-bundle-flow.spec.md § Suite 7
 * Issue: [edit-bundle-flow-tests-1]
 */

import {
  handleSyncBundle,
  handleSyncProduct,
} from "../../../app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/handlers/handlers.server";

jest.mock("../../../app/db.server", () => ({
  __esModule: true,
  default: {
    bundle: { findUnique: jest.fn(), update: jest.fn() },
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

jest.mock("../../../app/services/bundles/metafield-sync.server", () => ({
  updateBundleProductMetafields: jest.fn().mockResolvedValue(undefined),
  updateComponentProductMetafields: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("../../../app/services/bundles/standard-metafields.server", () => ({
  convertBundleToStandardMetafields: jest
    .fn()
    .mockResolvedValue({ metafields: {}, errors: [] }),
  updateProductStandardMetafields: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("../../../app/services/bundles/pricing-calculation.server", () => ({
  calculateBundlePrice: jest.fn().mockResolvedValue("50.00"),
  updateBundleProductPrice: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("../../../app/utils/variant-lookup.server", () => ({
  getBundleProductVariantId: jest
    .fn()
    .mockResolvedValue("gid://shopify/ProductVariant/99"),
}));

jest.mock("../../../app/services/theme-colors.server", () => ({
  syncThemeColors: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("../../../app/services/widget-installation.server", () => ({
  WidgetInstallationService: {
    createFullPageBundle: jest.fn(),
    validateProductBundleWidgetSetup: jest.fn().mockResolvedValue({ requiresOneTimeSetup: false }),
  },
}));

jest.mock("../../../app/services/theme-template.server", () => ({
  ThemeTemplateService: { ensureTemplates: jest.fn() },
}));

jest.mock("../../../app/services/shopify-publications.server", () => ({
  publishProductToSalesChannels: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("../../../app/lib/css-sanitizer", () => ({
  processCss: jest.fn((css: string) => ({ sanitizedCss: css, isValid: true, warnings: [], syntaxErrors: [] })),
}));

const getDb = () => require("../../../app/db.server").default;
const getMetafieldSync = () => require("../../../app/services/bundles/metafield-sync.server");
const getPublishProductToSalesChannels = () =>
  require("../../../app/services/shopify-publications.server").publishProductToSalesChannels;

const MOCK_SESSION = { shop: "test-shop.myshopify.com", accessToken: "tok" } as any;
const ORIGINAL_APP_URL = process.env.SHOPIFY_APP_URL;

const SHOPIFY_PRODUCT = {
  id: "gid://shopify/Product/1",
  title: "PPB Bundle Product",
  description: "A PPB bundle",
  descriptionHtml: "<p>A PPB bundle</p>",
  handle: "ppb-bundle-product",
  status: "ACTIVE",
  productType: "Bundle",
  vendor: "Bundle Builder",
  tags: ["WP-Bundles"],
  onlineStoreUrl: null,
  featuredMedia: null,
  media: { nodes: [] },
  variants: { nodes: [{ id: "gid://shopify/ProductVariant/1", price: "50.00", compareAtPrice: null, sku: null, inventoryQuantity: null }] },
  updatedAt: "2026-05-01T00:00:00Z",
  createdAt: "2026-01-01T00:00:00Z",
};

function makeBundle(overrides: Record<string, unknown> = {}) {
  return {
    id: "bundle-1",
    name: "PPB Bundle",
    description: "A PPB bundle",
    status: "active",
    shopifyProductId: "gid://shopify/Product/1",
    shopifyProductHandle: "ppb-bundle-product",
    bundleType: "product_page",
    templateName: null,
    steps: [],
    pricing: null,
    ...overrides,
  };
}

function makeAdmin(productData: Record<string, unknown> | null = SHOPIFY_PRODUCT) {
  return {
    graphql: jest.fn().mockResolvedValue({
      json: async () => ({
        data: {
          product: productData,
          productCreate: {
            product: {
              id: "gid://shopify/Product/NEW",
              title: "PPB Bundle",
              handle: "bundle-bundle-1",
              status: "ACTIVE",
              variants: { edges: [{ node: { id: "gid://shopify/ProductVariant/NEW" } }] },
            },
            userErrors: [],
          },
          productVariantsBulkUpdate: { productVariants: [{ id: "gid://shopify/ProductVariant/NEW", price: "50.00" }], userErrors: [] },
        },
      }),
    }),
  } as any;
}

beforeEach(() => {
  jest.clearAllMocks();
  process.env.SHOPIFY_APP_URL = "https://app.example.test";
  getDb().bundle.update.mockResolvedValue({});
});

afterEach(() => {
  process.env.SHOPIFY_APP_URL = ORIGINAL_APP_URL;
});

describe("PPB handleSyncProduct", () => {
  it("returns 404 when the bundle does not exist in DB", async () => {
    getDb().bundle.findUnique.mockResolvedValue(null);
    const res = await handleSyncProduct(makeAdmin(), MOCK_SESSION, "bundle-1", new FormData());
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.success).toBe(false);
  });

  it("returns success when product exists in Shopify with no description change", async () => {
    getDb().bundle.findUnique.mockResolvedValue(makeBundle({ description: "A PPB bundle" }));
    const admin = makeAdmin({ ...SHOPIFY_PRODUCT, description: "A PPB bundle" });
    const res = await handleSyncProduct(admin, MOCK_SESSION, "bundle-1", new FormData());
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.syncedData.changesDetected).toBe(false);
  });

  it("removes stale generated product media references during sync", async () => {
    getDb().bundle.findUnique.mockResolvedValue(makeBundle({ name: "Product Page Fixture" }));
    const admin = {
      graphql: jest
        .fn()
        .mockResolvedValueOnce({
          json: async () => ({
            data: {
              product: {
                ...SHOPIFY_PRODUCT,
                title: "Product Page Fixture",
                description: "A PPB bundle",
                media: {
                  nodes: [
                    {
                      id: "gid://shopify/MediaImage/current",
                      alt: "Product Page Fixture - Bundle",
                      image: { url: "https://cdn.shopify.com/files/bundle-product-placeholder.png" },
                    },
                    {
                      id: "gid://shopify/MediaImage/old",
                      alt: "Old Product - Bundle",
                      image: { url: "https://cdn.shopify.com/files/bundle_old.png" },
                    },
                  ],
                },
              },
            },
          }),
        })
        .mockResolvedValueOnce({
          json: async () => ({
            data: {
              fileUpdate: {
                files: [{ id: "gid://shopify/MediaImage/old" }],
                userErrors: [],
              },
            },
          }),
        }),
    } as any;

    const res = await handleSyncProduct(admin, MOCK_SESSION, "bundle-1", new FormData());
    const body = await res.json();

    expect(body.success).toBe(true);
    expect(admin.graphql).toHaveBeenCalledWith(
      expect.stringContaining("fileUpdate"),
      expect.objectContaining({
        variables: {
          files: [
            {
              id: "gid://shopify/MediaImage/old",
              referencesToRemove: ["gid://shopify/Product/1"],
            },
          ],
        },
      }),
    );
  });

  it("updates DB description when Shopify description differs", async () => {
    getDb().bundle.findUnique.mockResolvedValue(makeBundle({ description: "Old" }));
    const admin = makeAdmin({ ...SHOPIFY_PRODUCT, description: "New PPB description" });
    const res = await handleSyncProduct(admin, MOCK_SESSION, "bundle-1", new FormData());
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.syncedData.changesDetected).toBe(true);
    expect(getDb().bundle.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ description: "New PPB description" }) })
    );
  });

  it("clears shopifyProductId and returns 404 when product was deleted in Shopify", async () => {
    getDb().bundle.findUnique.mockResolvedValue(makeBundle());
    const admin = makeAdmin(null);
    const res = await handleSyncProduct(admin, MOCK_SESSION, "bundle-1", new FormData());
    expect(res.status).toBe(404);
    expect(getDb().bundle.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { shopifyProductId: null } })
    );
  });

  it("returns 400 when Shopify GraphQL returns transport errors", async () => {
    getDb().bundle.findUnique.mockResolvedValue(makeBundle());
    const admin = {
      graphql: jest.fn().mockResolvedValue({
        json: async () => ({ data: {}, errors: [{ message: "Rate limited" }] }),
      }),
    } as any;
    const res = await handleSyncProduct(admin, MOCK_SESSION, "bundle-1", new FormData());
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/Rate limited/);
  });

  it("creates a new Shopify product when bundle has no shopifyProductId", async () => {
    getDb().bundle.findUnique.mockResolvedValue(makeBundle({ shopifyProductId: null }));
    const admin = makeAdmin();
    const res = await handleSyncProduct(admin, MOCK_SESSION, "bundle-1", new FormData());
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.productId).toBe("gid://shopify/Product/NEW");
    expect(getDb().bundle.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          shopifyProductId: "gid://shopify/Product/NEW",
          shopifyProductHandle: "bundle-bundle-1",
        }),
      })
    );
    expect(getPublishProductToSalesChannels()).toHaveBeenCalledWith(
      admin,
      "gid://shopify/Product/NEW",
      "ppb-sync-product-create",
    );
    expect(admin.graphql).toHaveBeenCalledWith(
      expect.stringContaining("ProductCreateInput"),
      expect.objectContaining({
        variables: expect.objectContaining({
          product: expect.objectContaining({
            title: "PPB Bundle",
            handle: "bundle-bundle-1",
          }),
          media: [
            expect.objectContaining({
              originalSource: "https://app.example.test/bundle-product-placeholder.png",
              alt: "PPB Bundle - Bundle",
              mediaContentType: "IMAGE",
            }),
          ],
        }),
      }),
    );
  });

  it("recreates a synced bundle product with the generated placeholder media", async () => {
    getDb().bundle.findUnique.mockResolvedValue(makeBundle());
    const admin = {
      graphql: jest
        .fn()
        .mockResolvedValueOnce({
          json: async () => ({
            data: { productUpdate: { product: { id: "gid://shopify/Product/1", status: "ARCHIVED" }, userErrors: [] } },
          }),
        })
        .mockResolvedValueOnce({
          json: async () => ({
            data: { productDelete: { deletedProductId: "gid://shopify/Product/1", userErrors: [] } },
          }),
        })
        .mockResolvedValueOnce({
          json: async () => ({
            data: {
              productCreate: {
                product: {
                  id: "gid://shopify/Product/NEW",
                  title: "PPB Bundle",
                  handle: "bundle-bundle-1",
                  status: "ACTIVE",
                  variants: { edges: [{ node: { id: "gid://shopify/ProductVariant/NEW" } }] },
                },
                userErrors: [],
              },
            },
          }),
        })
        .mockResolvedValueOnce({
          json: async () => ({
            data: {
              productVariantsBulkUpdate: {
                productVariants: [{ id: "gid://shopify/ProductVariant/NEW", price: "50.00" }],
                userErrors: [],
              },
            },
          }),
        })
        .mockResolvedValue({
          json: async () => ({
            data: {
              productUpdate: {
                product: { id: "gid://shopify/Product/NEW", status: "ACTIVE" },
                userErrors: [],
              },
            },
          }),
        }),
    } as any;

    const res = await handleSyncBundle(admin, MOCK_SESSION, "bundle-1");
    const body = await res.json();

    expect(body.success).toBe(true);
    expect(admin.graphql.mock.calls[2][0]).toContain("ProductCreateInput");
    expect(admin.graphql.mock.calls[2][1]).toEqual(
      expect.objectContaining({
        variables: expect.objectContaining({
          product: expect.objectContaining({
            title: "PPB Bundle",
            handle: "bundle-bundle-1",
          }),
          media: [
            expect.objectContaining({
              originalSource: "https://app.example.test/bundle-product-placeholder.png",
              alt: "PPB Bundle - Bundle",
              mediaContentType: "IMAGE",
            }),
          ],
        }),
      }),
    );
  });

  it("syncedData includes title, description, and status from Shopify", async () => {
    getDb().bundle.findUnique.mockResolvedValue(makeBundle());
    const admin = makeAdmin();
    const res = await handleSyncProduct(admin, MOCK_SESSION, "bundle-1", new FormData());
    const body = await res.json();
    expect(body.syncedData).toMatchObject({
      title: "PPB Bundle Product",
      status: "ACTIVE",
    });
  });

  it("preserves StepCategory products and variants in sync metafield payloads", async () => {
    getDb().bundle.findUnique.mockResolvedValue(makeBundle({
      pricing: {
        enabled: true,
        method: "percentage_off",
        rules: JSON.stringify([]),
        messages: JSON.stringify({}),
      },
      steps: [
        {
          id: "step-1",
          name: "Step 1",
          position: 0,
          minQuantity: 1,
          maxQuantity: 1,
          products: [],
          collections: [],
          StepProduct: [],
          StepCategory: [
            {
              name: "Category 1",
              products: [
                {
                  id: "gid://shopify/Product/789",
                  title: "Category Product",
                  imageUrl: "https://cdn.shopify.com/product.jpg",
                  variants: [
                    { id: "gid://shopify/ProductVariant/V789A", title: "Unavailable" },
                    { id: "gid://shopify/ProductVariant/V789B", title: "Available" },
                  ],
                },
              ],
              collections: [
                { id: "gid://shopify/Collection/456", title: "Category Collection", handle: "category-collection" },
              ],
            },
          ],
        },
      ],
    }));
    const admin = makeAdmin({ ...SHOPIFY_PRODUCT, description: "A PPB bundle" });

    const res = await handleSyncProduct(admin, MOCK_SESSION, "bundle-1", new FormData());
    const body = await res.json();

    expect(body.success).toBe(true);
    const { updateBundleProductMetafields, updateComponentProductMetafields } = getMetafieldSync();
    const bundleConfig = updateBundleProductMetafields.mock.calls[0][2];
    expect(bundleConfig.steps[0].products).toEqual([]);
    expect(bundleConfig.steps[0].collections).toEqual([]);
    expect(bundleConfig.steps[0].StepCategory[0].products).toEqual([
      {
        id: "gid://shopify/Product/789",
        title: "Category Product",
        imageUrl: "https://cdn.shopify.com/product.jpg",
        variants: [
          { id: "gid://shopify/ProductVariant/V789A", title: "Unavailable" },
          { id: "gid://shopify/ProductVariant/V789B", title: "Available" },
        ],
      },
    ]);
    expect(bundleConfig.steps[0].StepCategory[0].collections).toEqual([
      { id: "gid://shopify/Collection/456", title: "Category Collection", handle: "category-collection" },
    ]);
    expect(updateComponentProductMetafields).toHaveBeenCalledWith(
      admin,
      "gid://shopify/Product/1",
      expect.objectContaining({
        steps: expect.arrayContaining([
          expect.objectContaining({
            StepCategory: expect.arrayContaining([
              expect.objectContaining({
                products: expect.arrayContaining([
                  expect.objectContaining({ id: "gid://shopify/Product/789" }),
                ]),
              }),
            ]),
          }),
        ]),
      }),
    );
  });
});
