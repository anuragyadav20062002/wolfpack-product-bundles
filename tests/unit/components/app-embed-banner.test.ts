import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import {
  AppEmbedBanner,
  AppEmbedGuideModal,
} from "../../../app/components/AppEmbedBanner";
import { openThemeEditorInNewTab } from "../../../app/lib/theme-editor-navigation.client";

jest.mock("../../../app/lib/theme-editor-navigation.client", () => ({
  openThemeEditorInNewTab: jest.fn(),
}));

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        "common.actions.close": "Close",
        "common.actions.enable": "Enable",
        "common.actions.enableHere": "Enable Here",
        "common.actions.learnMore": "Learn More",
        "common.appEmbed.body":
          "Enable the Theme app extension for Wolfpack Bundles to place and preview the bundle.",
        "common.appEmbed.guideImageAlt":
          "How to enable the Wolfpack Bundles app embed",
        "common.appEmbed.guideTitle": "Enable app embed",
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

describe("AppEmbedBanner", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("does not render when the app embed is enabled", () => {
    const html = renderToStaticMarkup(
      React.createElement(AppEmbedBanner, {
        appEmbedEnabled: true,
        themeEditorUrl: "https://theme-editor.test",
      }),
    );

    expect(html).toBe("");
  });

  it("renders a persistent enable warning without a dismiss control when the app embed is disabled", () => {
    const html = renderToStaticMarkup(
      React.createElement(AppEmbedBanner, {
        appEmbedEnabled: false,
        themeEditorUrl: "https://theme-editor.test",
      }),
    );

    expect(html).toContain("Enable the Theme app extension for Wolfpack Bundles");
    expect(html).toContain("Enable Here");
    expect(html).toContain("Learn More");
    expect(html).not.toContain("Dismiss");
    expect(html).not.toContain("common.actions.dismiss");
  });

  it("renders the guide modal with the app embed guide image and actions", () => {
    const html = renderToStaticMarkup(
      React.createElement(AppEmbedGuideModal, {
        onClose: jest.fn(),
        open: true,
        themeEditorUrl: "https://theme-editor.test",
      }),
    );

    expect(html).toContain("Enable app embed");
    expect(html).toContain("/appEmbedGuide.avif");
    expect(html).toContain("How to enable the Wolfpack Bundles app embed");
    expect(html).toContain("Enable");
    expect(html).toContain("Close");
  });

  it("closes the guide modal from Close and opens Theme Editor from Enable", () => {
    const onClose = jest.fn();
    const element = AppEmbedGuideModal({
      onClose,
      open: true,
      themeEditorUrl: "https://theme-editor.test",
    });

    findElementByText(element, "Close")?.props.onClick();
    expect(onClose).toHaveBeenCalledTimes(1);

    findElementByText(element, "Enable")?.props.onClick();
    expect(openThemeEditorInNewTab).toHaveBeenCalledWith(
      "https://theme-editor.test",
    );
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it("closes the guide modal and uses the optimistic enable callback when provided", () => {
    const onClose = jest.fn();
    const onEnableClick = jest.fn();
    const element = AppEmbedGuideModal({
      onClose,
      onEnableClick,
      open: true,
      themeEditorUrl: "https://theme-editor.test",
    });

    findElementByText(element, "Enable")?.props.onClick();

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onEnableClick).toHaveBeenCalledTimes(1);
    expect(openThemeEditorInNewTab).not.toHaveBeenCalled();
  });
});
