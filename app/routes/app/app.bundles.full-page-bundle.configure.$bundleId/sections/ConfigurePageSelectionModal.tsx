import { useEffect, useRef } from "react";
import {
  hidePolarisModal,
  showPolarisModal,
  useModalHideListener,
} from "../../_shared/bundle-configure/modal-utils";
import type { ConfigureBundleFlowContext } from "../useConfigureBundleFlow";

export function FpbPageSelectionModal({
  flow,
}: {
  flow: ConfigureBundleFlowContext;
}) {
  const {
    availablePages,
    bundle,
    closePageSelectionModal,
    handlePageSelection,
    isInstallingWidget,
    isLoadingPages,
    isPageSelectionModalOpen,
  } = flow;
  const modalRef = useRef<any>(null);

  useEffect(() => {
    isPageSelectionModalOpen
      ? showPolarisModal(modalRef)
      : hidePolarisModal(modalRef);
  }, [isPageSelectionModalOpen]);
  useModalHideListener(modalRef, closePageSelectionModal);

  return (
    <s-modal ref={modalRef} heading="Add Wolfpack Bundles to storefront" size="base">
      <s-button
        slot="secondary-actions"
        disabled={isInstallingWidget || undefined}
        onClick={closePageSelectionModal}
      >
        Cancel
      </s-button>
      <s-stack direction="block" gap="base">
        <s-text color="subdued">
          {bundle.bundleType === "full_page"
            ? "Select a page to place and preview the bundle."
            : "Select a template to place and preview the bundle."}
        </s-text>
        {isLoadingPages ? (
          <s-stack direction="inline" alignItems="center" gap="small">
            <s-spinner accessibilityLabel="Loading storefront pages" />
            <s-text color="subdued">Loading pages...</s-text>
          </s-stack>
        ) : availablePages.length > 0 ? (
          <s-stack direction="block" gap="small">
            {availablePages.map((template) => (
              <s-box key={template.id || template.handle} border="base" borderRadius="base" padding="base">
                <s-stack direction="inline" alignItems="center" justifyContent="space-between" gap="base">
                  <s-stack direction="block" gap="small-100">
                    <s-stack direction="inline" alignItems="center" gap="small">
                      <s-text type="strong">{template.title}</s-text>
                      {template.recommended ? <s-badge tone="success">Bundle Product</s-badge> : null}
                    </s-stack>
                    {template.description ? <s-text color="subdued">{template.description}</s-text> : null}
                  </s-stack>
                  <s-button
                    variant={template.recommended ? "primary" : "secondary"}
                    loading={isInstallingWidget || undefined}
                    disabled={isInstallingWidget || undefined}
                    onClick={() => handlePageSelection(template)}
                  >
                    {isInstallingWidget ? "Adding..." : "Select"}
                  </s-button>
                </s-stack>
              </s-box>
            ))}
          </s-stack>
        ) : (
          <s-stack direction="block" gap="base">
            <s-text color="subdued">
              {bundle.bundleType === "full_page" ? "No pages available" : "No templates available"}
            </s-text>
            <s-button href="https://admin.shopify.com/admin/pages" target="_blank">Create page</s-button>
          </s-stack>
        )}
      </s-stack>
    </s-modal>
  );
}
