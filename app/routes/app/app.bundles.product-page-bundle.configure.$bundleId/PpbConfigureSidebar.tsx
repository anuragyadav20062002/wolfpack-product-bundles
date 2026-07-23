import {
  CommonConfigureSidebar,
  CommonConfigureSupplement,
} from "../_shared/bundle-configure/CommonConfigureSidebar";
import { usePpbConfigureContext } from "./PpbConfigureContext";
import { buildPpbLiveCard } from "./ppb-live-card-model";

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

export function PpbConfigureSupplement() {
  const flow = usePpbConfigureContext();
  const liveCard = buildPpbLiveCard({
    isPreparingPlacementTemplates: flow.isPreparingPlacementTemplates,
    handlePlaceWidget: flow.handlePlaceWidget,
  });

  return (
    <CommonConfigureSupplement
      liveCard={liveCard}
      styles={flow.productPageBundleStyles}
    />
  );
}
