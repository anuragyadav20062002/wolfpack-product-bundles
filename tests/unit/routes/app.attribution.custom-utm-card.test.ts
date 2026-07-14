import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

let mockFetcherState = "idle";

jest.mock("@remix-run/react", () => ({
  Await: ({ children }: { children: (value: unknown) => React.ReactNode }) =>
    React.createElement(React.Fragment, null, children({ active: true })),
  useFetcher: jest.fn(() => ({
    data: undefined,
    state: mockFetcherState,
    Form: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) =>
      React.createElement("form", props, children),
  })),
  useLoaderData: jest.fn(),
  useNavigate: jest.fn(() => jest.fn()),
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

describe("CustomUtmTrackingCard", () => {
  beforeEach(() => {
    mockFetcherState = "idle";
  });

  it("renders a Learn More modal with merchant setup guidance", async () => {
    const { CustomUtmTrackingCard } = await import(
      "../../../app/routes/app/app.attribution/AttributionDashboard"
    );

    const view = renderToStaticMarkup(
      React.createElement(CustomUtmTrackingCard, {
        customUtmParameters: ["utm_influencer", "partner_id"],
      }),
    );

    expect(view).toContain("Learn More");
    expect(view).toContain("How custom attributes work");
    expect(view).toContain("Add parameter names one per line or separated by commas");
    expect(view).toContain("utm_influencer, partner_id");
    expect(view).toContain("Wolfpack saves up to 10 valid names");
    expect(view).toContain("Do not track shopper identifiers");
    expect(view).toContain("new visits after you save");
    expect(view).toContain("Save custom attributes");
  });

  it("renders saved custom attributes as removable chips", async () => {
    const { CustomUtmTrackingCard } = await import(
      "../../../app/routes/app/app.attribution/AttributionDashboard"
    );

    const view = renderToStaticMarkup(
      React.createElement(CustomUtmTrackingCard, {
        customUtmParameters: ["utm_influencer", "partner_id"],
      }),
    );

    expect(view).toContain("Currently tracking");
    expect(view).toContain("utm_influencer");
    expect(view).toContain("partner_id");
    expect(view).toContain('aria-label="Remove utm_influencer"');
    expect(view).toContain('aria-label="Remove partner_id"');
  });

  it("keeps the save button label stable and shows an inline spinner while saving", async () => {
    mockFetcherState = "submitting";
    const { CustomUtmTrackingCard } = await import(
      "../../../app/routes/app/app.attribution/AttributionDashboard"
    );

    const view = renderToStaticMarkup(
      React.createElement(CustomUtmTrackingCard, {
        customUtmParameters: ["utm_influencer"],
      }),
    );

    expect(view).toContain("Save custom attributes");
    expect(view).toContain("<s-spinner");
    expect(view).not.toContain("Updating tracking");
    expect(view).not.toContain('<s-button variant="primary" disabled');
  });

  it("removes a saved custom attribute from the submitted parameter list", async () => {
    const { removeCustomUtmParameter } = await import(
      "../../../app/routes/app/app.attribution/AttributionDashboard"
    );

    expect(
      removeCustomUtmParameter(["utm_influencer", "partner_id", "creator"], "partner_id"),
    ).toEqual(["utm_influencer", "creator"]);
  });
});
