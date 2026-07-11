/**
 * Unit Tests: app.attribution loader — campaign metrics should use only bundle rows
 */

import { loader } from "../../../app/routes/app/app.attribution";
import { requireAdminSession } from "../../../app/lib/auth-guards.server";
import { getPixelStatus } from "../../../app/services/pixel-activation.server";

jest.mock("../../../app/lib/auth-guards.server", () => ({
  requireAdminSession: jest.fn(),
}));

jest.mock("../../../app/services/pixel-activation.server", () => ({
  getPixelStatus: jest.fn(),
  activateUtmPixel: jest.fn(),
  deactivateUtmPixel: jest.fn(),
}));

jest.mock("../../../app/db.server", () => ({
  __esModule: true,
  default: {
    orderAttribution: {
      findMany: jest.fn(),
    },
    bundle: {
      findMany: jest.fn(),
    },
    bundleAnalytics: {
      findMany: jest.fn(),
    },
    bundleEngagement: {
      findMany: jest.fn(),
    },
    shop: {
      findUnique: jest.fn(),
    },
  },
}));

const mockRequireAdminSession = requireAdminSession as jest.MockedFunction<
  typeof requireAdminSession
>;
const mockGetPixelStatus = getPixelStatus as jest.MockedFunction<typeof getPixelStatus>;
const getDb = () => require("../../../app/db.server").default;

function getDeferredPayload(response: unknown) {
  const data = (response as { data?: unknown }).data;
  if (!data || typeof data !== "object") {
    throw new Error("Expected Remix deferred response data");
  }
  return data as Record<string, Promise<unknown>>;
}

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

