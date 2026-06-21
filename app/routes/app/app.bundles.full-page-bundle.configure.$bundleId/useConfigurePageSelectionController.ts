import { useCallback } from "react";
import { AppLogger } from "../../../lib/logger";
import type { ConfigureBundleFlowDraft } from "./configure-flow-types";

export function useConfigurePageSelectionController(
  flow: ConfigureBundleFlowDraft,
) {
  const handlePageSelection = useCallback(
    async (template: any) => {
      if (!template?.handle) {
        flow.shopify.toast.show("Template data is invalid", {
          isError: true,
          duration: 5000,
        });
        return;
      }
      const shopDomain = flow.shop.includes(".myshopify.com")
        ? flow.shop.replace(".myshopify.com", "")
        : flow.shop;
      const buildThemeEditorUrl = () => {
        const placementBlockHandle = template.isPage
          ? flow.blockHandle
          : flow.upsellWidgetDisplayMode === "button"
            ? "bundle-upsell-button"
            : "bundle-upsell-block";
        const appBlockId = `${flow.apiKey}/${placementBlockHandle}`;
        const templateParam = template.isPage ? "page" : template.handle;
        const previewPath = template.isPage
          ? encodeURIComponent(`/pages/${template.handle}`)
          : "";
        return `https://${shopDomain}.myshopify.com/admin/themes/current/editor?template=${templateParam}&addAppBlockId=${appBlockId}&target=newAppsSection${previewPath ? `&previewPath=${previewPath}` : ""}`;
      };
      if (template.isPage) {
        if (!flow.apiKey || !flow.blockHandle) {
          flow.shopify.toast.show(
            "App configuration missing. Please check app setup.",
            { isError: true, duration: 5000 },
          );
          return;
        }
        flow.setSelectedPage(template);
        flow.closePageSelectionModal();
        flow.shopify.toast.show(
          `Opening Theme Editor for "${template.title}". Add the full-page bundle block to this page template.`,
          { isError: false, duration: 5000 },
        );
        window.open(buildThemeEditorUrl(), "_blank");
        return;
      }
      try {
        if (!flow.apiKey || !flow.blockHandle) {
          flow.shopify.toast.show(
            "App configuration missing. Please check app setup.",
            { isError: true, duration: 5000 },
          );
          return;
        }
        if (template.isBundleContainer && template.bundleProduct) {
          await flow
            .ensureProductTemplate({
              productHandle: template.bundleProduct.handle,
              bundleId: flow.bundle.id,
            })
            .unwrap()
            .catch(() => {
              /* non-fatal */
            });
        }
        flow.setSelectedPage(template);
        flow.closePageSelectionModal();
        flow.shopify.toast.show(
          `Opening Theme Editor for "${template.title}"...`,
          {
            isError: false,
            duration: 5000,
          },
        );
        window.open(buildThemeEditorUrl(), "_blank");
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        AppLogger.error(
          "🚨 [THEME_EDITOR] Error in handlePageSelection:",
          { errorMessage },
          error as any,
        );
        flow.shopify.toast.show(
          `Failed to open Theme Editor: ${errorMessage}`,
          {
            isError: true,
            duration: 5000,
          },
        );
      }
    },
    [flow],
  );

  Object.assign(flow, {
    handlePageSelection,
  });
}
