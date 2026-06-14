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
  },
}));

const mockRequireAdminSession = requireAdminSession as jest.MockedFunction<
  typeof requireAdminSession
>;
const mockGetPixelStatus = getPixelStatus as jest.MockedFunction<typeof getPixelStatus>;
const getDb = () => require("../../../app/db.server").default;

describe("app.attribution loader — campaign aggregation", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockRequireAdminSession.mockResolvedValue({
      session: { shop: "test.myshopify.com" },
    } as any);

    mockGetPixelStatus.mockResolvedValue({ active: true } as any);

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

    const payload = (await response.json()) as any;

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
});

