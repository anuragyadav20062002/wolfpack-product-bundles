// eslint-disable-next-line @typescript-eslint/no-require-imports
const { fullPageSelectionNavigationMethods } =
  require('../../../app/assets/widgets/full-page/methods/selection-navigation-methods.js');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { fullPageValidationAddonsMethods } =
  require('../../../app/assets/widgets/full-page/methods/validation-addons-methods.js');

describe("storefront Product Slots bundle setting", () => {
  it("detects Product Slots only when the FPB bundle setting is enabled", () => {
    expect(fullPageSelectionNavigationMethods._shouldRenderProductSlots.call({
      selectedBundle: { productSlotsEnabled: true },
    })).toBe(true);

    expect(fullPageSelectionNavigationMethods._shouldRenderProductSlots.call({
      selectedBundle: { productSlotsEnabled: false },
    })).toBe(false);

    expect(fullPageSelectionNavigationMethods._shouldRenderProductSlots.call({
      selectedBundle: {},
    })).toBe(false);
  });

  it("switches summary empty-state mode from skeletons to slots", () => {
    expect(fullPageValidationAddonsMethods.getSummarySidebarEmptyStateMode.call({
      _shouldRenderProductSlots: () => true,
    })).toBe("slots");

    expect(fullPageValidationAddonsMethods.getSummarySidebarEmptyStateMode.call({
      _shouldRenderProductSlots: () => false,
    })).toBe("skeletons");
  });
});
