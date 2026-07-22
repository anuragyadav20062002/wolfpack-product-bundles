import {
  getActiveConfigureSectionLabel,
} from "../../../app/routes/app/_shared/bundle-configure/CommonConfigureSidebar";

const bundleSetupItems = [
  { id: "step_setup", label: "Step setup" },
  { id: "discount_pricing", label: "Discount & pricing" },
  { id: "bundle_visibility", label: "Bundle visibility" },
];

describe("Admin mobile configure navigation", () => {
  it("uses the active parent section label", () => {
    expect(getActiveConfigureSectionLabel({
      activeSection: "discount_pricing",
      bundleSetupItems,
      stepSetupChildItems: [],
      bundleVisibilityChildItems: [],
    })).toBe("Discount & pricing");
  });

  it("uses the active nested section label", () => {
    expect(getActiveConfigureSectionLabel({
      activeSection: "widget_placement",
      bundleSetupItems,
      stepSetupChildItems: [{ id: "step_products", label: "Products" }],
      bundleVisibilityChildItems: [{ id: "widget_placement", label: "Widget placement" }],
    })).toBe("Widget placement");
  });

  it("falls back to the first navigable section", () => {
    expect(getActiveConfigureSectionLabel({
      activeSection: "missing",
      bundleSetupItems,
      stepSetupChildItems: [],
      bundleVisibilityChildItems: [],
    })).toBe("Step setup");
  });
});
