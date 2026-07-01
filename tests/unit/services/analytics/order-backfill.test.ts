import { backfillOrderAttribution } from "../../../../app/services/analytics/order-backfill.server";

const mockOrderAttributionFindMany = jest.fn();
const mockOrderAttributionCreateMany = jest.fn();
const mockMatchLineItemsToBundles = jest.fn();
const mockAdminGraphql = jest.fn();

jest.mock("../../../../app/db.server", () => ({
  __esModule: true,
  default: {
    orderAttribution: {
      findMany: (...args: unknown[]) => mockOrderAttributionFindMany(...args),
      createMany: (...args: unknown[]) => mockOrderAttributionCreateMany(...args),
    },
  },
}));

jest.mock("../../../../app/lib/analytics/bundle-matcher.server", () => ({
  matchLineItemsToBundles: (...args: unknown[]) => mockMatchLineItemsToBundles(...args),
  orderIdMatchForms: (id: string) =>
    id.includes("/")
      ? [id, id.split("/").pop() ?? id]
      : [id, `gid://shopify/Order/${id}`],
}));

jest.mock("../../../../app/lib/logger", () => ({
  AppLogger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

const SHOP = "test-bundle-store123.myshopify.com";
const SINCE = "2026-06-01T00:00:00.000Z";
const UNTIL = "2026-07-01T00:00:00.000Z";

function makeOrderNode(overrides: Partial<any> = {}) {
  return {
    id: "gid://shopify/Order/1001",
    name: "#1001",
    createdAt: "2026-06-15T10:00:00Z",
    totalPriceSet: { shopMoney: { amount: "195.29", currencyCode: "INR" } },
    customerJourneySummary: {
      lastVisit: {
        landingPage: "https://shop.example/pages/564-2?utm_source=facebook",
        utmParameters: {
          source: "facebook",
          medium: "cpc",
          campaign: "bundles",
          content: null,
          term: null,
        },
      },
    },
    lineItems: {
      nodes: [{ product: { id: "gid://shopify/Product/100" }, quantity: 1 }],
    },
    ...overrides,
  };
}

function makeGraphqlResponse(nodes: any[], hasNextPage = false, endCursor: string | null = null) {
  return {
    json: async () => ({
      data: {
        orders: {
          pageInfo: { hasNextPage, endCursor },
          nodes,
        },
      },
    }),
  };
}

const admin = { graphql: (...args: unknown[]) => mockAdminGraphql(...args) } as any;

describe("backfillOrderAttribution", () => {
  beforeEach(() => {
    mockOrderAttributionFindMany.mockReset();
    mockOrderAttributionCreateMany.mockReset();
    mockMatchLineItemsToBundles.mockReset();
    mockAdminGraphql.mockReset();
  });

  it("Case 1: creates rows for new orders", async () => {
    mockAdminGraphql.mockResolvedValue(makeGraphqlResponse([makeOrderNode()]));
    mockOrderAttributionFindMany.mockResolvedValue([]);
    mockMatchLineItemsToBundles.mockResolvedValue(["bundle-1"]);
    mockOrderAttributionCreateMany.mockResolvedValue({ count: 1 });

    const result = await backfillOrderAttribution(admin, SHOP, SINCE, UNTIL);

    expect(result.created).toBe(1);
    expect(result.skipped).toBe(0);
    expect(mockOrderAttributionCreateMany).toHaveBeenCalledWith({
      data: [
        expect.objectContaining({
          shopId: SHOP,
          bundleId: "bundle-1",
          orderId: "gid://shopify/Order/1001",
          orderNumber: "1001",
          utmSource: "facebook",
          utmMedium: "cpc",
          utmCampaign: "bundles",
          revenue: 19529,
          currency: "INR",
        }),
      ],
    });
  });

  it("Case 2: idempotent second run - skips orders already in DB", async () => {
    mockAdminGraphql.mockResolvedValue(makeGraphqlResponse([makeOrderNode()]));
    mockOrderAttributionFindMany.mockResolvedValue([
      { orderId: "gid://shopify/Order/1001" },
    ]);

    const result = await backfillOrderAttribution(admin, SHOP, SINCE, UNTIL);

    expect(result.created).toBe(0);
    expect(result.skipped).toBe(1);
    expect(mockOrderAttributionCreateMany).not.toHaveBeenCalled();
  });

  it("Case 2b: skips orders written by pixel under legacy numeric orderId format", async () => {
    // Backfill always uses GID (gid://shopify/Order/1001), but historical pixel
    // rows may hold the raw sandbox id ("1001"). Dedup must catch both.
    mockAdminGraphql.mockResolvedValue(makeGraphqlResponse([makeOrderNode()]));
    mockOrderAttributionFindMany.mockResolvedValue([
      { orderId: "1001" }, // legacy pixel row
    ]);

    const result = await backfillOrderAttribution(admin, SHOP, SINCE, UNTIL);

    expect(result.created).toBe(0);
    expect(result.skipped).toBe(1);
    expect(mockOrderAttributionCreateMany).not.toHaveBeenCalled();
    // Dedup query includes both forms
    expect(mockOrderAttributionFindMany).toHaveBeenCalledWith({
      where: { shopId: SHOP, orderId: { in: ["gid://shopify/Order/1001", "1001"] } },
      select: { orderId: true },
    });
  });

  it("Case 3: paginates through multiple pages", async () => {
    mockAdminGraphql
      .mockResolvedValueOnce(makeGraphqlResponse([makeOrderNode({ id: "gid://shopify/Order/1001" })], true, "cursor-1"))
      .mockResolvedValueOnce(makeGraphqlResponse([makeOrderNode({ id: "gid://shopify/Order/1002" })], false, null));
    mockOrderAttributionFindMany.mockResolvedValue([]);
    mockMatchLineItemsToBundles.mockResolvedValue([]);
    mockOrderAttributionCreateMany.mockResolvedValue({ count: 1 });

    const result = await backfillOrderAttribution(admin, SHOP, SINCE, UNTIL);

    expect(mockAdminGraphql).toHaveBeenCalledTimes(2);
    expect(result.created).toBe(2);
  });

  it("Case 4: order without customerJourneySummary still gets a row with null UTMs", async () => {
    mockAdminGraphql.mockResolvedValue(
      makeGraphqlResponse([makeOrderNode({ customerJourneySummary: null })])
    );
    mockOrderAttributionFindMany.mockResolvedValue([]);
    mockMatchLineItemsToBundles.mockResolvedValue(["bundle-1"]);
    mockOrderAttributionCreateMany.mockResolvedValue({ count: 1 });

    const result = await backfillOrderAttribution(admin, SHOP, SINCE, UNTIL);

    expect(result.created).toBe(1);
    expect(mockOrderAttributionCreateMany).toHaveBeenCalledWith({
      data: [
        expect.objectContaining({
          utmSource: null,
          utmMedium: null,
          utmCampaign: null,
          utmContent: null,
          utmTerm: null,
          landingPage: null,
          bundleId: "bundle-1",
        }),
      ],
    });
  });

  it("Case 5: order with no bundle match writes a single row with null bundleId", async () => {
    mockAdminGraphql.mockResolvedValue(makeGraphqlResponse([makeOrderNode()]));
    mockOrderAttributionFindMany.mockResolvedValue([]);
    mockMatchLineItemsToBundles.mockResolvedValue([]);
    mockOrderAttributionCreateMany.mockResolvedValue({ count: 1 });

    const result = await backfillOrderAttribution(admin, SHOP, SINCE, UNTIL);

    expect(result.created).toBe(1);
    expect(mockOrderAttributionCreateMany).toHaveBeenCalledWith({
      data: [expect.objectContaining({ bundleId: null })],
    });
  });

  it("Case 6: empty page - no errors, zero created", async () => {
    mockAdminGraphql.mockResolvedValue(makeGraphqlResponse([]));

    const result = await backfillOrderAttribution(admin, SHOP, SINCE, UNTIL);

    expect(result.created).toBe(0);
    expect(result.skipped).toBe(0);
    expect(mockOrderAttributionCreateMany).not.toHaveBeenCalled();
  });

  it("Case 7: bundle matched via component product - matcher returns bundleId", async () => {
    mockAdminGraphql.mockResolvedValue(makeGraphqlResponse([makeOrderNode()]));
    mockOrderAttributionFindMany.mockResolvedValue([]);
    mockMatchLineItemsToBundles.mockResolvedValue(["bundle-X"]);
    mockOrderAttributionCreateMany.mockResolvedValue({ count: 1 });

    const result = await backfillOrderAttribution(admin, SHOP, SINCE, UNTIL);

    expect(result.created).toBe(1);
    expect(mockMatchLineItemsToBundles).toHaveBeenCalledWith(
      SHOP,
      [{ productId: "gid://shopify/Product/100" }]
    );
    expect(mockOrderAttributionCreateMany).toHaveBeenCalledWith({
      data: [expect.objectContaining({ bundleId: "bundle-X" })],
    });
  });

  it("Case 8: revenue converted to cents (rounded)", async () => {
    mockAdminGraphql.mockResolvedValue(
      makeGraphqlResponse([
        makeOrderNode({
          totalPriceSet: { shopMoney: { amount: "195.29", currencyCode: "INR" } },
        }),
      ])
    );
    mockOrderAttributionFindMany.mockResolvedValue([]);
    mockMatchLineItemsToBundles.mockResolvedValue([]);
    mockOrderAttributionCreateMany.mockResolvedValue({ count: 1 });

    await backfillOrderAttribution(admin, SHOP, SINCE, UNTIL);

    expect(mockOrderAttributionCreateMany).toHaveBeenCalledWith({
      data: [expect.objectContaining({ revenue: 19529 })],
    });
  });
});
