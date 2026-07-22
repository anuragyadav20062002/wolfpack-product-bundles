import {
  Children,
  createElement,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { FpbSummaryTextSettings } from "../../../app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/sections/BundleSettingsSummaryText";

describe("FPB compare-at price setting control", () => {
  const findCompareAtSwitch = (node: ReactNode): ReactElement | null => {
    if (!isValidElement(node)) return null;
    if (
      node.type === "s-switch" &&
      node.props.accessibilityLabel === "Show compare-at prices"
    ) {
      return node;
    }
    for (const child of Children.toArray(node.props.children)) {
      const match = findCompareAtSwitch(child);
      if (match) return match;
    }
    return null;
  };

  const createFlow = (showCompareAtPrices: boolean) => ({
    activeTabIndex: 0,
    bundle: {},
    DiscountMethod: { BUY_X_GET_Y: "BUY_X_GET_Y" },
    INDIVIDUAL_SELLING_PLAN_BLOCKED_MESSAGE: "Blocked",
    individualSellingPlanEnabled: false,
    individualSellingPlanShowFor: "ALL_PRODUCTS",
    markAsDirty: jest.fn(),
    openMultiLanguageModal: jest.fn(),
    pricingState: { discountType: "PERCENTAGE" },
    setIndividualSellingPlanEnabled: jest.fn(),
    setIndividualSellingPlanShowFor: jest.fn(),
    setShowCompareAtPrices: jest.fn(),
    setShowTextOnPlusEnabled: jest.fn(),
    setTextOverrides: jest.fn(),
    SettingsRow: ({ title, children }: any) =>
      createElement("section", null, title, children),
    setVariantSelectorEnabled: jest.fn(),
    showCompareAtPrices,
    showTextOnPlusEnabled: false,
    stepsState: { steps: [{}] },
    textOverrides: {},
    variantSelectorEnabled: true,
  });

  it.each([
    [true, true],
    [false, false],
  ])("renders the persisted %s state", (showCompareAtPrices, expectedChecked) => {
    const flow = createFlow(showCompareAtPrices) as any;

    const markup = renderToStaticMarkup(
      createElement(FpbSummaryTextSettings, { flow }),
    );
    const control = markup.match(
      /<s-switch accessibilityLabel="Show compare-at prices"[^>]*>/,
    )?.[0];

    expect(markup).toContain("Show Compare At Price");
    expect(control).toBeDefined();
    expect(control?.includes('checked="true"')).toBe(expectedChecked);
  });

  it("updates the canonical state and marks the configure flow dirty", () => {
    const flow = createFlow(true);
    const view = FpbSummaryTextSettings({ flow: flow as any });
    const control = findCompareAtSwitch(view);

    expect(control).not.toBeNull();
    control?.props.onChange({ target: { checked: false } });

    expect(flow.setShowCompareAtPrices).toHaveBeenCalledWith(false);
    expect(flow.markAsDirty).toHaveBeenCalledTimes(1);
  });
});
