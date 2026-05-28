/**
 * Unit tests — normaliseShopifyProductId, safeJsonParse
 *
 * Spec: test-spec/edit-bundle-flow.spec.md § Suite 1–2
 * Issue: [edit-bundle-flow-tests-1]
 */

import {
  BundleStatus,
  handleUpdateBundleStatus,
  handleUpdateBundleProduct,
  normaliseShopifyProductId,
  safeJsonParse,
  getShopifyStatusFromBundleStatus,
} from "../../../app/services/bundles/bundle-configure-handlers.server";

// Mock all module-level deps so the file loads cleanly without a real DB.
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

jest.mock("../../../app/services/theme-template.server", () => ({
  ThemeTemplateService: { ensureTemplates: jest.fn() },
}));

const CTX = { title: "Test Product", stepName: "Step 1" };

describe("normaliseShopifyProductId", () => {
  it("passes through a valid GID unchanged", () => {
    expect(normaliseShopifyProductId("gid://shopify/Product/123456", CTX)).toBe(
      "gid://shopify/Product/123456"
    );
  });

  it("converts a bare numeric ID to a GID", () => {
    expect(normaliseShopifyProductId("789012", CTX)).toBe(
      "gid://shopify/Product/789012"
    );
  });

  it("throws for a UUID (corrupted browser state)", () => {
    expect(() =>
      normaliseShopifyProductId("550e8400-e29b-41d4-a716-446655440000", CTX)
    ).toThrow("corrupted browser state");
  });

  it("throws for a GID with a non-numeric suffix", () => {
    expect(() =>
      normaliseShopifyProductId("gid://shopify/Product/abc", CTX)
    ).toThrow("must be numeric");
  });

  it("throws for an empty string", () => {
    expect(() =>
      normaliseShopifyProductId("", CTX)
    ).toThrow("non-empty string");
  });

  it("throws for null cast as string", () => {
    expect(() =>
      normaliseShopifyProductId(null as unknown as string, CTX)
    ).toThrow("non-empty string");
  });

  it("throws for an unrecognised format", () => {
    expect(() =>
      normaliseShopifyProductId("not-a-product", CTX)
    ).toThrow("Expected Shopify GID");
  });
});

describe("safeJsonParse", () => {
  it("parses a valid JSON string", () => {
    expect(safeJsonParse('[{"id":1}]', [])).toEqual([{ id: 1 }]);
  });

  it("returns an already-parsed object as-is", () => {
    const obj = { key: "val" };
    expect(safeJsonParse(obj, null)).toBe(obj);
  });

  it("returns the default value when input is null", () => {
    expect(safeJsonParse(null, [])).toEqual([]);
  });

  it("returns the default value for malformed JSON without throwing", () => {
    expect(safeJsonParse("{bad json", [])).toEqual([]);
  });

  it("respects a custom default value", () => {
    expect(safeJsonParse(null, {})).toEqual({});
  });

  it("returns the default for undefined input", () => {
    expect(safeJsonParse(undefined, "default")).toBe("default");
  });
});

describe("handleUpdateBundleProduct", () => {
  it("updates title and optional media with the current productUpdate mutation", async () => {
    const admin = {
      graphql: jest.fn().mockResolvedValue({
        json: async () => ({
          data: {
            productUpdate: {
              product: { id: "gid://shopify/Product/1", title: "Product Page Fixture" },
              userErrors: [],
            },
          },
        }),
      }),
    } as any;
    const formData = new FormData();
    formData.set("productId", "gid://shopify/Product/1");
    formData.set("productTitle", "Product Page Fixture");
    formData.set("productImageUrl", "https://app.example.test/bundle-product-placeholder.png");

    const response = await handleUpdateBundleProduct(
      admin,
      { shop: "test-shop.myshopify.com" } as any,
      "bundle-1",
      formData,
    );
    const body = await response.json();

    expect(body.success).toBe(true);
    expect(admin.graphql).toHaveBeenCalledTimes(1);
    expect(admin.graphql).toHaveBeenCalledWith(
      expect.stringContaining("ProductUpdateInput"),
      expect.objectContaining({
        variables: {
          product: {
            id: "gid://shopify/Product/1",
            title: "Product Page Fixture",
          },
          media: [
            {
              originalSource: "https://app.example.test/bundle-product-placeholder.png",
              alt: "Product Page Fixture - Bundle",
              mediaContentType: "IMAGE",
            },
          ],
        },
      }),
    );
  });
});

