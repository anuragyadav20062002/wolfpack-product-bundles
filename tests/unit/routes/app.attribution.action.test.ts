/**
 * Unit Tests: app.attribution action handler
 *
 * Tests enable/disable intents, error paths, and missing-env fallback.
 * Mocks Shopify auth + pixel service functions.
 */

import { action } from "../../../app/routes/app/app.attribution";

import { requireAdminSession } from "../../../app/lib/auth-guards.server";
import {
  activateUtmPixel,
  deactivateUtmPixel,
} from "../../../app/services/pixel-activation.server";
import { backfillOrderAttribution } from "../../../app/services/analytics/order-backfill.server";

jest.mock("../../../app/lib/auth-guards.server", () => ({
  requireAdminSession: jest.fn(),
}));

jest.mock("../../../app/services/pixel-activation.server", () => ({
  activateUtmPixel: jest.fn(),
  deactivateUtmPixel: jest.fn(),
  getPixelStatus: jest.fn(),
}));

jest.mock("../../../app/services/analytics/order-backfill.server", () => ({
  backfillOrderAttribution: jest.fn(),
}));

jest.mock("../../../app/db.server", () => ({
  __esModule: true,
  default: {
    bundle: {
      findMany: jest.fn(),
    },
    bundleAnalytics: {
      findMany: jest.fn(),
    },
    orderAttribution: {
      findMany: jest.fn(),
    },
    shop: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
  },
}));

const mockRequireAdminSession = requireAdminSession as jest.MockedFunction<typeof requireAdminSession>;
const mockActivate = activateUtmPixel as jest.MockedFunction<typeof activateUtmPixel>;
const mockDeactivate = deactivateUtmPixel as jest.MockedFunction<typeof deactivateUtmPixel>;
const mockBackfill = backfillOrderAttribution as jest.MockedFunction<typeof backfillOrderAttribution>;
const getDb = () => require("../../../app/db.server").default;

function makeRequest(intent: string, fields: Record<string, string> = {}): Request {
  const body = new URLSearchParams({ intent, ...fields });
  return new Request("https://app.example.com/attribution", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
}

beforeEach(() => {
  jest.resetAllMocks();
  mockRequireAdminSession.mockResolvedValue({
    admin: {},
    session: { shop: "test.myshopify.com" },
  } as any);
  getDb().shop.findUnique.mockResolvedValue({
    customUtmParameters: [],
  });
  getDb().orderAttribution.findMany.mockResolvedValue([]);
  getDb().bundleAnalytics.findMany.mockResolvedValue([]);
  getDb().bundle.findMany.mockResolvedValue([]);
  process.env.SHOPIFY_APP_URL = "https://app.example.com";
});

// ── enable intent ─────────────────────────────────────────────

describe("action — enable intent", () => {
  it("returns success:true with pixelActive:true on activation success", async () => {
    mockActivate.mockResolvedValue({ success: true, pixelId: "gid://shopify/WebPixel/1" });

    const response = await action({ request: makeRequest("enable"), params: {}, context: {} });
    const data: any = await response.json();

    expect(data.success).toBe(true);
    expect(data.pixelActive).toBe(true);
    expect(data.message).toBeDefined();
  });

  it("returns success:false with pixelActive:false when activation fails", async () => {
    mockActivate.mockResolvedValue({ success: false, error: '[{"code":"INVALID"}]' });

    const response = await action({ request: makeRequest("enable"), params: {}, context: {} });
    const data: any = await response.json();

    expect(data.success).toBe(false);
    expect(data.pixelActive).toBe(false);
    expect(data.error).toBeDefined();
  });

  it("returns success:false when SHOPIFY_APP_URL env var is missing", async () => {
    delete (process.env as Record<string, string | undefined>).SHOPIFY_APP_URL;

    const response = await action({ request: makeRequest("enable"), params: {}, context: {} });
    const data: any = await response.json();

    expect(data.success).toBe(false);
    expect(data.pixelActive).toBe(false);
  });
});

// ── export intent ─────────────────────────────────────────────

describe("action — export intent", () => {
  it("returns named CSV data for the selected window", async () => {
    const response = await action({
      request: makeRequest("export", {
        from: "2026-07-01",
        to: "2026-07-20",
      }),
      params: {},
      context: {},
    });
    const data: any = await response.json();

    expect(data).toEqual({
      success: true,
      filename: "wolfpack-analytics-2026-07-01-to-2026-07-20.csv",
      csv: "Date,Type,Bundle ID,Bundle Name,UTM Source,UTM Medium,UTM Campaign,Custom UTM Attributes,Revenue (USD),Order ID,Landing Page",
    });
  });
});

// ── disable intent ────────────────────────────────────────────

describe("action — disable intent", () => {
  it("returns success:true with pixelActive:false on deactivation success", async () => {
    mockDeactivate.mockResolvedValue({ success: true });

    const response = await action({ request: makeRequest("disable"), params: {}, context: {} });
    const data: any = await response.json();

    expect(data.success).toBe(true);
    expect(data.pixelActive).toBe(false);
    expect(data.message).toBeDefined();
  });

  it("returns success:false with pixelActive:true when deactivation fails", async () => {
    mockDeactivate.mockResolvedValue({ success: false, error: "Delete failed" });

    const response = await action({ request: makeRequest("disable"), params: {}, context: {} });
    const data: any = await response.json();

    expect(data.success).toBe(false);
    expect(data.pixelActive).toBe(true);
    expect(data.error).toBeDefined();
  });
});

// ── backfill intent ───────────────────────────────────────────

describe("action — backfill intent", () => {
  it("respects the selected days window", async () => {
    jest.useFakeTimers().setSystemTime(new Date("2026-07-11T12:00:00.000Z"));
    mockBackfill.mockResolvedValue({ created: 2, skipped: 1 } as any);

    const response = await action({
      request: makeRequest("backfill", { days: "7" }),
      params: {},
      context: {},
    });
    const data: any = await response.json();

    expect(data.success).toBe(true);
    expect(mockBackfill).toHaveBeenCalledWith(
      {},
      "test.myshopify.com",
      "2026-07-05T00:00:00.000Z",
      "2026-07-11T23:59:59.999Z",
    );

    jest.useRealTimers();
  });
});

// ── custom UTM settings ───────────────────────────────────────

describe("action — saveCustomUtms intent", () => {
  it("saves sanitized custom UTM names and reactivates the pixel with them", async () => {
    mockActivate.mockResolvedValue({ success: true, pixelId: "gid://shopify/WebPixel/1" });

    const response = await action({
      request: makeRequest("saveCustomUtms", {
        customUtmParameters: "utm_influencer, Partner-ID, utm_influencer",
      }),
      params: {},
      context: {},
    });
    const data: any = await response.json();

    expect(data).toMatchObject({
      success: true,
      customUtmParameters: ["utm_influencer", "partner-id"],
    });
    expect(getDb().shop.upsert).toHaveBeenCalledWith(expect.objectContaining({
      where: { shopDomain: "test.myshopify.com" },
      update: { customUtmParameters: ["utm_influencer", "partner-id"] },
    }));
    expect(mockActivate).toHaveBeenCalledWith(
      {},
      "https://app.example.com",
      "test.myshopify.com",
      ["utm_influencer", "partner-id"],
    );
  });
});

// ── bad intent ────────────────────────────────────────────────

describe("action — unknown intent", () => {
  it("returns 400 for an unrecognised intent", async () => {
    const response = await action({ request: makeRequest("nuke"), params: {}, context: {} });
    expect(response.status).toBe(400);
  });
});
