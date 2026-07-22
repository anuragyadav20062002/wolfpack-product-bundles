import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { DESIGN_CONFIGURATION } from "../../../app/lib/admin-configuration-surfaces";
import { DesignSettingsView } from "../../../app/routes/app/app.settings/DesignSettingsView";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock("@shopify/app-bridge-react", () => ({
  useAppBridge: () => ({ saveBar: { show: jest.fn(), hide: jest.fn() } }),
}));

describe("DesignSettingsView live preview", () => {
  it("renders live feedback inside the existing design settings view", () => {
    const view = renderToStaticMarkup(
      React.createElement(DesignSettingsView, {
        selectedDesignTab: DESIGN_CONFIGURATION[0],
        isExpertColorControls: false,
        isExpertScopeActive: false,
        activeDesignScope: "General",
        designFieldValues: { "Primary Color": "#123456" },
        designGateMessage: null,
        isActiveSubpageDirty: false,
        isPreviewModalOpen: false,
        previewBundles: [{ id: "bundle-1", name: "Summer Box", type: "Landing Page", viewUrl: "https://shop.test/pages/bundle" }],
        saveMessage: null,
        setSettingsView: jest.fn(),
        setIsPreviewModalOpen: jest.fn(),
        setActiveDesignTab: jest.fn(),
        setIsExpertScopeActive: jest.fn(),
        setDesignGateMessage: jest.fn(),
        setActiveDesignScope: jest.fn(),
        setDesignFieldValues: jest.fn(),
        setIsExpertColorControls: jest.fn(),
        setSaveMessage: jest.fn(),
        discardActiveSettingsChanges: jest.fn(),
        saveActiveSettingsChanges: jest.fn(),
      }),
    );

    expect(view).not.toContain("<iframe");
    expect(view).toContain('aria-label="Live bundle preview"');
    expect(view).toContain('aria-label="settingsDcp.preview.previewOnly"');
    expect(view).toContain("disabled");
    expect(view).toContain("<s-color-field");
    expect(view).toContain("<s-button");
  });

  it("keeps Images & GIFs preview content usable without a loading status", () => {
    const imagesTab = DESIGN_CONFIGURATION.find((tab) => tab.title === "Images & GIFs");
    expect(imagesTab).toBeDefined();

    const view = renderToStaticMarkup(
      React.createElement(DesignSettingsView, {
        selectedDesignTab: imagesTab ?? DESIGN_CONFIGURATION[0],
        isExpertColorControls: false,
        isExpertScopeActive: false,
        activeDesignScope: "General",
        designFieldValues: {},
        designGateMessage: null,
        isActiveSubpageDirty: false,
        isPreviewModalOpen: false,
        previewBundles: [{ id: "bundle-1", name: "Summer Box", type: "Landing Page", viewUrl: "https://shop.test/pages/bundle" }],
        saveMessage: null,
        setSettingsView: jest.fn(),
        setIsPreviewModalOpen: jest.fn(),
        setActiveDesignTab: jest.fn(),
        setIsExpertScopeActive: jest.fn(),
        setDesignGateMessage: jest.fn(),
        setActiveDesignScope: jest.fn(),
        setDesignFieldValues: jest.fn(),
        setIsExpertColorControls: jest.fn(),
        setSaveMessage: jest.fn(),
        discardActiveSettingsChanges: jest.fn(),
        saveActiveSettingsChanges: jest.fn(),
      }),
    );

    expect(view).toContain('aria-label="Live bundle preview"');
    expect(view).not.toContain('role="status"');
    expect(view).not.toContain("settingsDcp.preview.loading");
  });
});
