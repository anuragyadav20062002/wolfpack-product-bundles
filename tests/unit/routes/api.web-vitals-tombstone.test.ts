import { AppLogger } from "../../../app/lib/logger";

jest.mock("../../../app/lib/logger", () => ({
  AppLogger: {
    warn: jest.fn(),
  },
}));

describe("api.web-vitals tombstone", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("silently discards stale unauthenticated Web Vitals reports", async () => {
    let routeModule: { action?: (args: any) => Promise<Response> } | null = null;
    try {
      routeModule = await import("../../../app/routes/api/api.web-vitals");
    } catch {
      routeModule = null;
    }

    expect(routeModule?.action).toEqual(expect.any(Function));

    const response = await routeModule!.action!({
      request: new Request("https://example.com/api/web-vitals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "LCP", value: 1234 }),
      }),
      params: {},
      context: {},
    });

    expect(response.status).toBe(204);
    expect(AppLogger.warn).not.toHaveBeenCalled();
  });
});