describe("app.attribution loader — campaign aggregation", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockRequireAdminSession.mockResolvedValue({
      session: { shop: "test.myshopify.com" },
    } as any);

    mockGetPixelStatus.mockResolvedValue({ active: true } as any);
    getDb().shop.findUnique.mockResolvedValue({
      customUtmParameters: [],
    });

    const currentAttributions = [
      {
        bundleId: null,
        revenue: 1200,
        createdAt: new Date("2026-06-01T00:00:00.000Z"),
        utmSource: "google",
        utmMedium: "search",
        utmCampaign: "summer-caps",
      },
      {
        bundleId: "bundle-1",
        revenue: 500,
        createdAt: new Date("2026-06-01T00:10:00.000Z"),
        utmSource: "google",
        utmMedium: "search",
        utmCampaign: "summer-caps",
      },
    ];

    getDb().orderAttribution.findMany
      .mockResolvedValueOnce(currentAttributions)
      .mockResolvedValueOnce([]);

    getDb().bundleAnalytics.findMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    getDb().bundleEngagement.findMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    getDb().bundle.findMany.mockResolvedValueOnce([
      { id: "bundle-1", name: "Summer Bundle", status: "active" },
    ]);
  });

  it("excludes attribution rows without bundleId from campaign totals", async () => {
    const response = await loader({
      request: new Request("https://test.myshopify.com/app/attribution?days=1"),
      params: {},
      context: {},
    } as any);

    const payload = (await getDeferredPayload(response).analytics) as any;

    expect(payload.summary.totalOrders).toBe(2);
    expect(payload.summary.bundleOrders).toBe(1);
    expect(payload.topCampaignsRows).toEqual([
      {
        utmCampaign: "summer-caps",
        revenueCents: 500,
        orders: 1,
      },
    ]);
    expect(payload.byCampaign).toEqual([
      {
        campaign: "summer-caps",
        source: "google",
        revenue: 500,
        orders: 1,
      },
    ]);
  });

  it("returns pixel status separately so the first status card does not wait for analytics", async () => {
    getDb().orderAttribution.findMany.mockReset();
    getDb().bundleAnalytics.findMany.mockReset();
    getDb().bundleEngagement.findMany.mockReset();
    getDb().bundle.findMany.mockReset();

    const pixelStatus = createDeferred<{ active: boolean }>();
    mockGetPixelStatus.mockReturnValueOnce(pixelStatus.promise as any);

    const currentAttributions = createDeferred<any[]>();
    getDb().orderAttribution.findMany
      .mockReturnValueOnce(currentAttributions.promise)
      .mockResolvedValueOnce([]);

    getDb().bundleAnalytics.findMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    getDb().bundleEngagement.findMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    getDb().bundle.findMany.mockResolvedValueOnce([]);

    const response = await loader({
      request: new Request("https://test.myshopify.com/app/attribution?days=1"),
      params: {},
      context: {},
    } as any);

    const payload = getDeferredPayload(response);

    expect(payload.pixelStatus).toBeDefined();
    expect(payload.analytics).toBeDefined();
    expect(getDb().orderAttribution.findMany).toHaveBeenCalledTimes(2);

    pixelStatus.resolve({ active: true });
    await expect(payload.pixelStatus).resolves.toEqual({ active: true });

    const analyticsSettled = jest.fn();
    void payload.analytics.then(analyticsSettled);
    await Promise.resolve();
    expect(analyticsSettled).not.toHaveBeenCalled();

    currentAttributions.resolve([]);
    await expect(payload.analytics).resolves.toMatchObject({
      summary: {
        totalOrders: 0,
        bundleOrders: 0,
      },
    });
  });

  it("builds funnel added-to-cart from engagement events and checked-out from bundle orders", async () => {
    getDb().orderAttribution.findMany.mockReset();
    getDb().bundleAnalytics.findMany.mockReset();
    getDb().bundleEngagement.findMany.mockReset();
    getDb().bundle.findMany.mockReset();

    getDb().orderAttribution.findMany
      .mockResolvedValueOnce([
        {
          bundleId: "bundle-1",
          revenue: 5000,
          createdAt: new Date("2026-07-10T00:10:00.000Z"),
          utmSource: "google",
          utmMedium: "search",
          utmCampaign: "summer-caps",
        },
      ])
      .mockResolvedValueOnce([]);

    getDb().bundleAnalytics.findMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    getDb().bundleEngagement.findMany
      .mockResolvedValueOnce([
        {
          bundleId: "bundle-1",
          sessionId: "session-1",
          presetId: "classic",
          eventName: "wpb:session-engaged",
          createdAt: new Date("2026-07-10T00:00:00.000Z"),
        },
        {
          bundleId: "bundle-1",
          sessionId: "session-2",
          presetId: "classic",
          eventName: "wpb:session-engaged",
          createdAt: new Date("2026-07-10T00:01:00.000Z"),
        },
        {
          bundleId: "bundle-1",
          sessionId: "session-1",
          presetId: "classic",
          eventName: "wpb:bundle-add-to-cart-success",
          createdAt: new Date("2026-07-10T00:02:00.000Z"),
        },
        {
          bundleId: "bundle-1",
          sessionId: "session-2",
          presetId: "classic",
          eventName: "wpb:bundle-add-to-cart-success",
          createdAt: new Date("2026-07-10T00:03:00.000Z"),
        },
      ])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    getDb().bundle.findMany.mockResolvedValueOnce([
      { id: "bundle-1", name: "Summer Bundle", status: "active" },
    ]);

    const response = await loader({
      request: new Request("https://test.myshopify.com/app/attribution?days=1"),
      params: {},
      context: {},
    } as any);

    const payload = (await getDeferredPayload(response).analytics) as any;

    expect(getDb().bundleEngagement.findMany).toHaveBeenNthCalledWith(1, expect.objectContaining({
      select: expect.objectContaining({ eventName: true }),
    }));
    expect(payload.funnelSnapshot).toMatchObject({
      engaged: 2,
      addedToCart: 2,
      checkedOut: 1,
      revenueCents: 5000,
    });
    expect(payload.engagementToOrderPct).toBe(50);
  });

  it("normalizes day filters before querying and returns saved custom UTM settings", async () => {
    jest.useFakeTimers().setSystemTime(new Date("2026-07-11T12:00:00.000Z"));
    getDb().orderAttribution.findMany.mockReset();
    getDb().bundleAnalytics.findMany.mockReset();
    getDb().bundleEngagement.findMany.mockReset();
    getDb().bundle.findMany.mockReset();

    getDb().shop.findUnique.mockResolvedValueOnce({
      customUtmParameters: ["utm_influencer"],
    });
    getDb().orderAttribution.findMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);
    getDb().bundleAnalytics.findMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);
    getDb().bundleEngagement.findMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);
    getDb().bundle.findMany.mockResolvedValueOnce([]);

    const response = await loader({
      request: new Request("https://test.myshopify.com/app/attribution?days=365"),
      params: {},
      context: {},
    } as any);

    const payload = (await getDeferredPayload(response).analytics) as any;

    expect(getDb().orderAttribution.findMany).toHaveBeenNthCalledWith(1, expect.objectContaining({
      where: expect.objectContaining({
        createdAt: {
          gte: new Date("2026-04-13T00:00:00.000Z"),
          lte: new Date("2026-07-11T23:59:59.999Z"),
        },
      }),
    }));
    expect(payload.days).toBe(90);
    expect(payload.timeSeries).toHaveLength(90);
    expect(payload.customUtmParameters).toEqual(["utm_influencer"]);

    jest.useRealTimers();
  });

  it("keeps custom ranges bounded to the selected end date", async () => {
    getDb().orderAttribution.findMany.mockReset();
    getDb().bundleAnalytics.findMany.mockReset();
    getDb().bundleEngagement.findMany.mockReset();
    getDb().bundle.findMany.mockReset();

    getDb().orderAttribution.findMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);
    getDb().bundleAnalytics.findMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);
    getDb().bundleEngagement.findMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);
    getDb().bundle.findMany.mockResolvedValueOnce([]);

    const response = await loader({
      request: new Request("https://test.myshopify.com/app/attribution?from=2026-06-01&to=2026-06-07"),
      params: {},
      context: {},
    } as any);

    const payload = (await getDeferredPayload(response).analytics) as any;

    expect(payload.days).toBe(7);
    expect(payload.from).toBe("2026-06-01");
    expect(payload.to).toBe("2026-06-07");
    expect(payload.timeSeries).toHaveLength(7);
    expect(payload.timeSeries[0].date).toBe("2026-06-01");
    expect(payload.timeSeries[6].date).toBe("2026-06-07");
  });
});
