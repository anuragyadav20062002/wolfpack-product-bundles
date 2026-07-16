import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { PpbCategoryStepSettings } from "../../../app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/PpbBundleSettingsControls.categorySteps";

const mockUsePpbConfigureContext = jest.fn();

jest.mock(
  "../../../app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/PpbConfigureContext",
  () => ({
    usePpbConfigureContext: () => mockUsePpbConfigureContext(),
  }),
);

describe("PPB category step setting control", () => {
  it.each([
    [true, true],
    [false, false],
  ])(
    "renders the persisted %s state",
    (useSingleStepCategoriesAsBundleSteps, expectedChecked) => {
      mockUsePpbConfigureContext.mockReturnValue({
        markAsDirty: jest.fn(),
        setUseSingleStepCategoriesAsBundleSteps: jest.fn(),
        useSingleStepCategoriesAsBundleSteps,
      });

      const markup = renderToStaticMarkup(
        createElement(PpbCategoryStepSettings),
      );

      expect(markup).toContain("Use categories as bundle steps");
      expect(markup.includes('checked="true"')).toBe(expectedChecked);
    },
  );
});
