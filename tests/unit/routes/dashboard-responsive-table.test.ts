import { buildDashboardTableRows } from "../../../app/routes/app/app.dashboard/dashboard-table-model";

describe("Dashboard responsive table model", () => {
  it("preserves row identity and display values for responsive table actions", () => {
    const sourceBundle = {
      id: "bundle-1",
      name: "Starter bundle",
      status: "active",
      bundleType: "full_page",
    };

    expect(buildDashboardTableRows(
      [sourceBundle],
      (status) => `status:${status}`,
      (type) => `type:${type}`,
    )).toEqual([
      {
        id: "bundle-1",
        bundle: sourceBundle,
        name: "Starter bundle",
        status: "status:active",
        type: "type:full_page",
      },
    ]);
  });

  it("returns no rows for the existing empty-state path", () => {
    expect(buildDashboardTableRows([], String, String)).toEqual([]);
  });
});
