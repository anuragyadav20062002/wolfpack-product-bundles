import {
  ANALYTICS_NO_DATA_BANNER_COPY,
  shouldRenderAnalyticsNoDataBanner,
} from "../../../app/routes/app/app.attribution/attribution-lcp-state";

describe("attribution LCP critical status state", () => {
  it("keeps analytics no-data messaging behind active tracking and analytics data", () => {
    expect(shouldRenderAnalyticsNoDataBanner({ hasNoData: true, pixelActive: true })).toBe(true);
    expect(shouldRenderAnalyticsNoDataBanner({ hasNoData: false, pixelActive: true })).toBe(false);
    expect(shouldRenderAnalyticsNoDataBanner({ hasNoData: true, pixelActive: false })).toBe(false);
  });

  it("keeps no-data banner copy concise so deferred messaging does not become the LCP candidate", () => {
    expect(ANALYTICS_NO_DATA_BANNER_COPY.body).toBe("No attributed orders yet.");
    expect(ANALYTICS_NO_DATA_BANNER_COPY.body).not.toContain("?utm_source=");
  });
});
