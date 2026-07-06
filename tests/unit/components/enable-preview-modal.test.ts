import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { EnablePreviewModal } from "../../../app/components/EnablePreviewModal";
import { openThemeEditorInNewTab } from "../../../app/lib/theme-editor-navigation.client";

jest.mock("../../../app/lib/theme-editor-navigation.client", () => ({
  openThemeEditorInNewTab: jest.fn(),
}));

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        "common.actions.maybeLater": "Maybe later",
        "common.actions.setUpVisibility": "Set up visibility",
        "common.previewGate.body": "Configure visibility to preview the bundle.",
        "common.previewGate.title": "Visibility is not set up",
      };
      return translations[key] ?? key;
    },
  }),
}));

function findElementByText(
  node: React.ReactNode,
  text: string,
): React.ReactElement | null {
  if (!React.isValidElement(node)) return null;
  const children = React.Children.toArray(node.props.children);
  if (children.some((child) => child === text)) return node;
  for (const child of children) {
    const match = findElementByText(child, text);
    if (match) return match;
  }
  return null;
}

describe("EnablePreviewModal", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns null when closed", () => {
    expect(
      EnablePreviewModal({
        onClose: jest.fn(),
        open: false,
        themeEditorUrl: "https://theme-editor.test",
      }),
    ).toBeNull();
  });

  it("renders translated visibility guidance", () => {
    const html = renderToStaticMarkup(
      React.createElement(EnablePreviewModal, {
        onClose: jest.fn(),
        open: true,
        themeEditorUrl: "https://theme-editor.test",
      }),
    );

    expect(html).toContain("Visibility is not set up");
    expect(html).toContain("Configure visibility to preview the bundle.");
    expect(html).toContain("Maybe later");
    expect(html).toContain("Set up visibility");
  });

  it("uses setup visibility callback before direct Theme Editor navigation", () => {
    const onClose = jest.fn();
    const onSetupVisibility = jest.fn();
    const element = EnablePreviewModal({
      onClose,
      onSetupVisibility,
      open: true,
      themeEditorUrl: "https://theme-editor.test",
    });

    findElementByText(element, "Set up visibility")?.props.onClick();

    expect(onSetupVisibility).toHaveBeenCalledTimes(1);
    expect(openThemeEditorInNewTab).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("opens Theme Editor in a new tab when no setup callback is supplied", () => {
    const onClose = jest.fn();
    const element = EnablePreviewModal({
      onClose,
      open: true,
      themeEditorUrl: "https://theme-editor.test",
    });

    findElementByText(element, "Set up visibility")?.props.onClick();

    expect(openThemeEditorInNewTab).toHaveBeenCalledWith(
      "https://theme-editor.test",
    );
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
