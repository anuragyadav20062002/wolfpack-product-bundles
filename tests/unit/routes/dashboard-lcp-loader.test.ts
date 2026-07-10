import { loader } from "../../../app/routes/app/app.dashboard/route";
import { requireAdminSession } from "../../../app/lib/auth-guards.server";
import { fetchEmbedData } from "../../../app/lib/bundle-configure-loader.server";
import db from "../../../app/db.server";

jest.mock("../../../app/routes/app/app.dashboard/DashboardPage", () => ({
  DashboardPage: () => null,
}));

jest.mock("../../../app/lib/auth-guards.server", () => ({
  requireAdminSession: jest.fn(),
}));

jest.mock("../../../app/db.server", () => ({
  __esModule: true,
  default: {
    bundle: {
      findMany: jest.fn(),
      update: jest.fn(),
    },
  },
}));

jest.mock("../../../app/lib/bundle-configure-loader.server", () => ({
  fetchEmbedData: jest.fn(),
}));

jest.mock("../../../app/services/subscription-cache.server", () => ({
  getSubscriptionInfoFromCache: jest.fn().mockResolvedValue(null),
}));

jest.mock("../../../app/routes/app/app.dashboard/dashboard-background-tasks.server", () => ({
  queueDashboardBackgroundTask: jest.fn(),
}));

jest.mock("../../../app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/handlers/handlers.server", () => ({
  handleCreatePreviewPage: jest.fn(),
}));

jest.mock("../../../app/routes/app/shared/bundle-preview-action.server", () => ({
  handleRecordBundlePreview: jest.fn(),
}));

jest.mock("../../../app/services/admin-locale.server", () => ({
  saveShopAdminLocale: jest.fn(),
}));

jest.mock("../../../app/routes/app/app.dashboard/handlers", () => ({
  handleCloneBundle: jest.fn(),
  handleDeleteBundle: jest.fn(),
}));

jest.mock("../../../app/lib/logger", () => ({
  AppLogger: {
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

const mockRequireAdminSession = requireAdminSession as jest.MockedFunction<typeof requireAdminSession>;
const mockFetchEmbedData = fetchEmbedData as jest.MockedFunction<typeof fetchEmbedData>;
const mockDb = db as jest.Mocked<typeof db>;

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function getDeferredPayload(response: unknown) {
  const data = (response as { data?: unknown }).data;
  if (!data || typeof data !== "object") {
    throw new Error("Expected Remix deferred response data");
  }
  return data as Record<string, unknown>;
}

describe("app.dashboard loader LCP behavior", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.SHOPIFY_APP_URL;

    mockRequireAdminSession.mockResolvedValue({
      session: { shop: "agent-5sfidg3m.myshopify.com" },
      admin: { graphql: jest.fn() },
    } as any);

    mockDb.bundle.findMany.mockResolvedValue([
      {
        id: "bundle-1",
        name: "Starter bundle",
        status: "active",
        bundleType: "full_page",
        createdAt: new Date("2026-07-10T00:00:00.000Z"),
        shopifyProductId: null,
        shopifyProductHandle: null,
        shopifyPageHandle: "starter-bundle",
        pricing: { enabled: true },
      },
    ] as any);

    global.fetch = jest.fn().mockResolvedValue(
      new Response("", {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    ) as any;
  });

  it("does not wait for app-embed detection before returning initial dashboard data", async () => {
    const appEmbedStatus = createDeferred<{ appEmbedEnabled: boolean; themeEditorUrl: string | null }>();
    mockFetchEmbedData.mockReturnValue(appEmbedStatus.promise);

    const loaderPromise = loader({
      request: new Request("https://test-app.example.com/app/dashboard"),
      params: {},
      context: {},
    } as any);

    const result = await Promise.race([
      loaderPromise.then((response) => ({ status: "resolved", response })),
      new Promise((resolve) => setTimeout(() => resolve({ status: "blocked" }), 25)),
    ]);

    expect(result).toMatchObject({ status: "resolved" });
    const payload = getDeferredPayload((result as { response: unknown }).response);
    expect(payload.bundles).toEqual([
      expect.objectContaining({
        id: "bundle-1",
        previewHandle: "bundle-1",
      }),
    ]);
    const statusSettled = jest.fn();
    void (payload.appEmbedStatus as Promise<unknown>).then(statusSettled);
    await Promise.resolve();
    expect(statusSettled).not.toHaveBeenCalled();
    expect(mockFetchEmbedData).toHaveBeenCalledWith(
      expect.any(Object),
      "agent-5sfidg3m.myshopify.com",
      expect.any(String),
    );

    appEmbedStatus.resolve({ appEmbedEnabled: true, themeEditorUrl: "https://admin.shopify.com/theme-editor" });
    await expect(payload.appEmbedStatus).resolves.toMatchObject({ appEmbedEnabled: true });
  });
});
