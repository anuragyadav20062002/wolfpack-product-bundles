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
  i18n: {
    language: "en",
    changeLanguage: jest.fn(),
  },
}));

jest.mock("../../../app/components/ErrorPage", () => ({
  ErrorPage: () => null,
}));

jest.mock("@shopify/polaris/build/esm/styles.css?url", () => "polaris.css", {
  virtual: true,
});

const { useLoaderData } = require("@remix-run/react");

describe("app Mantle provider", () => {
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
