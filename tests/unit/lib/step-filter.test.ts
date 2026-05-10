/**
 * Unit Tests: filterProductsByCollectionIds
 *
 * Tests the pure helper that filters a step's product list down to
 * products belonging to a given collection (identified by product IDs
 * pre-fetched from the Storefront API and stored in stepCollectionProductIds).
 */

import { filterProductsByCollectionIds } from "../../../app/lib/step-filter";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

interface TestProduct {
  id: string;
  parentProductId?: string;
  title: string;
}

const PRODUCTS: TestProduct[] = [
  { id: "1", title: "Shirt" },
  { id: "2", title: "Pants" },
  { id: "3", title: "Hat", parentProductId: "300" },
];

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("filterProductsByCollectionIds", () => {
  it("returns all products when collectionProductIds is null (All tab active)", () => {
    const result = filterProductsByCollectionIds(PRODUCTS, null);
    expect(result).toHaveLength(3);
    expect(result).toEqual(PRODUCTS);
  });

  it("returns all products when collectionProductIds is empty array", () => {
    const result = filterProductsByCollectionIds(PRODUCTS, []);
    expect(result).toHaveLength(3);
    expect(result).toEqual(PRODUCTS);
  });

  it("filters to matching products by id", () => {
    // Product 3 has parentProductId "300", so it won't match collection ID "1" or "2"
    const result = filterProductsByCollectionIds(PRODUCTS, ["1", "2"]);
    expect(result).toHaveLength(2);
    expect(result.map(p => p.id)).toEqual(expect.arrayContaining(["1", "2"]));
    expect(result.map(p => p.id)).not.toContain("3");
  });

  it("matches by parentProductId when present (display-variants-as-individual mode)", () => {
    // Product with parentProductId "300" should match against collection ID "300"
    const result = filterProductsByCollectionIds(PRODUCTS, ["300"]);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("3");
  });

  it("handles GID-format collection product IDs by extracting numeric ID", () => {
    // stepCollectionProductIds may contain raw numeric strings or GID strings
    const result = filterProductsByCollectionIds(PRODUCTS, [
      "gid://shopify/Product/1",
      "gid://shopify/Product/2",
    ]);
    expect(result).toHaveLength(2);
    expect(result.map(p => p.id)).toEqual(expect.arrayContaining(["1", "2"]));
  });

  it("returns empty array when no products match", () => {
    const result = filterProductsByCollectionIds(PRODUCTS, ["999", "888"]);
    expect(result).toHaveLength(0);
  });

  it("does not modify the original products array", () => {
    const original = [...PRODUCTS];
    filterProductsByCollectionIds(PRODUCTS, ["1"]);
    expect(PRODUCTS).toEqual(original);
  });
});

// ---------------------------------------------------------------------------
// validateStepFilters — validates the admin-configured filter shape
// ---------------------------------------------------------------------------

import { validateStepFilters } from "../../../app/lib/step-filter";

describe("validateStepFilters", () => {
  it("returns null for null input", () => {
    expect(validateStepFilters(null)).toBeNull();
  });

  it("returns null for undefined input", () => {
    expect(validateStepFilters(undefined)).toBeNull();
  });

  it("returns null for non-array input", () => {
    expect(validateStepFilters({ label: "x", collectionHandle: "y" })).toBeNull();
  });

  it("returns null for empty array", () => {
    expect(validateStepFilters([])).toBeNull();
  });

  it("returns valid filters array", () => {
    const input = [
      { label: "Shirts", collectionHandle: "mens-shirts" },
      { label: "Pants", collectionHandle: "mens-pants" },
    ];
    expect(validateStepFilters(input)).toEqual(input);
  });

  it("strips entries with empty label", () => {
    const input = [
      { label: "", collectionHandle: "mens-shirts" },
      { label: "Pants", collectionHandle: "mens-pants" },
    ];
    const result = validateStepFilters(input);
    expect(result).toHaveLength(1);
    expect(result![0].label).toBe("Pants");
  });

  it("strips entries with empty collectionHandle", () => {
    const input = [
      { label: "Shirts", collectionHandle: "" },
      { label: "Pants", collectionHandle: "mens-pants" },
    ];
    const result = validateStepFilters(input);
    expect(result).toHaveLength(1);
  });

  it("strips non-object entries", () => {
    const input = [null, "bad", { label: "OK", collectionHandle: "handle" }];
    const result = validateStepFilters(input);
    expect(result).toHaveLength(1);
  });

  it("returns null if all entries are stripped", () => {
    const input = [{ label: "", collectionHandle: "" }];
    expect(validateStepFilters(input)).toBeNull();
  });
});
