import { resolveFpbTemplateSelection } from "../../../app/lib/fpb-template-selection";

describe("resolveFpbTemplateSelection", () => {
  it("defaults full-page bundles without saved template fields to Standard", () => {
    expect(resolveFpbTemplateSelection({
      bundleType: "full_page",
      bundleDesignTemplate: null,
      bundleDesignPresetId: null,
    })).toEqual({
      bundleDesignTemplate: "FBP_SIDE_FOOTER",
      bundleDesignPresetId: "STANDARD",
    });
  });

  it("treats blank full-page template fields as missing", () => {
    expect(resolveFpbTemplateSelection({
      bundleType: "full_page",
      bundleDesignTemplate: "",
      bundleDesignPresetId: " ",
    })).toEqual({
      bundleDesignTemplate: "FBP_SIDE_FOOTER",
      bundleDesignPresetId: "STANDARD",
    });
  });

  it("preserves saved full-page template selections", () => {
    expect(resolveFpbTemplateSelection({
      bundleType: "full_page",
      bundleDesignTemplate: "FBP_SIDE_FOOTER",
      bundleDesignPresetId: "CLASSIC",
    })).toEqual({
      bundleDesignTemplate: "FBP_SIDE_FOOTER",
      bundleDesignPresetId: "CLASSIC",
    });
  });

  it("does not apply full-page defaults to product-page bundles", () => {
    expect(resolveFpbTemplateSelection({
      bundleType: "product_page",
      bundleDesignTemplate: null,
      bundleDesignPresetId: null,
    })).toEqual({
      bundleDesignTemplate: null,
      bundleDesignPresetId: null,
    });
  });
});
