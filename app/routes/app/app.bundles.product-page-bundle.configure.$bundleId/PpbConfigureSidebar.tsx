import { CommonConfigureSidebar } from "../_shared/bundle-configure/CommonConfigureSidebar";
import { usePpbConfigureContext } from "./PpbConfigureContext";

export function PpbConfigureSidebar() {
  const flow = usePpbConfigureContext();

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
        liveCard: {
          title: "Take your bundle live",
          label: "Place on theme",
          actionLabel: "Place Widget",
          loading: flow.isPreparingPlacementTemplates,
          disabled: flow.isPreparingPlacementTemplates,
          onAction: flow.handlePlaceWidget,
        },
        openProductInAdmin: flow.openProductInAdmin,
        openSelectTemplateModal: flow.openSelectTemplateModal,
        parentProductStatusUi: flow.parentProductStatusUi,
        pricingState: flow.pricingState,
        productImageUrl: flow.productImageUrl,
        productMenuOpen: flow.productMenuOpen,
        productTitle: flow.productTitle,
        selectTemplateOpenButtonRef: flow.selectTemplateOpenButtonRef,
        setProductMenuOpen: flow.setProductMenuOpen,
        styles: flow.productPageBundleStyles,
        VisibilityBadge: flow.VisibilityBadge,
      }}
    />
  );
}
