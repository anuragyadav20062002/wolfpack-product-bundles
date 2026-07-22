import {
  getActiveConfigureSectionLabel,
  getMobileSetupChevronIcon,
  selectConfigureSection,
} from "../../../app/routes/app/_shared/bundle-configure/CommonConfigureSidebar";

const bundleSetupItems = [
  { id: "step_setup", label: "Step setup" },
  { id: "discount_pricing", label: "Discount & pricing" },
  { id: "bundle_visibility", label: "Bundle visibility" },
];

describe("Admin mobile configure navigation", () => {
  it("uses a down chevron when collapsed and an up chevron when expanded", () => {
    expect(getMobileSetupChevronIcon(false)).toBe("chevron-down");
    expect(getMobileSetupChevronIcon(true)).toBe("chevron-up");
  });

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

  it("preserves the selection callback and closes the mobile disclosure", () => {
    const handleSectionChange = jest.fn();
    const closeMobileNavigation = jest.fn();

    selectConfigureSection({
      sectionId: "bundle_visibility",
      closeAfterSelection: true,
      handleSectionChange,
      closeMobileNavigation,
    });

    expect(handleSectionChange).toHaveBeenCalledWith("bundle_visibility");
    expect(closeMobileNavigation).toHaveBeenCalledTimes(1);
  });

  it("does not close the desktop navigation after selection", () => {
    const handleSectionChange = jest.fn();
    const closeMobileNavigation = jest.fn();

    selectConfigureSection({
      sectionId: "discount_pricing",
      closeAfterSelection: false,
      handleSectionChange,
      closeMobileNavigation,
    });

    expect(handleSectionChange).toHaveBeenCalledWith("discount_pricing");
    expect(closeMobileNavigation).not.toHaveBeenCalled();
  });
});
