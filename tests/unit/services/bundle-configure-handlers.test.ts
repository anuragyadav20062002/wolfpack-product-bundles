/**
 * Unit tests — normaliseShopifyProductId, safeJsonParse
 *
 * Spec: test-spec/edit-bundle-flow.spec.md § Suite 1–2
 * Issue: [edit-bundle-flow-tests-1]
 */

import {
  handleUpdateBundleProduct,
  normaliseShopifyProductId,
  safeJsonParse,
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
