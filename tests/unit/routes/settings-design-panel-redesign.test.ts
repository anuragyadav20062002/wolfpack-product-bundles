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
  setDesignPreviewMode,
  setDesignPreviewViewport,
  type DesignPreviewState,
} from "../../../app/routes/app/app.settings/DesignLivePreview";
import { buildDesignPreviewTheme } from "../../../app/routes/app/app.settings/design-preview-model";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

describe("settings Design preview state", () => {
  it("applies expert preview overrides only while expert controls are enabled", () => {
    const fieldValues = {
      "Primary Color": "#123456",
      "expert.productCard.productCardButtonColor": "#abcdef",
    };

    expect(buildDesignPreviewTheme(fieldValues, false)["--preview-product-button-bg"]).toBe("#123456");
    expect(buildDesignPreviewTheme(fieldValues, true)["--preview-product-button-bg"]).toBe("#abcdef");
  });

  it("uses Landing Page Standard desktop defaults", () => {
    expect(createDesignPreviewState()).toEqual({
      bundleType: "full_page",
      templateKey: "standard",
      viewport: "desktop",
      mode: "builder",
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
      mode: "builder",
    };

    expect(setDesignPreviewBundleType(state, "product_page")).toEqual({
      bundleType: "product_page",
      templateKey: "product-list",
      viewport: "mobile",
      mode: "builder",
    });
  });

  it("switches viewport without changing type or template", () => {
    const state: DesignPreviewState = {
      bundleType: "product_page",
      templateKey: "vertical-slots",
      viewport: "desktop",
      mode: "builder",
    };

    const unsavedFieldValues = { "Primary Color": "#123456" };
    expect(setDesignPreviewViewport(state, "mobile")).toEqual({
      bundleType: "product_page",
      templateKey: "vertical-slots",
      viewport: "mobile",
      mode: "builder",
    });
    expect(unsavedFieldValues).toEqual({ "Primary Color": "#123456" });
  });

  it("switches representative mode without changing the selected template", () => {
    const state = createDesignPreviewState("product_page");

    expect(setDesignPreviewMode(state, "validation")).toEqual({
      ...state,
      mode: "validation",
    });
  });
});

describe("DesignLivePreview", () => {
  it("renders direct desktop and mobile controls with labels, tooltips, and selected state", () => {
    const view = renderToStaticMarkup(
      React.createElement(DesignLivePreview, {
        previewTheme: {},
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
            previewTheme: { "--preview-primary": "#123456" } as unknown as React.CSSProperties,
            initialState: {
              bundleType: template.bundleType,
              templateKey: template.key,
              viewport,
              mode: "builder",
            },
          }),
        );

        expect(view).toContain(`data-template-key="${template.key}"`);
        expect(view).toContain(`data-preview-viewport="${viewport}"`);
        expect(view).toContain(
          template.family === "full-page"
            ? `data-full-page-template="${template.key}"`
            : `data-product-page-template="${template.key}"`,
        );
        expect(view).not.toContain("<iframe");
        expect(view).not.toContain("http://");
        expect(view).not.toContain("https://");
      }
    },
  );

  it.each(["loading", "validation", "upsell"] as const)(
    "renders the %s representative state without storefront interaction",
    (mode) => {
      const view = renderToStaticMarkup(
        React.createElement(DesignLivePreview, {
          previewTheme: {},
          initialState: { ...createDesignPreviewState(), mode },
        }),
      );

      expect(view).toContain(`data-preview-mode="${mode}"`);
      expect(view).toContain(`settingsDcp.preview.mode.${mode}`);
    },
  );

  it("keeps the preview usable without a fake loading status", () => {
    const view = renderToStaticMarkup(
      React.createElement(DesignLivePreview, {
        previewTheme: {},
      }),
    );

    expect(view).toContain('aria-label="Live bundle preview"');
    expect(view).not.toContain('role="status"');
    expect(view).not.toContain("settingsDcp.preview.loading");
  });
});
