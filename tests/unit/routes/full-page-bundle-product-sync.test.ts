import { createMockGraphQLResponse } from "../../setup";

jest.mock("../../../app/lib/logger", () => ({
  AppLogger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    startTimer: jest.fn(() => jest.fn()),
  },
}));

jest.mock("../../../app/db.server", () => ({
  __esModule: true,
  default: {
    bundle: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

jest.mock("../../../app/services/bundles/pricing-calculation.server", () => ({
  calculateBundlePrice: jest.fn(),
  updateBundleProductPrice: jest.fn(),
}));

jest.mock("../../../app/services/bundles/metafield-sync.server", () => ({
  updateBundleProductMetafields: jest.fn(),
  updateComponentProductMetafields: jest.fn(),
}));

jest.mock("../../../app/services/widget-installation/widget-theme-template.server", () => ({
  ensureProductBundleTemplate: jest.fn(),
}));

import { calculateBundlePrice } from "../../../app/services/bundles/pricing-calculation.server";
import { updateBundleProductMetafields } from "../../../app/services/bundles/metafield-sync.server";
import { ensureProductBundleTemplate } from "../../../app/services/widget-installation/widget-theme-template.server";
import { handleSyncProduct } from "../../../app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/handlers/handlers.server";

const getDb = () => require("../../../app/db.server").default;
const mockCalculateBundlePrice = calculateBundlePrice as jest.MockedFunction<typeof calculateBundlePrice>;
const mockUpdateBundleProductMetafields = updateBundleProductMetafields as jest.MockedFunction<typeof updateBundleProductMetafields>;
const mockEnsureProductBundleTemplate = ensureProductBundleTemplate as jest.MockedFunction<typeof ensureProductBundleTemplate>;

const mockAdmin = { graphql: jest.fn() } as any;
const mockSession = {
  shop: "test-shop.myshopify.com",
  accessToken: "test-token",
  id: "session-id",
  state: "test-state",
  isOnline: false,
  scope: "",
} as any;

const bundleId = "bundle-full-500";

describe("handleSyncProduct", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockEnsureProductBundleTemplate.mockResolvedValue({
      success: true,
      templateCreated: false,
      templateAlreadyExists: true,
    });
  });

  it("syncs redirect metadata for existing full-page bundle products even when pricing is missing", async () => {
    (getDb().bundle.findUnique as jest.Mock).mockResolvedValue({
      id: bundleId,
      shopId: "test-shop.myshopify.com",
      name: "Full 500",
      description: "Old description",
      status: "active",
      bundleType: "full_page",
      templateName: null,
      shopifyProductId: "gid://shopify/Product/1",
      shopifyPageHandle: "full-500",
      steps: [
        {
          id: "step-1",
          name: "Step 1",
          position: 1,
          minQuantity: 1,
          maxQuantity: 1,
          enabled: true,
          products: [{ id: "gid://shopify/Product/123", title: "Product 123" }],
          collections: [],
        },
      ],
      pricing: null,
    });

    mockAdmin.graphql
      .mockResolvedValueOnce(
        createMockGraphQLResponse({
          product: {
            id: "gid://shopify/Product/1",
            title: "Full 500",
            description: "Updated description",
            status: "ACTIVE",
            handle: "bundle-full-500",
            updatedAt: "2026-03-29T12:00:00.000Z",
          },
        }),
      )
      .mockResolvedValueOnce(
        createMockGraphQLResponse({
          productUpdate: {
            product: {
              id: "gid://shopify/Product/1",
              status: "ACTIVE",
              templateSuffix: "product-page-bundle",
            },
            userErrors: [],
          },
        }),
      );

    const response = await handleSyncProduct(mockAdmin, mockSession, bundleId, new FormData());
    const body: any = await response.json();

    expect(body.success).toBe(true);
    expect(mockEnsureProductBundleTemplate).toHaveBeenCalled();
    expect(getDb().bundle.update).toHaveBeenCalledWith({
      where: { id: bundleId },
      data: { description: "Updated description" },
    });
    expect(mockAdmin.graphql.mock.calls[1][1].variables).toEqual({
      id: "gid://shopify/Product/1",
      templateSuffix: "product-page-bundle",
    });
    expect(mockUpdateBundleProductMetafields).toHaveBeenCalledWith(
      mockAdmin,
      "gid://shopify/Product/1",
      expect.objectContaining({
        shopifyPageHandle: "full-500",
        pricing: null,
        description: "Updated description",
      }),
    );
  });

  it("applies the redirect template and metafield payload when creating a new full-page bundle product", async () => {
    (getDb().bundle.findUnique as jest.Mock).mockResolvedValue({
      id: bundleId,
      shopId: "test-shop.myshopify.com",
      name: "Full 500",
      description: "Bundle description",
      status: "active",
      bundleType: "full_page",
      templateName: null,
      shopifyProductId: null,
      shopifyPageHandle: "full-500",
      steps: [
        {
          id: "step-1",
          name: "Step 1",
          position: 1,
          minQuantity: 1,
          maxQuantity: 1,
          enabled: true,
          products: [{ id: "gid://shopify/Product/123", title: "Product 123" }],
          collections: [],
        },
      ],
      pricing: null,
    });

    mockCalculateBundlePrice.mockResolvedValue("0.00" as any);
    mockAdmin.graphql
      .mockResolvedValueOnce(
        createMockGraphQLResponse({
          productCreate: {
            product: {
              id: "gid://shopify/Product/2",
              title: "Full 500",
              handle: "bundle-full-500",
              status: "ACTIVE",
            },
            userErrors: [],
          },
        }),
      )
      .mockResolvedValueOnce(
        createMockGraphQLResponse({
          productUpdate: {
            product: {
              id: "gid://shopify/Product/2",
              status: "ACTIVE",
              templateSuffix: "product-page-bundle",
            },
            userErrors: [],
          },
        }),
      );

    const response = await handleSyncProduct(mockAdmin, mockSession, bundleId, new FormData());
    const body: any = await response.json();

    expect(body.success).toBe(true);
    expect(mockCalculateBundlePrice).toHaveBeenCalled();
    expect(mockEnsureProductBundleTemplate).toHaveBeenCalled();
    expect(getDb().bundle.update).toHaveBeenCalledWith({
      where: { id: bundleId },
      data: { shopifyProductId: "gid://shopify/Product/2" },
    });
    expect(mockAdmin.graphql.mock.calls[1][1].variables).toEqual({
      id: "gid://shopify/Product/2",
      templateSuffix: "product-page-bundle",
    });
    expect(mockUpdateBundleProductMetafields).toHaveBeenCalledWith(
      mockAdmin,
      "gid://shopify/Product/2",
      expect.objectContaining({
        shopifyProductId: "gid://shopify/Product/2",
        shopifyPageHandle: "full-500",
        pricing: null,
      }),
    );
  });
});
