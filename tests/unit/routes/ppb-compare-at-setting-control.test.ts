import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { PpbCompareAtPriceSettings } from "../../../app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/PpbBundleSettingsControls.compareAt";

const mockUsePpbConfigureContext = jest.fn();

jest.mock(
  "../../../app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/PpbConfigureContext",
  () => ({
    usePpbConfigureContext: () => mockUsePpbConfigureContext(),
  }),
);

describe("PPB compare-at price setting control", () => {
  it.each([
    [true, true],
    [false, false],
  ])("renders the persisted %s state", (showCompareAtPrices, expectedChecked) => {
    mockUsePpbConfigureContext.mockReturnValue({
      markAsDirty: jest.fn(),
      setShowCompareAtPrices: jest.fn(),
      showCompareAtPrices,
    });

    const markup = renderToStaticMarkup(createElement(PpbCompareAtPriceSettings));

    expect(markup).toContain("Show Compare At Price");
    expect(markup.includes('checked="true"')).toBe(expectedChecked);
  });
});
