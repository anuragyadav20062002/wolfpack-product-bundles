import { useEffect, useRef } from "react";
import {
  hidePolarisModal,
  showPolarisModal,
  useModalHideListener,
} from "../_shared/bundle-configure/modal-utils";
import { usePpbConfigureContext } from "./PpbConfigureContext";

export function PpbPageSelectionModal() {
  const {
    availablePages,
    closePageSelectionModal,
    handlePageSelection,
    isPageSelectionModalOpen,
  } = usePpbConfigureContext();
  const modalRef = useRef<any>(null);

  useEffect(() => {
    isPageSelectionModalOpen
      ? showPolarisModal(modalRef)
      : hidePolarisModal(modalRef);
  }, [isPageSelectionModalOpen]);
  useModalHideListener(modalRef, closePageSelectionModal);

  return (
    <s-modal ref={modalRef} heading="Select product page template" size="base">
      <s-button slot="secondary-actions" onClick={closePageSelectionModal}>Cancel</s-button>
      {availablePages.length > 0 ? (
        <s-stack direction="block" gap="small">
          {availablePages.map((template: { id?: string; handle?: string; title?: string }) => (
            <s-button
              key={template.id ?? template.handle ?? template.title}
              variant="secondary"
              inlineSize="fill"
              onClick={() => handlePageSelection(template)}
            >
              {template.title}
            </s-button>
          ))}
        </s-stack>
      ) : (
        <s-stack direction="block" gap="base" alignItems="center">
          <s-text color="subdued">No templates available</s-text>
          <s-button href="https://admin.shopify.com/admin/pages" target="_blank">Create page</s-button>
        </s-stack>
      )}
    </s-modal>
  );
}
