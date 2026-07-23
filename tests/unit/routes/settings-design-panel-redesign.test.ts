import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  DESIGN_PREVIEW_TEMPLATES,
  DesignLivePreview,
  createDesignPreviewState,
  getDefaultTemplateKey,
  isDesignPreviewSurfaceSupported,
  isTemplateValidForBundleType,
  setDesignPreviewBundleType,
  setDesignPreviewSurface,
  setDesignPreviewTemplate,
  setDesignPreviewViewport,
  type DesignPreviewState,
} from "../../../app/routes/app/app.settings/DesignLivePreview";
import { buildDesignPreviewTheme } from "../../../app/routes/app/app.settings/design-preview-model";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

describe("Settings Design preview state", () => {
  it("applies expert preview overrides only while expert controls are enabled", () => {
    const fieldValues = {
      "Primary Color": "#123456",
      "expert.productCard.productCardButtonColor": "#abcdef",
    };

    expect(buildDesignPreviewTheme(fieldValues, false)["--preview-product-button-bg"]).toBe("#123456");
    expect(buildDesignPreviewTheme(fieldValues, true)["--preview-product-button-bg"]).toBe("#abcdef");
  });

  it("uses Landing Page Standard desktop Builder defaults", () => {
    expect(createDesignPreviewState()).toEqual({
      bundleType: "full_page",
      templateKey: "standard",
      viewport: "desktop",
      surface: "builder",
    });
  });

  it("defines canonical combinations for all eight templates", () => {
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

  it("preserves viewport and resets the surface when bundle type changes", () => {
    const state: DesignPreviewState = {
      bundleType: "product_page",
      templateKey: "horizontal-slots",
      viewport: "mobile",
      surface: "product-picker",
    };

    expect(setDesignPreviewBundleType(state, "full_page")).toEqual({
      bundleType: "full_page",
      templateKey: "standard",
      viewport: "mobile",
      surface: "builder",
    });
  });

  it("preserves a supported surface and falls back when a template does not support it", () => {
    const slotState = setDesignPreviewSurface(
      createDesignPreviewState("product_page"),
      "product-picker",
    );
    expect(slotState.surface).toBe("builder");

    const horizontalSlots = setDesignPreviewTemplate(
      createDesignPreviewState("product_page"),
      "horizontal-slots",
    );
    const pickerState = setDesignPreviewSurface(horizontalSlots, "product-picker");
    expect(pickerState.surface).toBe("product-picker");
    expect(setDesignPreviewTemplate(pickerState, "vertical-slots").surface).toBe("product-picker");
    expect(setDesignPreviewTemplate(pickerState, "product-list").surface).toBe("builder");
  });

  it("switches viewport and surface without changing the selected template", () => {
    const state = setDesignPreviewTemplate(
      createDesignPreviewState("product_page"),
      "vertical-slots",
    );
    const mobile = setDesignPreviewViewport(state, "mobile");
    const picker = setDesignPreviewSurface(mobile, "product-picker");

    expect(picker).toEqual({
      bundleType: "product_page",
      templateKey: "vertical-slots",
      viewport: "mobile",
      surface: "product-picker",
    });
    expect(isDesignPreviewSurfaceSupported("vertical-slots", "product-picker")).toBe(true);
    expect(isDesignPreviewSurfaceSupported("product-list", "product-picker")).toBe(false);
  });
});

describe("DesignLivePreview", () => {
  it("renders template-aware surface and viewport controls", () => {
    const view = renderToStaticMarkup(
      React.createElement(DesignLivePreview, { fieldValues: {}, isExpertControlsEnabled: false }),
    );
    const utils = renderToStaticMarkup(
      React.createElement(DesignLivePreview, {
        fieldValues: {},
        isExpertControlsEnabled: false,
        initialState: {
          bundleType: "product_page",
          templateKey: "horizontal-slots",
          viewport: "desktop",
          surface: "builder",
        },
      }),
    );

    expect(view).toContain('label="settingsDcp.preview.surfaceSelector.label"');
    expect(view).not.toContain('value="product-picker"');
    expect(utils).toContain('value="product-picker"');
    expect(utils).toContain("settingsDcp.preview.surfaceSelector.product-picker");
    expect(view).toContain('accessibilityLabel="settingsDcp.preview.viewport.desktop"');
    expect(view).toContain('accessibilityLabel="settingsDcp.preview.viewport.mobile"');
    expect(view).toContain('aria-pressed="true"');
  });

  it.each(DESIGN_PREVIEW_TEMPLATES)(
    "renders canonical $translationKey scenes in both viewport modes",
    (template) => {
      for (const viewport of ["desktop", "mobile"] as const) {
        const view = renderToStaticMarkup(
          React.createElement(DesignLivePreview, {
            fieldValues: { "Primary Color": "#123456" },
            isExpertControlsEnabled: false,
            initialState: {
              bundleType: template.bundleType,
              templateKey: template.key,
              viewport,
              surface: "builder",
            },
          }),
        );

        expect(view).toContain(`data-template-key="${template.key}"`);
        expect(view).toContain(`data-preview-viewport="${viewport}"`);
        expect(view).toContain(`data-preview-surface="builder"`);
        expect(view).toContain(`data-preview-region="${template.sceneRegions.desktop[0]}"`);
        expect(view).not.toContain("<iframe");
        expect(view).not.toContain("http://");
        expect(view).not.toContain("https://");
      }
    },
  );

  it.each([
    ["horizontal-slots", "product-picker"],
    ["product-list", "cart-summary"],
    ["standard", "loading"],
    ["product-grid", "validation"],
    ["vertical-slots", "upsell"],
  ] as const)("renders the %s %s deterministic surface", (templateKey, surface) => {
    const template = DESIGN_PREVIEW_TEMPLATES.find((item) => item.key === templateKey);
    const view = renderToStaticMarkup(
      React.createElement(DesignLivePreview, {
        fieldValues: {},
        isExpertControlsEnabled: false,
        initialState: {
          bundleType: template?.bundleType ?? "full_page",
          templateKey,
          viewport: "desktop",
          surface,
        },
      }),
    );

    expect(view).toContain(`data-preview-surface="${surface}"`);
    expect(view).toContain(`settingsDcp.preview.surfaceSelector.${surface}`);
  });

  it("renders optimized local fixture media without network or shopping work", () => {
    const view = renderToStaticMarkup(
      React.createElement(DesignLivePreview, { fieldValues: {}, isExpertControlsEnabled: false }),
    );

    expect(view).toContain("/design-preview-product-1.avif");
    expect(view).toContain("/design-preview-product-1.webp");
    expect(view).toContain("/design-preview-product-1.png");
    expect(view).toContain('aria-label="Live bundle preview"');
    expect(view).not.toContain("<iframe");
    expect(view).not.toContain("fetch(");
  });
});
