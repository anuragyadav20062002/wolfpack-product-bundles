import { shouldRenderDashboardActionMenu } from "../../../app/routes/app/app.dashboard/dashboard-action-menu-state";

describe("dashboard action menu state", () => {
  it("does not render a row action menu before it is opened", () => {
    expect(shouldRenderDashboardActionMenu({ activeMenuBundleId: null, bundleId: "bundle-1" })).toBe(false);
  });

  it("renders only the opened row action menu", () => {
    expect(shouldRenderDashboardActionMenu({ activeMenuBundleId: "bundle-1", bundleId: "bundle-1" })).toBe(true);
    expect(shouldRenderDashboardActionMenu({ activeMenuBundleId: "bundle-1", bundleId: "bundle-2" })).toBe(false);
  });
});
