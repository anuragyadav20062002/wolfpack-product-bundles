import { usePpbConfigureContext } from "./PpbConfigureContext";

export function PpbUtilityModals() {
  const {
    ADDON_TEMPLATE_VARIABLES,
    DISCOUNT_TEMPLATE_VARIABLES,
    discountVariablesModalRef,
    fetcher,
    handleSyncBundleConfirm,
    hidePolarisModal,
    productPageBundleStyles,
    setIsSyncModalOpen,
    syncModalRef,
    templateVariablesModalRef,
  } = usePpbConfigureContext();

  return (
    <>
      {/* Sync Bundle Confirmation Modal */}
      <s-modal ref={syncModalRef} heading="Sync Bundle?">
        <s-stack direction="block" gap="small">
          <p style={{ margin: 0, fontSize: 14 }}>
            This will delete and re-create all Shopify data for this bundle:
          </p>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            <li>
              The Shopify product will be archived and deleted, then re-created
            </li>
            <li>All bundle and component metafields will be rewritten</li>
          </ul>
          <p style={{ margin: 0, fontSize: 14, color: "#6d7175" }}>
            Bundle analytics are preserved. This action cannot be undone.
          </p>
        </s-stack>
        <s-button
          slot="primary-action"
          variant="primary"
          loading={fetcher.state === "submitting" || undefined}
          onClick={handleSyncBundleConfirm}
        >
          Sync Bundle
        </s-button>
        <s-button
          slot="secondary-actions"
          onClick={() => setIsSyncModalOpen(false)}
        >
          Cancel
        </s-button>
      </s-modal>
      <s-modal
        id="ppb-template-variables-modal"
        ref={templateVariablesModalRef}
        heading="Message variables"
        size="small"
      >
        <s-stack direction="block" gap="small">
          <p style={{ margin: 0, fontSize: 14, color: "#6d7175" }}>
            Use these variables in Wolfpack Bundles messages. The widget
            replaces them with live bundle and discount values.
          </p>
          <div className={productPageBundleStyles.templateVariableGrid}>
            {ADDON_TEMPLATE_VARIABLES.map(([variable, description]) => (
              <div
                key={variable}
                className={productPageBundleStyles.templateVariableItem}
              >
                <s-badge>{variable}</s-badge>
                <s-text color="subdued">{description}</s-text>
              </div>
            ))}
          </div>
        </s-stack>
        <s-button
          slot="primary-action"
          variant="primary"
          commandFor="ppb-template-variables-modal"
          command="--hide"
          onClick={() => hidePolarisModal(templateVariablesModalRef)}
        >
          Done
        </s-button>
      </s-modal>
      <s-modal
        id="discount-variables-modal"
        ref={discountVariablesModalRef}
        heading="Variables"
        size="base"
      >
        <div>
          {DISCOUNT_TEMPLATE_VARIABLES.map(([variable, description], index) => (
            <div key={variable}>
              {index > 0 && <s-divider />}
              <div className={productPageBundleStyles.discountVariableRow}>
                <s-text color="subdued">{description}</s-text>
                <span className={productPageBundleStyles.discountVariableCode}>
                  {variable}
                </span>
              </div>
            </div>
          ))}
        </div>
      </s-modal>
    </>
  );
}
