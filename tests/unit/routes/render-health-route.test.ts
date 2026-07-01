import { loader } from "../../../app/routes/root/health";
import db from "../../../app/db.server";

jest.mock("../../../app/db.server", () => ({
  __esModule: true,
  default: {
    $queryRaw: jest.fn(),
  },
}));

const mockDb = db as jest.Mocked<typeof db>;

describe("Render health route loader", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 200 with no-store caching when the database ping succeeds", async () => {
    mockDb.$queryRaw.mockResolvedValue([{ healthcheck: 1 }] as never);

    const response = await loader({
      request: new Request("https://example.com/health"),
      params: {},
      context: {},
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(body).toMatchObject({ status: "ok" });
    expect(mockDb.$queryRaw).toHaveBeenCalledTimes(1);
  });

  it("returns 503 with no-store caching when the database ping fails", async () => {
    mockDb.$queryRaw.mockRejectedValue(new Error("database unavailable") as never);

    const response = await loader({
      request: new Request("https://example.com/health"),
      params: {},
      context: {},
    });
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(body).toMatchObject({ status: "error" });
    expect(mockDb.$queryRaw).toHaveBeenCalledTimes(1);
  });
});