describe("handleUpdateBundleStatus", () => {
  const PRODUCT_ID = "gid://shopify/Product/987";
  const SESSION = { shop: "test-shop.myshopify.com" } as any;

  const makeBundle = (status: BundleStatus) => ({
    id: "bundle-1",
    name: "Bundle Status",
    description: "Status managed by WPB",
    shopifyProductId: PRODUCT_ID,
    status,
    steps: [],
    pricing: null,
  });

  const makeStatusFormData = (status: string) => {
    const fd = new FormData();
    fd.set("status", status);
    return fd;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    const { getDb } = require("../../../app/db.server");
    getDb().bundle.update.mockResolvedValue(makeBundle("active"));
  });

  it("rejects invalid bundle status values before touching Shopify", async () => {
    const admin = {
      graphql: jest.fn(),
    } as any;

    const res = await handleUpdateBundleStatus(
      admin,
      SESSION,
      "bundle-1",
      makeStatusFormData("nonsense"),
    );
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error).toMatch(/invalid bundle status/i);
    expect(admin.graphql).not.toHaveBeenCalled();
  });

  it("syncs archived status via direct Shopify ARCHIVED status and description text", async () => {
    const admin = {
      graphql: jest.fn().mockResolvedValue({
        json: async () => ({
          data: {
            productUpdate: {
              product: { id: PRODUCT_ID, status: "ARCHIVED" },
              userErrors: [],
            },
          },
        }),
      }),
    } as any;

    const res = await handleUpdateBundleStatus(
      admin,
      SESSION,
      "bundle-1",
      makeStatusFormData("archived"),
    );
    const body = await res.json();

    expect(body.success).toBe(true);
    expect(admin.graphql).toHaveBeenCalledWith(
      expect.stringContaining("ProductUpdateInput"),
      expect.objectContaining({
        variables: {
          product: {
            id: PRODUCT_ID,
            status: "ARCHIVED",
            descriptionHtml: "Status managed by WPB - Bundle Product",
          },
        },
      }),
    );
  });

  it("syncs unlisted via ACTIVE then UNLISTED and keeps unlisted-facing description", async () => {
    const admin = {
      graphql: jest
        .fn()
        .mockResolvedValueOnce({
          json: async () => ({
            data: {
              productUpdate: {
                product: { id: PRODUCT_ID, status: "ACTIVE" },
                userErrors: [],
              },
            },
          }),
        })
        .mockResolvedValueOnce({
          json: async () => ({
            data: {
              productUpdate: {
                product: { id: PRODUCT_ID, status: "UNLISTED" },
                userErrors: [],
              },
            },
          }),
        }),
    } as any;

    const res = await handleUpdateBundleStatus(
      admin,
      SESSION,
      "bundle-1",
      makeStatusFormData("unlisted"),
    );
    const body = await res.json();

    expect(body.success).toBe(true);
    expect(admin.graphql).toHaveBeenCalledTimes(2);
    expect(admin.graphql).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining("ProductUpdateInput"),
      expect.objectContaining({
        variables: {
          product: expect.objectContaining({
            id: PRODUCT_ID,
            status: "ACTIVE",
            descriptionHtml: expect.stringContaining("Your Bundle is Unlisted"),
          }),
        },
      }),
    );
    expect(admin.graphql).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining("ProductUpdateInput"),
      expect.objectContaining({
        variables: {
          product: expect.objectContaining({
            id: PRODUCT_ID,
            status: "UNLISTED",
            descriptionHtml: expect.stringContaining("Your Bundle is Unlisted"),
          }),
        },
      }),
    );
  });

  it("maps bundle status constants to expected Shopify product statuses", () => {
    expect(getShopifyStatusFromBundleStatus(BundleStatus.ACTIVE)).toBe("ACTIVE");
    expect(getShopifyStatusFromBundleStatus(BundleStatus.DRAFT)).toBe("DRAFT");
    expect(getShopifyStatusFromBundleStatus(BundleStatus.ARCHIVED)).toBe("ARCHIVED");
    expect(getShopifyStatusFromBundleStatus(BundleStatus.UNLISTED)).toBe("ACTIVE");
  });
});
