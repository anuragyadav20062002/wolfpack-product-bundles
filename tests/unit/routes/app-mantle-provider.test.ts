import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

jest.mock("@remix-run/react", () => ({
  Outlet: () => React.createElement("main", null, "outlet"),
  useLoaderData: jest.fn(),
  useRouteError: () => null,
  isRouteErrorResponse: jest.fn(),
}));

jest.mock("@shopify/shopify-app-remix/server", () => ({
  boundary: {
    error: jest.fn(),
    headers: jest.fn(),
  },
}));

jest.mock("@shopify/shopify-app-remix/react", () => ({
  AppProvider: ({ children }: { children: React.ReactNode }) => React.createElement("section", { "data-shopify-app-provider": "true" }, children),
}));

jest.mock("@heymantle/react", () => ({
  MantleProvider: ({ appId, customerApiToken, apiUrl, children }: {
    appId: string;
    customerApiToken: string;
    apiUrl?: string;
    children: React.ReactNode;
  }) => React.createElement("section", {
    "data-mantle-provider": "true",
    "data-app-id": appId,
    "data-customer-api-token": customerApiToken,
    "data-api-url": apiUrl,
  }, children),
}));

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

jest.mock("../../../app/services/mantle.server", () => ({
  buildMantleProviderConfig: jest.fn(),
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

jest.mock("react-i18next", () => ({
  I18nextProvider: ({ children }: { children: React.ReactNode }) => React.createElement(React.Fragment, null, children),
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock("../../../app/i18n/config", () => ({
  changeAdminI18nLanguage: jest.fn(),
  i18n: {
    language: "en",
    changeLanguage: jest.fn(),
  },
  loadAdminLocaleResources: jest.fn(),
}));

jest.mock("../../../app/components/ErrorPage", () => ({
  ErrorPage: () => null,
}));

jest.mock("@shopify/polaris/build/esm/styles.css?url", () => "polaris.css", {
  virtual: true,
});

const { useLoaderData } = require("@remix-run/react");
const { authenticate } = require("../../../app/shopify.server");
const { buildMantleProviderConfig } = require("../../../app/services/mantle.server");
const { loadShopAdminLocale } = require("../../../app/services/admin-locale.server");
const { getPolarisLocale } = require("../../../app/i18n/polaris-locales.server");
const { loaderCache } = require("../../../app/lib/loader-cache.server");
const { ensureShopHasExpiringOfflineSession } = require("../../../app/services/offline-token.server");

describe("app Mantle provider", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    loaderCache.reset();
  });

  it("passes the Mantle API key to the server identify flow", async () => {
    const previousEnv = {
      MANTLE_APP_ID: process.env.MANTLE_APP_ID,
      MANTLE_API_KEY: process.env.MANTLE_API_KEY,
      MANTLE_API_URL: process.env.MANTLE_API_URL,
      SHOPIFY_API_KEY: process.env.SHOPIFY_API_KEY,
    };
    process.env.MANTLE_APP_ID = "mantle-app-id";
    process.env.MANTLE_API_KEY = "mantle-api-key";
    process.env.MANTLE_API_URL = "https://mantle.example.test/v1";
    process.env.SHOPIFY_API_KEY = "shopify-client-id";

    const admin = { graphql: jest.fn() };
    authenticate.admin.mockResolvedValue({
      admin,
      session: {
        shop: "test-shop.myshopify.com",
        accessToken: "shopify-access-token",
      },
    });
    ensureShopHasExpiringOfflineSession.mockResolvedValue(undefined);
    loadShopAdminLocale.mockResolvedValue("en");
    getPolarisLocale.mockReturnValue({});
    buildMantleProviderConfig.mockResolvedValue(null);

    try {
      const { loader } = await import("../../../app/routes/app/app");
      await loader({
        request: new Request("https://admin.shopify.com/store/test/apps/wpb/app"),
        context: {},
        params: {},
      });

      expect(buildMantleProviderConfig).toHaveBeenCalledWith({
        appId: "mantle-app-id",
        apiKey: "mantle-api-key",
        apiUrl: "https://mantle.example.test/v1",
        shopDomain: "test-shop.myshopify.com",
        accessToken: "shopify-access-token",
        admin,
      });
    } finally {
      for (const [key, value] of Object.entries(previousEnv)) {
        if (value === undefined) {
          delete process.env[key];
        } else {
          process.env[key] = value;
        }
      }
    }
  });

  it("wraps the Admin app tree with MantleProvider when loader data includes Mantle config", async () => {
    useLoaderData.mockReturnValue({
      apiKey: "shopify-api-key",
      locale: "en",
      polarisTranslations: {},
      shop: "test-shop.myshopify.com",
      mantleProvider: {
        appId: "mantle-app-id",
        customerApiToken: "customer-token",
        apiUrl: "https://mantle.example.test/v1",
      },
    });
    const { default: App } = await import("../../../app/routes/app/app");

    expect(renderToStaticMarkup(React.createElement(App))).toContain('data-mantle-provider="true"');
    expect(renderToStaticMarkup(React.createElement(App))).toContain('data-app-id="mantle-app-id"');
    expect(renderToStaticMarkup(React.createElement(App))).toContain('data-customer-api-token="customer-token"');
    expect(renderToStaticMarkup(React.createElement(App))).toContain('data-api-url="https://mantle.example.test/v1"');
    expect(renderToStaticMarkup(React.createElement(App))).toContain("<main>outlet</main>");
  });

  it("renders the Admin app tree without MantleProvider when Mantle config is unavailable", async () => {
    useLoaderData.mockReturnValue({
      apiKey: "shopify-api-key",
      locale: "en",
      polarisTranslations: {},
      shop: "test-shop.myshopify.com",
      mantleProvider: null,
    });
    const { default: App } = await import("../../../app/routes/app/app");

    expect(renderToStaticMarkup(React.createElement(App))).not.toContain('data-mantle-provider="true"');
    expect(renderToStaticMarkup(React.createElement(App))).toContain("<main>outlet</main>");
  });
});
