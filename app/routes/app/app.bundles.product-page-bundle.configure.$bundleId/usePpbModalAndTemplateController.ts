import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
} from "react";
import {
  hidePolarisModal,
  showPolarisModal,
  useModalHideListener,
} from "../_shared/bundle-configure/modal-utils";
import { PPB_DESIGN_CONTROL_PANEL_URL } from "./ConfigureBundleFlow.helpers";

export function usePpbModalAndTemplateController({
  base,
  display,
  templateState,
  placement,
  previewReadiness,
  saveHandlers,
}: {
  base: any;
  display: any;
  templateState: any;
  placement: any;
  previewReadiness: any;
  saveHandlers: any;
}) {
  const syncModalRef = useRef<any>(null);
  const productsModalRef = useRef<any>(null);
  const collectionsModalRef = useRef<any>(null);
  const [showDiscardModal, setShowDiscardModal] = useState(false);

  useEffect(() => {
    templateState.isSyncModalOpen
      ? showPolarisModal(syncModalRef)
      : hidePolarisModal(syncModalRef);
  }, [templateState.isSyncModalOpen]);
  useEffect(() => {
    base.isProductsModalOpen
      ? showPolarisModal(productsModalRef)
      : hidePolarisModal(productsModalRef);
  }, [base.isProductsModalOpen]);
  useEffect(() => {
    base.isCollectionsModalOpen
      ? showPolarisModal(collectionsModalRef)
      : hidePolarisModal(collectionsModalRef);
  }, [base.isCollectionsModalOpen]);
  useEffect(() => {
    display.isProgressBarMultiLangModalOpen
      ? showPolarisModal(display.progressBarMultiLangModalRef)
      : hidePolarisModal(display.progressBarMultiLangModalRef);
  }, [
    display.isProgressBarMultiLangModalOpen,
    display.progressBarMultiLangModalRef,
  ]);
  useEffect(() => {
    display.isBundleQuantityMultiLangModalOpen
      ? showPolarisModal(display.bundleQuantityMultiLangModalRef)
      : hidePolarisModal(display.bundleQuantityMultiLangModalRef);
  }, [
    display.bundleQuantityMultiLangModalRef,
    display.isBundleQuantityMultiLangModalOpen,
  ]);
  useEffect(() => {
    display.isDiscountVariablesModalOpen
      ? showPolarisModal(display.discountVariablesModalRef)
      : hidePolarisModal(display.discountVariablesModalRef);
  }, [display.discountVariablesModalRef, display.isDiscountVariablesModalOpen]);
  useModalHideListener(syncModalRef, () =>
    templateState.setIsSyncModalOpen(false),
  );
  useModalHideListener(productsModalRef, placement.handleCloseProductsModal);
  useModalHideListener(
    collectionsModalRef,
    placement.handleCloseCollectionsModal,
  );
  useModalHideListener(display.progressBarMultiLangModalRef, () =>
    display.setIsProgressBarMultiLangModalOpen(false),
  );
  useModalHideListener(display.bundleQuantityMultiLangModalRef, () =>
    display.setIsBundleQuantityMultiLangModalOpen(false),
  );
  useModalHideListener(display.discountVariablesModalRef, () =>
    display.setIsDiscountVariablesModalOpen(false),
  );
  const closeDiscardModal = useCallback(() => {
    setShowDiscardModal(false);
  }, []);
  const closeSelectTemplateDialog = useCallback(() => {
    templateState.setIsSelectTemplateModalOpen(false);
    templateState.setTemplateModalStep("templates");
    templateState.setTemplateSaveError(null);
    templateState.lastTemplateRequestRef.current = null;
    templateState.lastTemplateResponseRef.current = null;
    requestAnimationFrame(() => {
      templateState.selectTemplateOpenButtonRef.current?.focus();
    });
  }, [templateState]);
  const getSelectTemplateDialogFocusableElements =
    useCallback((): HTMLElement[] => {
      if (!templateState.selectTemplateDialogRef.current) {
        return [];
      }
      return Array.from(
        templateState.selectTemplateDialogRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        ),
      ).filter(
        (element) =>
          !element.hasAttribute("disabled") &&
          element.tabIndex >= 0 &&
          window.getComputedStyle(element).display !== "none" &&
          window.getComputedStyle(element).visibility !== "hidden",
      );
    }, [templateState.selectTemplateDialogRef]);
  const handleSelectTemplateDialogKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        closeSelectTemplateDialog();
        return;
      }
      if (event.key !== "Tab") {
        return;
      }
      const focusableElements = getSelectTemplateDialogFocusableElements();
      if (focusableElements.length === 0) {
        event.preventDefault();
        return;
      }
      const activeElement = document.activeElement as HTMLElement | null;
      const activeElementIndex = activeElement
        ? focusableElements.indexOf(activeElement)
        : -1;
      const first = focusableElements[0];
      const last = focusableElements[focusableElements.length - 1];
      if (activeElementIndex === -1) {
        event.preventDefault();
        first.focus();
        return;
      }
      if (event.shiftKey && activeElementIndex === 0) {
        event.preventDefault();
        last.focus();
        return;
      }
      if (
        !event.shiftKey &&
        activeElementIndex === focusableElements.length - 1
      ) {
        event.preventDefault();
        first.focus();
      }
    },
    [closeSelectTemplateDialog, getSelectTemplateDialogFocusableElements],
  );
  const handleSelectTemplateBackdropClick = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      if (event.target === event.currentTarget) {
        closeSelectTemplateDialog();
      }
    },
    [closeSelectTemplateDialog],
  );
  const openSelectTemplateModal = useCallback(() => {
    templateState.setPendingDesignTemplate(templateState.bundleDesignTemplate);
    templateState.setPendingDesignPresetId(templateState.bundleDesignPresetId);
    templateState.setTemplateModalStep("templates");
    templateState.setTemplateSaveError(null);
    templateState.lastTemplateRequestRef.current = null;
    templateState.lastTemplateResponseRef.current = null;
    templateState.setIsSelectTemplateModalOpen(true);
  }, [templateState]);
  const openDesignControlPanel = useCallback(() => {
    base.navigate(PPB_DESIGN_CONTROL_PANEL_URL);
  }, [base]);
  useEffect(() => {
    if (templateState.isSelectTemplateModalOpen) {
      templateState.selectTemplateDialogRef.current?.focus();
    }
  }, [
    templateState.isSelectTemplateModalOpen,
    templateState.selectTemplateDialogRef,
  ]);
  const handleTemplateNext = useCallback(() => {
    if (
      !templateState.pendingDesignTemplate ||
      !templateState.pendingDesignPresetId
    ) {
      return;
    }
    templateState.setTemplateSaveError(null);
    templateState.lastTemplateRequestRef.current = {
      template: templateState.pendingDesignTemplate,
      presetId: templateState.pendingDesignPresetId,
    };
    templateState.lastTemplateResponseRef.current = null;
    const fd = new FormData();
    fd.append("intent", "updateBundleDesignTemplate");
    fd.append(
      "bundleDesignTemplate",
      templateState.pendingDesignTemplate ?? "",
    );
    fd.append(
      "bundleDesignPresetId",
      templateState.pendingDesignPresetId ?? "",
    );
    templateState.templateFetcher.submit(fd, { method: "POST" });
  }, [templateState]);
  const handleTemplatePreview = useCallback(() => {
    void previewReadiness.handlePreviewBundle();
    closeSelectTemplateDialog();
  }, [closeSelectTemplateDialog, previewReadiness]);
  const handleConfirmDiscard = useCallback(() => {
    closeDiscardModal();
    saveHandlers.handleDiscard();
  }, [closeDiscardModal, saveHandlers]);

  return {
    syncModalRef,
    productsModalRef,
    collectionsModalRef,
    showDiscardModal,
    setShowDiscardModal,
    closeDiscardModal,
    closeSelectTemplateDialog,
    getSelectTemplateDialogFocusableElements,
    handleSelectTemplateDialogKeyDown,
    handleSelectTemplateBackdropClick,
    openSelectTemplateModal,
    openDesignControlPanel,
    handleTemplateNext,
    handleTemplatePreview,
    handleConfirmDiscard,
  };
}
