import { matchLineItemsToBundles, normalizeToOrderGid, orderIdMatchForms, type LineItemInput } from "../../../../app/lib/analytics/bundle-matcher.server";

const mockBundleFindMany = jest.fn();
const mockBundleStepFindMany = jest.fn();

jest.mock("../../../../app/db.server", () => ({
  __esModule: true,
  default: {
    bundle: {
      findMany: (...args: unknown[]) => mockBundleFindMany(...args),
    },
    bundleStep: {
      findMany: (...args: unknown[]) => mockBundleStepFindMany(...args),
    },
  },
}));

const SHOP = "test-bundle-store123.myshopify.com";

describe("matchLineItemsToBundles", () => {
  beforeEach(() => {
    mockBundleFindMany.mockReset();
    mockBundleStepFindMany.mockReset();
  });

  it("Case 1: direct match on bundle container (GID input)", async () => {
    mockBundleFindMany.mockResolvedValue([{ id: "bundle-1" }]);
    const lineItems: LineItemInput[] = [{ productId: "gid://shopify/Product/100" }];

    const result = await matchLineItemsToBundles(SHOP, lineItems);

    expect(result).toEqual(["bundle-1"]);
    expect(mockBundleFindMany).toHaveBeenCalledWith({
      where: { shopId: SHOP, shopifyProductId: { in: ["gid://shopify/Product/100"] } },
      select: { id: true },
    });
    expect(mockBundleStepFindMany).not.toHaveBeenCalled();
  });

  it("Case 2: direct match on bundle container (numeric input is normalized to GID)", async () => {
    mockBundleFindMany.mockResolvedValue([{ id: "bundle-1" }]);
    const lineItems: LineItemInput[] = [{ productId: "100" }];

    const result = await matchLineItemsToBundles(SHOP, lineItems);

    expect(result).toEqual(["bundle-1"]);
    expect(mockBundleFindMany).toHaveBeenCalledWith({
      where: { shopId: SHOP, shopifyProductId: { in: ["gid://shopify/Product/100"] } },
      select: { id: true },
    });
  });

  it("Case 3: component-product fallback (Pass 2) when Pass 1 has no match", async () => {
    mockBundleFindMany.mockResolvedValue([]);
    mockBundleStepFindMany.mockResolvedValue([{ bundleId: "bundle-2" }]);
    const lineItems: LineItemInput[] = [{ productId: "gid://shopify/Product/500" }];

    const result = await matchLineItemsToBundles(SHOP, lineItems);

    expect(result).toEqual(["bundle-2"]);
    expect(mockBundleStepFindMany).toHaveBeenCalledWith({
      where: {
        StepProduct: { some: { productId: { in: ["gid://shopify/Product/500"] } } },
        bundle: { shopId: SHOP },
      },
      select: { bundleId: true },
      distinct: ["bundleId"],
    });
  });

  it("Case 4: empty line items returns empty array without hitting DB", async () => {
    const result = await matchLineItemsToBundles(SHOP, []);

    expect(result).toEqual([]);
    expect(mockBundleFindMany).not.toHaveBeenCalled();
    expect(mockBundleStepFindMany).not.toHaveBeenCalled();
  });

  it("Case 5: line items with null/undefined productId are filtered out", async () => {
    const lineItems: LineItemInput[] = [
      { productId: null },
      { productId: undefined },
    ];

    const result = await matchLineItemsToBundles(SHOP, lineItems);

    expect(result).toEqual([]);
    expect(mockBundleFindMany).not.toHaveBeenCalled();
    expect(mockBundleStepFindMany).not.toHaveBeenCalled();
  });

  it("Case 6: Pass 2 does not run when Pass 1 finds any match", async () => {
    mockBundleFindMany.mockResolvedValue([{ id: "bundle-A" }]);
    const lineItems: LineItemInput[] = [
      { productId: "gid://shopify/Product/100" },
      { productId: "gid://shopify/Product/500" },
    ];

    const result = await matchLineItemsToBundles(SHOP, lineItems);

    expect(result).toEqual(["bundle-A"]);
    expect(mockBundleStepFindMany).not.toHaveBeenCalled();
  });

  it("Case 7: wrong shop returns no matches (shop scoping)", async () => {
    mockBundleFindMany.mockResolvedValue([]);
    mockBundleStepFindMany.mockResolvedValue([]);
    const lineItems: LineItemInput[] = [{ productId: "100" }];

    const result = await matchLineItemsToBundles("wrong-shop.myshopify.com", lineItems);

    expect(result).toEqual([]);
    expect(mockBundleFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ shopId: "wrong-shop.myshopify.com" }) })
    );
  });

  it("Case 8: multiple bundles matched in Pass 1 returns all deduped", async () => {
    mockBundleFindMany.mockResolvedValue([{ id: "bundle-A" }, { id: "bundle-B" }]);
    const lineItems: LineItemInput[] = [
      { productId: "gid://shopify/Product/100" },
      { productId: "gid://shopify/Product/200" },
    ];

    const result = await matchLineItemsToBundles(SHOP, lineItems);

    expect(result.sort()).toEqual(["bundle-A", "bundle-B"]);
  });

  it("Case 9: two component products matching the same bundle are deduped by Pass 2 distinct", async () => {
    mockBundleFindMany.mockResolvedValue([]);
    mockBundleStepFindMany.mockResolvedValue([{ bundleId: "bundle-2" }]);
    const lineItems: LineItemInput[] = [
      { productId: "gid://shopify/Product/500" },
      { productId: "gid://shopify/Product/501" },
    ];

    const result = await matchLineItemsToBundles(SHOP, lineItems);

    expect(result).toEqual(["bundle-2"]);
  });
});

describe("normalizeToOrderGid", () => {
  it("passes through GID unchanged", () => {
    expect(normalizeToOrderGid("gid://shopify/Order/1001")).toBe("gid://shopify/Order/1001");
  });

  it("wraps numeric id in GID prefix", () => {
    expect(normalizeToOrderGid("1001")).toBe("gid://shopify/Order/1001");
  });
});

describe("orderIdMatchForms", () => {
  it("returns both GID and numeric form given a GID input", () => {
    expect(orderIdMatchForms("gid://shopify/Order/1001")).toEqual([
      "gid://shopify/Order/1001",
      "1001",
    ]);
  });

  it("returns both numeric and GID form given a numeric input", () => {
    expect(orderIdMatchForms("1001")).toEqual([
      "1001",
      "gid://shopify/Order/1001",
    ]);
  });
});
