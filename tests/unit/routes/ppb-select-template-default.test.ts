/**
 * Unit tests -- PPB Select Template default selection
 *
 * Spec: test-spec/ppb-select-template-default.spec.md
 */

import {
  PRODUCT_PAGE_DEFAULT_TEMPLATE_SELECTION,
  resolveProductPageTemplateSelection,
} from "../../../app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/ConfigureBundleFlow.helpers";

describe("resolveProductPageTemplateSelection", () => {
  it("defaults empty bundle template fields to Product List", () => {
    expect(resolveProductPageTemplateSelection({})).toEqual(
      PRODUCT_PAGE_DEFAULT_TEMPLATE_SELECTION,
    );
  });

  it("defaults null bundle template fields to Product List", () => {
    expect(
      resolveProductPageTemplateSelection({
        bundleDesignTemplate: null,
        bundleDesignPresetId: null,
      }),
    ).toEqual(PRODUCT_PAGE_DEFAULT_TEMPLATE_SELECTION);
  });

  it("preserves a valid saved Product Grid selection", () => {
    expect(
      resolveProductPageTemplateSelection({
        bundleDesignTemplate: "PDP_INPAGE",
        bundleDesignPresetId: "COGNIVE",
      }),
    ).toEqual({
      layoutTemplate: "PDP_INPAGE",
      presetId: "COGNIVE",
    });
  });

  it("falls back to Product List for incomplete saved selections", () => {
    expect(
      resolveProductPageTemplateSelection({
        bundleDesignTemplate: "PDP_INPAGE",
      }),
    ).toEqual(PRODUCT_PAGE_DEFAULT_TEMPLATE_SELECTION);
  });
});
