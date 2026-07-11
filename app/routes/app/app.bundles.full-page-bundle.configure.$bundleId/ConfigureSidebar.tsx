import { CommonConfigureSidebar } from "../_shared/bundle-configure/CommonConfigureSidebar";
import type { ConfigureBundleFlowContext } from "./useConfigureBundleFlow";

export function ConfigureSidebar({
  flow,
}: {
  flow: ConfigureBundleFlowContext;
}) {
  return (
    <CommonConfigureSidebar
      adapter={{
        activeSection: flow.activeSection,
        appEmbedEnabled: flow.appEmbedEnabled,
        bundle: flow.bundle,
        bundleProduct: flow.bundleProduct,
        bundleSetupItems: flow.bundleSetupItems,
        bundleVisibilityChildItems: flow.bundleVisibilityChildItems,
        formState: flow.formState,
        handleBundleProductSelect: flow.handleBundleProductSelect,
        handleSectionChange: flow.handleSectionChange,
        handleSyncProduct: flow.handleSyncProduct,
        openProductInAdmin: flow.openProductInAdmin,
        openSelectTemplateModal: flow.openSelectTemplateModal,
        parentProductStatusUi: flow.parentProductStatusUi,
        pricingState: flow.pricingState,
        productImageUrl: flow.productImageUrl,
        productMenuOpen: flow.productMenuOpen,
        productTitle: flow.productTitle,
        selectTemplateOpenButtonRef: flow.selectTemplateOpenButtonRef,
        setProductMenuOpen: flow.setProductMenuOpen,
        stepSetupChildItems: flow.stepSetupChildItems,
        styles: flow.fullPageBundleStyles,
        VisibilityBadge: flow.VisibilityBadge,
      }}
    />
  );
}
