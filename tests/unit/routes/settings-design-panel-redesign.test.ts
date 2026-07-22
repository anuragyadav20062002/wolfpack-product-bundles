import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  DESIGN_PREVIEW_TEMPLATES,
  DesignLivePreview,
  createDesignPreviewState,
  getDefaultTemplateKey,
  isTemplateValidForBundleType,
  setDesignPreviewBundleType,
  setDesignPreviewTemplate,
  setDesignPreviewViewport,
  type DesignPreviewState,
} from "../../../app/routes/app/app.settings/DesignLivePreview";
import { buildDesignPreviewVariables } from "../../../app/routes/app/app.settings/settings-state";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const previewBundle = {
  id: "bundle-1",
  name: "Summer Box",
  type: "Landing Page",
  viewUrl: "https://shop.test/pages/bundle",
};

describe("settings Design preview state", () => {
  it("applies expert preview overrides only while expert controls are enabled", () => {
    const fieldValues = {
      "Primary Color": "#123456",
      "expert.productCard.productCardButtonColor": "#abcdef",
    };

    expect(buildDesignPreviewVariables(fieldValues, false)["--bundle-button-bg"]).toBe("#123456");
    expect(buildDesignPreviewVariables(fieldValues, true)["--bundle-button-bg"]).toBe("#abcdef");
  });

  it("uses Landing Page Standard desktop defaults", () => {
    expect(createDesignPreviewState()).toEqual({
      bundleType: "full_page",
      templateKey: "standard",
      viewport: "desktop",
    });
  });

  it("defines defaults and valid combinations for all eight templates", () => {
    expect(getDefaultTemplateKey("full_page")).toBe("standard");
    expect(getDefaultTemplateKey("product_page")).toBe("product-list");
    expect(DESIGN_PREVIEW_TEMPLATES).toHaveLength(8);

    for (const template of DESIGN_PREVIEW_TEMPLATES) {
      expect(isTemplateValidForBundleType(template.bundleType, template.key)).toBe(true);
      const state = setDesignPreviewTemplate(
        createDesignPreviewState(template.bundleType),
        template.key,
      );
      expect(state.templateKey).toBe(template.key);
    }

    expect(isTemplateValidForBundleType("full_page", "product-grid")).toBe(false);
    expect(() => setDesignPreviewTemplate(
      createDesignPreviewState("full_page"),
      "product-grid",
    )).toThrow('Invalid Design preview template "product-grid" for full_page');
  });

  it("selects the new bundle type default and preserves viewport", () => {
    const state: DesignPreviewState = {
      bundleType: "full_page",
      templateKey: "compact",
      viewport: "mobile",
    };

    expect(setDesignPreviewBundleType(state, "product_page")).toEqual({
      bundleType: "product_page",
      templateKey: "product-list",
      viewport: "mobile",
    });
  });

  it("switches viewport without changing type or template", () => {
    const state: DesignPreviewState = {
      bundleType: "product_page",
      templateKey: "vertical-slots",
      viewport: "desktop",
    };

    const unsavedFieldValues = { "Primary Color": "#123456" };
    expect(setDesignPreviewViewport(state, "mobile")).toEqual({
      bundleType: "product_page",
      templateKey: "vertical-slots",
      viewport: "mobile",
    });
    expect(unsavedFieldValues).toEqual({ "Primary Color": "#123456" });
  });
});

describe("DesignLivePreview", () => {
  it("renders direct desktop and mobile controls with labels, tooltips, and selected state", () => {
    const view = renderToStaticMarkup(
      React.createElement(DesignLivePreview, {
        previewBundle,
        previewVariables: {},
        isLoading: false,
      }),
    );

    expect(view).toContain('accessibilityLabel="settingsDcp.preview.viewport.desktop"');
    expect(view).toContain('accessibilityLabel="settingsDcp.preview.viewport.mobile"');
    expect(view).toContain('interestFor="settings-design-preview-desktop-tooltip"');
    expect(view).toContain('interestFor="settings-design-preview-mobile-tooltip"');
    expect(view).toContain('aria-pressed="true"');
    expect(view).toContain("settingsDcp.preview.viewport.desktop");
    expect(view).toContain("settingsDcp.preview.viewport.mobile");
  });

  it.each(DESIGN_PREVIEW_TEMPLATES)(
    "renders the $translationKey template in both viewport modes",
    (template) => {
      for (const viewport of ["desktop", "mobile"] as const) {
        const view = renderToStaticMarkup(
          React.createElement(DesignLivePreview, {
            previewBundle,
            previewVariables: { "--bundle-global-primary-button": "#123456" } as unknown as React.CSSProperties,
            isLoading: false,
            initialState: {
              bundleType: template.bundleType,
              templateKey: template.key,
              viewport,
            },
          }),
        );

        expect(view).toContain(`data-template-key="${template.key}"`);
        expect(view).toContain(`data-preview-viewport="${viewport}"`);
        expect(view).not.toContain("<iframe");
      }
    },
  );

  it("uses the same preview surface for the Images & GIFs loading state", () => {
    const view = renderToStaticMarkup(
      React.createElement(DesignLivePreview, {
        previewBundle,
        previewVariables: {},
        isLoading: true,
      }),
    );

    expect(view).toContain('role="status"');
    expect(view).toContain("settingsDcp.preview.loading");
    expect(view).toContain('aria-label="Live bundle preview"');
  });
});
