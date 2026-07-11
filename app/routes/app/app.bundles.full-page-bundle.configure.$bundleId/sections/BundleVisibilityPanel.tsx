import {
  buildBundleLinkModel,
  buildEmbedStatusModel,
} from "../../../../lib/bundle-config/common-configure-page-model";
import { CommonBundleVisibilityOverview } from "../../_shared/bundle-configure/CommonBundleVisibilityOverview";
import type { ConfigureBundleFlowContext } from "../useConfigureBundleFlow";

export function FpbBundleVisibilityPanel({
  flow,
}: {
  flow: ConfigureBundleFlowContext;
}) {
  const link = buildBundleLinkModel({
    bundleType: "full_page",
    fullPageUrl: flow.bundlePageUrl,
    pageHandle: flow.bundle.shopifyPageHandle,
  });

  return CommonBundleVisibilityOverview({
    active: flow.activeSection === "bundle_visibility",
    creatingPage: flow.isInstallingWidget,
    embedStatus: buildEmbedStatusModel("full_page", flow.appEmbedEnabled),
    link,
    onCopyLink: () => {
      void navigator.clipboard?.writeText(link.url);
      flow.shopify.toast.show("Bundle link copied", {
        isError: false,
      });
    },
    onCreatePage: flow.handleAddToStorefront,
    onEnableEmbed: flow.openThemeEditorForAppEmbed,
    onOpenLink: () => window.open(link.url, "_blank"),
    onPageSlugBlur: () => flow.setPageSlug(flow.slugify(flow.pageSlug)),
    onPageSlugEdited: () => {
      flow.setHasManuallyEditedSlug(true);
      flow.markAsDirty();
    },
    pageSlug: flow.pageSlug,
    pageSlugError: flow.pageSlugError,
    placementOptions: [
        {
          title: "Bundle Widget",
          description:
            "This will display an upsell block or button on the product pages of your choice.",
          actionLabel: "Set up Bundle Widget",
          variant: "primary",
          onAction: () => flow.handleSectionChange("bundle_widget"),
        },
      ],
    setPageSlug: flow.setPageSlug,
    styles: flow.fullPageBundleStyles,
    themeEditorUrl: flow.themeEditorUrl,
  });
}
