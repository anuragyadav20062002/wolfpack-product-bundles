/**
 * Unit Tests: app.attribution action handler
 *
 * Tests enable/disable intents, error paths, and missing-env fallback.
 * Mocks Shopify auth + pixel service functions.
 */

import { action } from "../../../app/routes/app/app.attribution";

jest.mock("../../../app/shopify.server", () => ({
  authenticate: {
    admin: jest.fn(),
  },
}));

jest.mock("../../../app/services/pixel-activation.server", () => ({
  activateUtmPixel: jest.fn(),
  deactivateUtmPixel: jest.fn(),
  getPixelStatus: jest.fn(),
}));

import { authenticate } from "../../../app/shopify.server";
import {
  activateUtmPixel,
  deactivateUtmPixel,
} from "../../../app/services/pixel-activation.server";

const mockAuthenticate = authenticate as jest.Mocked<typeof authenticate>;
const mockActivate = activateUtmPixel as jest.MockedFunction<typeof activateUtmPixel>;
const mockDeactivate = deactivateUtmPixel as jest.MockedFunction<typeof deactivateUtmPixel>;

function makeRequest(intent: string): Request {
  const body = new URLSearchParams({ intent });
  return new Request("https://app.example.com/attribution", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
}

beforeEach(() => {
  jest.resetAllMocks();
  (mockAuthenticate.admin as jest.Mock).mockResolvedValue({
    admin: {},
    session: { shop: "test.myshopify.com" },
  });
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

// ── bad intent ────────────────────────────────────────────────

describe("action — unknown intent", () => {
  it("returns 400 for an unrecognised intent", async () => {
    const response = await action({ request: makeRequest("nuke"), params: {}, context: {} });
    expect(response.status).toBe(400);
  });
});
