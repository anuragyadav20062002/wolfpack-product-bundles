import {
  shouldRenderAnalyticsNoDataBanner,
} from "../../../app/routes/app/app.attribution/attribution-lcp-state";

describe("attribution LCP critical status state", () => {
  it("keeps analytics no-data messaging behind active tracking and analytics data", () => {
    expect(shouldRenderAnalyticsNoDataBanner({ hasNoData: true, pixelActive: true })).toBe(true);
    expect(shouldRenderAnalyticsNoDataBanner({ hasNoData: false, pixelActive: true })).toBe(false);
    expect(shouldRenderAnalyticsNoDataBanner({ hasNoData: true, pixelActive: false })).toBe(false);
  });
});
