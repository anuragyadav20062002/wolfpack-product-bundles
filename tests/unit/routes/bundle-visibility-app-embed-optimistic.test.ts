import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { ConfigureSidebar } from "../../../app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/ConfigureSidebar";
import { FpbBundleVisibilityPanel } from "../../../app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/sections/BundleVisibilityPanel";
import { PpbBundleVisibilitySection } from "../../../app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/PpbBundleVisibilitySection";
import { openThemeEditorInNewTab } from "../../../app/lib/theme-editor-navigation.client";

let mockPpbContext: any;

jest.mock("../../../app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/PpbConfigureContext", () => ({
  usePpbConfigureContext: () => mockPpbContext,
}));

jest.mock("../../../app/lib/theme-editor-navigation.client", () => ({
  openThemeEditorInNewTab: jest.fn(),
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

const visibilityStyles = new Proxy({}, {
  get: (_target, property) => String(property),
});

function makeFpbFlow(overrides: Record<string, unknown> = {}) {
  return {
    activeSection: "bundle_visibility",
    appEmbedEnabled: false,
    bundle: { shopifyPageHandle: "bundle-page" },
    bundlePageUrl: "https://shop.test/pages/bundle-page",
    fullPageBundleStyles: visibilityStyles,
    handleAddToStorefront: jest.fn(),
    handleSectionChange: jest.fn(),
    isInstallingWidget: false,
    markAsDirty: jest.fn(),
    openThemeEditorForAppEmbed: jest.fn(),
    checkAppEmbedStatusBeforePreview: jest.fn(),
    pageSlug: "bundle-page",
    pageSlugError: null,
    setHasManuallyEditedSlug: jest.fn(),
    setPageSlug: jest.fn(),
    shopify: { toast: { show: jest.fn() } },
    slugify: (value: string) => value,
    themeEditorUrl: "https://theme-editor.test",
    ...overrides,
  };
}

function makePpbContext(overrides: Record<string, unknown> = {}) {
  return {
    activeSection: "bundle_visibility",
    appEmbedEnabled: false,
    bundle: { shopifyProductHandle: "bundle-product" },
    handleSectionChange: jest.fn(),
    openThemeEditorForAppEmbed: jest.fn(),
    checkAppEmbedStatusBeforePreview: jest.fn(),
    productPageBundleStyles: visibilityStyles,
    shop: "shop.test",
    shopify: { toast: { show: jest.fn() } },
    themeEditorUrl: "https://theme-editor.test",
    ...overrides,
  };
}

describe("Bundle Visibility app embed optimistic status", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("FPB uses the shared optimistic enable handler without revalidating on render", () => {
    const flow = makeFpbFlow();
    const element = FpbBundleVisibilityPanel({ flow: flow as any });

    expect(flow.checkAppEmbedStatusBeforePreview).not.toHaveBeenCalled();

    findElementByText(element, "Enable Here")?.props.onClick();

    expect(flow.openThemeEditorForAppEmbed).toHaveBeenCalledTimes(1);
    expect(openThemeEditorInNewTab).not.toHaveBeenCalled();
  });

  it("PPB uses the shared optimistic enable handler without revalidating on render", () => {
    mockPpbContext = makePpbContext();
    const element = PpbBundleVisibilitySection();

    expect(mockPpbContext.checkAppEmbedStatusBeforePreview).not.toHaveBeenCalled();

    findElementByText(element, "Enable Here")?.props.onClick();

    expect(mockPpbContext.openThemeEditorForAppEmbed).toHaveBeenCalledTimes(1);
    expect(openThemeEditorInNewTab).not.toHaveBeenCalled();
  });

  it("FPB sidebar marks Bundle Visibility optimised from optimistic app embed state", () => {
    const html = renderToStaticMarkup(
      React.createElement(ConfigureSidebar, {
        flow: {
          activeSection: "step_setup",
          appEmbedEnabled: true,
          bundle: { bundleType: "full_page", shopifyPageHandle: null },
          bundleProduct: null,
          bundleSetupItems: [
            { id: "bundle_visibility", label: "Bundle Visibility" },
          ],
          bundleVisibilityChildItems: [],
          formState: { bundleName: "Bundle" },
          fullPageBundleStyles: visibilityStyles,
          handleBundleProductSelect: jest.fn(),
          handleSectionChange: jest.fn(),
          handleSyncProduct: jest.fn(),
          openProductInAdmin: jest.fn(),
          openSelectTemplateModal: jest.fn(),
          parentProductStatusUi: { tone: "success", label: "Active" },
          pricingState: { discountEnabled: false },
          productImageUrl: null,
          productMenuOpen: false,
          productTitle: "Bundle",
          selectTemplateOpenButtonRef: { current: null },
          setProductMenuOpen: jest.fn(),
          stepSetupChildItems: [],
          upsellWidgetEnabled: false,
          VisibilityBadge: ({ isOptimised }: { isOptimised: boolean }) =>
            React.createElement("span", null, isOptimised ? "Optimised" : "Pending"),
        } as any,
      }),
    );

    expect(html).toContain("Optimised");
    expect(html).not.toContain("Pending");
  });
});
