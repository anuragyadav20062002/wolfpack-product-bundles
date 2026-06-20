import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

jest.mock("@remix-run/react", () => ({
  Links: () => null,
  Meta: () => null,
  Outlet: () => null,
  Scripts: () => null,
  ScrollRestoration: () => null,
  useLoaderData: () => ({ apiKey: "test_api_key" }),
  useRouteError: () => null,
  useRouteLoaderData: () => ({ apiKey: "test_api_key" }),
}));

jest.mock("../../../app/components/CrispChat", () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock("../../../app/components/ErrorPage", () => ({
  ErrorPage: () => null,
}));

jest.mock("../../../app/db.server", () => ({
  __esModule: true,
  default: {},
}));

jest.mock("../../../app/lib/loader-cache.server", () => ({
  loaderCache: {
    getOrSet: jest.fn(),
  },
}));

jest.mock("../../../app/lib/server-timing.server", () => ({
  ServerTiming: jest.fn(),
}));

jest.mock("../../../app/lib/auth-guards.server", () => ({
  requireAdminSession: jest.fn(),
}));

jest.mock("../../../app/lib/logger", () => ({
  AppLogger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
  },
}));

jest.mock("../../../app/services/billing.server", () => ({
  BillingService: {},
}));

jest.mock("../../../app/services/theme/app-embed-check.server", () => ({
  checkAppEmbedEnabled: jest.fn(),
}));

jest.mock("../../../app/components/ProxyHealthBanner", () => ({
  ProxyHealthBanner: () => null,
}));

jest.mock("../../../app/components/skeletons/DashboardBannerSkeleton", () => ({
  DashboardBannerSkeleton: () => null,
}));

jest.mock("../../../app/hooks/useDashboardState", () => ({
  useDashboardState: jest.fn(),
}));

jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock("../../../app/i18n/config", () => ({
  normalizeAdminLocale: (locale: string | null | undefined) => locale ?? "en",
}));

jest.mock("@shopify/app-bridge-react", () => ({
  useAppBridge: () => ({}),
}));

jest.mock("../../../app/services/admin-locale.server", () => ({
  saveShopAdminLocale: jest.fn(),
}));

jest.mock("../../../app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/handlers/handlers.server", () => ({
  handleCreatePreviewPage: jest.fn(),
}));

jest.mock("../../../app/routes/app/app.dashboard/handlers", () => ({
  handleCloneBundle: jest.fn(),
  handleDeleteBundle: jest.fn(),
}));

jest.mock("../../../app/routes/app/app.dashboard/dashboard.module.css", () => ({}), {
  virtual: true,
});

describe("admin root link warnings", () => {
  it("does not render the font stylesheet onLoad handler as a string listener", async () => {
    const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
    const { default: App } = await import("../../../app/root");

    expect(renderToStaticMarkup(React.createElement(App))).not.toContain("onLoad=\"this.media='all'\"");
    expect(renderToStaticMarkup(React.createElement(App))).not.toContain("onload=\"this.media='all'\"");
    expect(consoleError).not.toHaveBeenCalledWith(
      expect.stringContaining("Expected `%s` listener to be a function"),
      expect.anything(),
      expect.anything(),
      expect.anything(),
      expect.anything(),
    );
    consoleError.mockRestore();
  });

  it("preloads first-viewport dashboard images with React-safe responsive image attributes", async () => {
    const { headers, links } = await import("../../../app/routes/app/app.dashboard/route");
    const preloads = links();
    const responseHeaders = headers({} as any) as Record<string, string>;

    expect(preloads).toEqual(expect.arrayContaining([
      expect.objectContaining({
        rel: "preload",
        as: "image",
        href: "/Parth.avif",
        imageSrcSet: "/Parth.avif 120w",
        imageSizes: "120px",
        fetchpriority: "high",
      }),
      expect.objectContaining({
        rel: "preload",
        as: "image",
        href: "/appEmbed.avif",
        imageSrcSet: "/appEmbed.avif 420w",
        imageSizes: "420px",
        fetchpriority: "high",
      }),
    ]));
    expect(preloads[0]).toMatchObject({
      rel: "preload",
      as: "image",
      href: "/Parth.avif",
      imageSrcSet: "/Parth.avif 120w",
      imageSizes: "120px",
      fetchpriority: "high",
    });
    for (const preload of preloads) {
      expect(preload).not.toHaveProperty("fetchPriority");
      expect(preload).not.toHaveProperty("imagesrcset");
      expect(preload).not.toHaveProperty("imagesizes");
    }
    expect(responseHeaders.Link).toContain("</appEmbed.avif>; rel=preload; as=image");
    expect(responseHeaders.Link).toContain("</Parth.avif>; rel=preload; as=image");
    expect(responseHeaders.Link).toContain("fetchpriority=high");
  });

  it("renders OptimisedImage fetch priority without the React DOM prop warning", async () => {
    const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
    const { OptimisedImage } = await import("../../../app/components/OptimisedImage");

    expect(
      renderToStaticMarkup(
        React.createElement(OptimisedImage, {
          src: "/Parth.jpg",
          alt: "Parth",
          width: 120,
          height: 120,
          loading: "eager",
          fetchPriority: "high",
        }),
      ),
    ).toContain('fetchpriority="high"');
    expect(
      renderToStaticMarkup(
        React.createElement(OptimisedImage, {
          src: "/Parth.jpg",
          alt: "Parth",
          width: 120,
          height: 120,
          loading: "eager",
          fetchPriority: "high",
        }),
      ),
    ).not.toContain("fetchPriority");
    expect(consoleError).not.toHaveBeenCalledWith(
      expect.stringContaining("React does not recognize the `%s` prop on a DOM element"),
      "fetchPriority",
      "fetchpriority",
      expect.anything(),
    );
    consoleError.mockRestore();
  });
});
