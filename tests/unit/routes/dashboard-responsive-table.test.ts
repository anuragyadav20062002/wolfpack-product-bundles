import {
  buildDashboardTablePage,
  buildDashboardTableRows,
} from "../../../app/routes/app/app.dashboard/dashboard-table-model";

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

  it("preserves filtering before paginating responsive table records", () => {
    const bundles = [
      { id: "1", name: "Starter box", status: "active", bundleType: "full_page" },
      { id: "2", name: "Starter kit", status: "draft", bundleType: "full_page" },
      { id: "3", name: "Premium box", status: "active", bundleType: "product_page" },
    ];

    expect(buildDashboardTablePage({
      bundles,
      bundleFilter: "starter",
      typeFilter: "full_page",
      statusFilter: "active",
      currentPage: 1,
      bundlesPerPage: 10,
    })).toMatchObject({
      filteredBundles: [bundles[0]],
      pagedBundles: [bundles[0]],
      effectivePage: 1,
      totalPages: 1,
    });
  });

  it("clamps an out-of-range page after filters reduce the result count", () => {
    const bundles = [
      { id: "1", name: "Box one", status: "active", bundleType: "full_page" },
      { id: "2", name: "Box two", status: "active", bundleType: "full_page" },
      { id: "3", name: "Box three", status: "draft", bundleType: "full_page" },
    ];

    expect(buildDashboardTablePage({
      bundles,
      bundleFilter: "",
      typeFilter: "all",
      statusFilter: "active",
      currentPage: 5,
      bundlesPerPage: 1,
    })).toMatchObject({
      filteredBundles: [bundles[0], bundles[1]],
      pagedBundles: [bundles[1]],
      effectivePage: 2,
      totalPages: 2,
    });
  });
});
