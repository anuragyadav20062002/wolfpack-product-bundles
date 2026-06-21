import { useEffect, useRef, useState } from "react";
import {
  hidePolarisModal,
  showPolarisModal,
  useModalHideListener,
} from "../_shared/bundle-configure/modal-utils";
import type { ConfigureBundleFlowDraft } from "./configure-flow-types";

export function useConfigureModalController(flow: ConfigureBundleFlowDraft) {
  const {
    closeCollectionsModal,
    closeProductsModal,
    isAddonSelectedProductsModalOpen,
    isBundleQuantityMultiLangModalOpen,
    isCollectionsModalOpen,
    isProductsModalOpen,
    isProgressBarMultiLangModalOpen,
    isSyncModalOpen,
    setCurrentModalStepId,
    setIsAddonSelectedProductsModalOpen,
    setIsBundleQuantityMultiLangModalOpen,
    setIsProgressBarMultiLangModalOpen,
    setIsSyncModalOpen,
  } = flow;
  const productsModalRef = useRef<any>(null);
  const collectionsModalRef = useRef<any>(null);
  const syncModalRef = useRef<any>(null);
  const templateVariablesModalRef = useRef<any>(null);
  const discountVariablesModalRef = useRef<any>(null);
  const addonVariablesModalRef = useRef<any>(null);
  const addonSelectedProductsModalRef = useRef<any>(null);
  const disableAddonStepModalRef = useRef<any>(null);
  const [isDiscountVariablesModalOpen, setIsDiscountVariablesModalOpen] =
    useState(false);
  const [isAddonVariablesModalOpen, setIsAddonVariablesModalOpen] =
    useState(false);
  const [isDisableAddonStepModalOpen, setIsDisableAddonStepModalOpen] =
    useState(false);
  const [showDiscardModal, setShowDiscardModal] = useState(false);

  useEffect(() => {
    isProductsModalOpen
      ? showPolarisModal(productsModalRef)
      : hidePolarisModal(productsModalRef);
  }, [isProductsModalOpen]);
  useEffect(() => {
    isCollectionsModalOpen
      ? showPolarisModal(collectionsModalRef)
      : hidePolarisModal(collectionsModalRef);
  }, [isCollectionsModalOpen]);
  useEffect(() => {
    isSyncModalOpen
      ? showPolarisModal(syncModalRef)
      : hidePolarisModal(syncModalRef);
  }, [isSyncModalOpen]);
  useEffect(() => {
    isProgressBarMultiLangModalOpen
      ? showPolarisModal(flow.progressBarMultiLangModalRef)
      : hidePolarisModal(flow.progressBarMultiLangModalRef);
  }, [flow.progressBarMultiLangModalRef, isProgressBarMultiLangModalOpen]);
  useEffect(() => {
    isBundleQuantityMultiLangModalOpen
      ? showPolarisModal(flow.bundleQuantityMultiLangModalRef)
      : hidePolarisModal(flow.bundleQuantityMultiLangModalRef);
  }, [
    flow.bundleQuantityMultiLangModalRef,
    isBundleQuantityMultiLangModalOpen,
  ]);
  useEffect(() => {
    isDiscountVariablesModalOpen
      ? showPolarisModal(discountVariablesModalRef)
      : hidePolarisModal(discountVariablesModalRef);
  }, [isDiscountVariablesModalOpen]);
  useEffect(() => {
    isAddonVariablesModalOpen
      ? showPolarisModal(addonVariablesModalRef)
      : hidePolarisModal(addonVariablesModalRef);
  }, [isAddonVariablesModalOpen]);
  useEffect(() => {
    isAddonSelectedProductsModalOpen
      ? showPolarisModal(addonSelectedProductsModalRef)
      : hidePolarisModal(addonSelectedProductsModalRef);
  }, [isAddonSelectedProductsModalOpen]);
  useEffect(() => {
    isDisableAddonStepModalOpen
      ? showPolarisModal(disableAddonStepModalRef)
      : hidePolarisModal(disableAddonStepModalRef);
  }, [isDisableAddonStepModalOpen]);

  const handleCloseProductsModal = () => {
    closeProductsModal();
    setCurrentModalStepId("");
  };
  const handleCloseCollectionsModal = () => {
    closeCollectionsModal();
    setCurrentModalStepId("");
  };
  const handleCloseAddonSelectedProductsModal = () => {
    setIsAddonSelectedProductsModalOpen(false);
    flow.setAddonSelectedProductsTierIndex(null);
    hidePolarisModal(addonSelectedProductsModalRef);
  };

  useModalHideListener(productsModalRef, handleCloseProductsModal);
  useModalHideListener(collectionsModalRef, handleCloseCollectionsModal);
  useModalHideListener(syncModalRef, () => setIsSyncModalOpen(false));
  useModalHideListener(flow.progressBarMultiLangModalRef, () =>
    setIsProgressBarMultiLangModalOpen(false),
  );
  useModalHideListener(flow.bundleQuantityMultiLangModalRef, () =>
    setIsBundleQuantityMultiLangModalOpen(false),
  );
  useModalHideListener(discountVariablesModalRef, () =>
    setIsDiscountVariablesModalOpen(false),
  );
  useModalHideListener(addonVariablesModalRef, () =>
    setIsAddonVariablesModalOpen(false),
  );
  useModalHideListener(
    addonSelectedProductsModalRef,
    handleCloseAddonSelectedProductsModal,
  );
  useModalHideListener(disableAddonStepModalRef, () =>
    setIsDisableAddonStepModalOpen(false),
  );

  Object.assign(flow, {
    addonSelectedProductsModalRef,
    addonVariablesModalRef,
    collectionsModalRef,
    disableAddonStepModalRef,
    discountVariablesModalRef,
    handleCloseAddonSelectedProductsModal,
    handleCloseCollectionsModal,
    handleCloseProductsModal,
    hidePolarisModal,
    isAddonVariablesModalOpen,
    isDisableAddonStepModalOpen,
    isDiscountVariablesModalOpen,
    productsModalRef,
    setIsAddonVariablesModalOpen,
    setIsDisableAddonStepModalOpen,
    setIsDiscountVariablesModalOpen,
    setShowDiscardModal,
    showDiscardModal,
    showPolarisModal,
    syncModalRef,
    templateVariablesModalRef,
    useModalHideListener,
  });
}
