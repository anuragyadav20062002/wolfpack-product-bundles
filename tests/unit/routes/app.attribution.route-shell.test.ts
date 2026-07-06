import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

jest.mock("@remix-run/react", () => ({
  useLoaderData: jest.fn(() => ({
    analytics: new Promise(() => {}),
    pixelStatus: new Promise(() => {}),
  })),
  useNavigate: jest.fn(() => jest.fn()),
  Await: ({ children }: { children: (value: unknown) => React.ReactNode }) =>
    React.createElement(React.Fragment, null, children({ active: false })),
}));

jest.mock("../../../app/lib/auth-guards.server", () => ({
  requireAdminSession: jest.fn(),
}));

jest.mock("../../../app/services/pixel-activation.server", () => ({
  getPixelStatus: jest.fn(),
  activateUtmPixel: jest.fn(),
  deactivateUtmPixel: jest.fn(),
}));

jest.mock("../../../app/services/analytics/order-backfill.server", () => ({
  backfillOrderAttribution: jest.fn(),
}));

jest.mock("../../../app/db.server", () => ({
  __esModule: true,
  default: {
    orderAttribution: { findMany: jest.fn() },
    bundle: { findMany: jest.fn() },
    bundleAnalytics: { findMany: jest.fn() },
    bundleEngagement: { findMany: jest.fn() },
  },
}));

describe("app.attribution route shell", () => {
  it("renders the Admin title bar before attribution dashboard content loads", async () => {
    const { default: AttributionRoute } = await import("../../../app/routes/app/app.attribution");

    const view = renderToStaticMarkup(React.createElement(AttributionRoute));

    expect(view).toContain("<ui-title-bar");
    expect(view).toContain("Analytics");
    expect(view).not.toContain("Loading funnel summary");
    expect(view).not.toContain("Loading tracking status");
  });
});
