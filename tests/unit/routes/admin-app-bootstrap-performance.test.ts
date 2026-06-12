import { mockSession } from "../../setup";

jest.mock("../../../app/shopify.server", () => ({
  authenticate: {
    admin: jest.fn(),
  },
  sessionStorage: { storeSession: jest.fn() },
}));

jest.mock("../../../app/db.server", () => ({
  __esModule: true,
  default: { session: {} },
}));

jest.mock("../../../app/services/offline-token.server", () => ({
  ensureShopHasExpiringOfflineSession: jest.fn(),
}));

jest.mock("../../../app/lib/logger", () => ({
  AppLogger: {
    error: jest.fn(),
  },
}));

jest.mock("../../../app/services/admin-locale.server", () => ({
  loadShopAdminLocale: jest.fn(),
}));

jest.mock("../../../app/i18n/polaris-locales.server", () => ({
  getPolarisLocale: jest.fn(),
}));

jest.mock("@shopify/shopify-app-remix/server", () => ({
  boundary: {
    error: jest.fn(),
    headers: jest.fn(),
  },
}));

jest.mock("@shopify/shopify-app-remix/react", () => ({
  AppProvider: ({ children }: { children: unknown }) => children,
}));

jest.mock("react-i18next", () => ({
  I18nextProvider: ({ children }: { children: unknown }) => children,
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock("../../../app/i18n/config", () => ({
  i18n: {
    language: "en",
    changeLanguage: jest.fn(),
  },
}));

jest.mock("../../../app/components/MantleTracker", () => ({
  MantleTracker: () => null,
}));

jest.mock("../../../app/components/ErrorPage", () => ({
  ErrorPage: () => null,
}));

jest.mock("@shopify/polaris/build/esm/styles.css?url", () => "polaris.css", {
  virtual: true,
});

const { authenticate } = require("../../../app/shopify.server");
const { ensureShopHasExpiringOfflineSession } = require("../../../app/services/offline-token.server");
const { loadShopAdminLocale } = require("../../../app/services/admin-locale.server");
const { getPolarisLocale } = require("../../../app/i18n/polaris-locales.server");
const { AppLogger } = require("../../../app/lib/logger");

function makeDeferred<T = unknown>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((promiseResolve, promiseReject) => {
    resolve = promiseResolve;
    reject = promiseReject;
  });

  return { promise, resolve, reject };
}

async function flushMicrotasks() {
  await Promise.resolve();
  await Promise.resolve();
}

describe("app layout loader bootstrap performance", () => {
  beforeEach(() => {
    authenticate.admin.mockResolvedValue({ session: mockSession });
    loadShopAdminLocale.mockResolvedValue("en");
    getPolarisLocale.mockReturnValue({ locale: "en" });
    ensureShopHasExpiringOfflineSession.mockReset();
    AppLogger.error.mockReset();
  });

  it("does not wait for offline-session migration before returning bootstrap data", async () => {
    const migration = makeDeferred();
    ensureShopHasExpiringOfflineSession.mockReturnValue(migration.promise);
    const { loader } = await import("../../../app/routes/app/app");

    const loaderPromise = loader({
      request: new Request("https://test-app.example.com/app/dashboard"),
      params: {},
      context: {},
    } as any);

    await expect(
      Promise.race([
        loaderPromise.then((data) => ({ status: "resolved", data })),
        new Promise((resolve) => setTimeout(() => resolve({ status: "blocked" }), 25)),
      ]),
    ).resolves.toMatchObject({
      status: "resolved",
      data: {
        apiKey: "test_api_key",
        locale: "en",
        shop: mockSession.shop,
      },
    });

    migration.resolve(null);
    await loaderPromise;
  });

  it("logs offline-session migration failures without failing the loader result", async () => {
    const migration = makeDeferred();
    ensureShopHasExpiringOfflineSession.mockReturnValue(migration.promise);
    const { loader } = await import("../../../app/routes/app/app");

    const result = await loader({
      request: new Request("https://test-app.example.com/app/dashboard"),
      params: {},
      context: {},
    } as any);

    migration.reject(new Error("migration failed"));
    await flushMicrotasks();

    expect(result).toMatchObject({
      apiKey: "test_api_key",
      locale: "en",
      shop: mockSession.shop,
    });
    expect(AppLogger.error).toHaveBeenCalledWith(
      "Failed to ensure expiring offline session during app load",
      expect.objectContaining({
        component: "app.app",
        shop: mockSession.shop,
      }),
      expect.any(Error),
    );
  });
});
