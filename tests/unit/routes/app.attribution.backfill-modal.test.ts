import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

jest.mock("@remix-run/react", () => ({
  Await: ({ children }: { children: (value: unknown) => React.ReactNode }) =>
    React.createElement(React.Fragment, null, children({ active: true })),
  useFetcher: jest.fn(),
  useLoaderData: jest.fn(),
  useNavigate: jest.fn(() => jest.fn()),
}));

jest.mock("@shopify/app-bridge-react", () => ({
  useAppBridge: jest.fn(),
}));

jest.mock("../../../app/components/analytics", () => ({
  BundlePerformanceMatrix: () => null,
  FunnelHero: () => null,
  LiveActivityFeed: () => null,
  TopCampaigns: () => null,
}));

jest.mock("../../../app/components/analytics/lazy", () => ({
  LazyEngagementPulse: () => null,
  LazyRevenueAttribution: () => null,
}));

describe("BackfillWindowModal", () => {
  it("explains the selected-window reconciliation before submission", async () => {
    const { BackfillWindowModal } = await import(
      "../../../app/routes/app/app.attribution/AttributionDashboard"
    );

    const view = renderToStaticMarkup(
      React.createElement(BackfillWindowModal, {
        days: 7,
        isSubmitting: false,
        onConfirm: jest.fn(),
      }),
    );

    expect(view).toContain("Backfill analytics window");
    expect(view).toContain("Last 7 days");
    expect(view).toContain("queries Shopify orders");
    expect(view).toContain("Existing attribution records are skipped");
    expect(view).toContain("Backfill selected window");
    expect(view).toContain("Close");
  });

  it("shows an explicit custom date range", async () => {
    const { BackfillWindowModal } = await import(
      "../../../app/routes/app/app.attribution/AttributionDashboard"
    );

    const view = renderToStaticMarkup(
      React.createElement(BackfillWindowModal, {
        days: 30,
        from: "2026-07-01",
        to: "2026-07-15",
        isSubmitting: true,
        onConfirm: jest.fn(),
      }),
    );

    expect(view).toContain("Jul 1 – Jul 15, 2026");
    expect(view).toContain('loading="true"');
    expect(view).toContain('disabled="true"');
  });
});
