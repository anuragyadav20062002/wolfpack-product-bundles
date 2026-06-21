import type { ConfigureBundleFlowContext } from "../useConfigureBundleFlow";

export function FpbSelectedItemsModals({
  flow,
}: {
  flow: ConfigureBundleFlowContext;
}) {
  const {
    ADDON_TEMPLATE_VARIABLES,
    addonDraft,
    addonSelectedProductsModalRef,
    addonSelectedProductsTierIndex,
    addonVariablesModalRef,
    bundle,
    collectionsModalRef,
    createDefaultAddonDraftTier,
    currentModalStepId,
    disableAddonStepModalRef,
    discountVariablesModalRef,
    fullPageBundleStyles,
    handleAddonSelectedProductAdd,
    handleAddonSelectedProductRemove,
    handleCloseAddonSelectedProductsModal,
    handleCloseCollectionsModal,
    handleCloseProductsModal,
    handleDisableAddonStepConfirm,
    hidePolarisModal,
    openProductInAdmin,
    productsModalRef,
    selectedCollections,
    setIsDisableAddonStepModalOpen,
    stepsState,
    TEMPLATE_VARIABLES,
    templateVariablesModalRef,
  } = flow;

  return (
    <>
      {/* Selected Products Modal */}
      <s-modal ref={productsModalRef} heading="Selected products">
        {(() => {
          const currentStep = stepsState.steps.find(
            (step) => step.id === currentModalStepId,
          );
          const selectedProducts = currentStep?.StepProduct || [];
          return selectedProducts.length > 0 ? (
            <s-stack direction="block" gap="small">
              <p style={{ margin: 0, fontSize: 14, fontWeight: 500 }}>
                {selectedProducts.length} product
                {selectedProducts.length !== 1 ? "s" : ""} selected in this
                step.
              </p>
              <ul
                style={{
                  margin: 0,
                  padding: 0,
                  listStyle: "none",
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                {selectedProducts.map((product: any, index: number) => {
                  const productId =
                    product.productId || product.id?.split("/").pop();
                  return (
                    <li
                      key={product.id || index}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: 8,
                        padding: "8px 0",
                        borderBottom: "1px solid #f1f2f3",
                      }}
                    >
                      <s-stack direction="inline" gap="small">
                        <img
                          src={
                            product.imageUrl ||
                            product.image?.url ||
                            "/bundle.png"
                          }
                          alt={product.title || "Product"}
                          style={{
                            width: 40,
                            height: 40,
                            objectFit: "cover",
                            borderRadius: 4,
                          }}
                        />
                        <s-stack direction="block" gap="small-400">
                          <s-button
                            variant="tertiary"
                            onClick={() => {
                              if (!productId) return;
                              openProductInAdmin(productId);
                            }}
                            disabled={!productId || undefined}
                          >
                            {product.title || product.name || "Unnamed Product"}
                          </s-button>
                          {product.variants && product.variants.length > 0 && (
                            <p
                              style={{
                                margin: 0,
                                fontSize: 12,
                                color: "#6d7175",
                              }}
                            >
                              {product.variants.length} variant
                              {product.variants.length !== 1 ? "s" : ""}
                              available
                            </p>
                          )}
                        </s-stack>
                      </s-stack>
                      <s-badge tone="info">Product</s-badge>
                    </li>
                  );
                })}
              </ul>
            </s-stack>
          ) : (
            <p style={{ margin: 0, fontSize: 14, color: "#6d7175" }}>
              No products selected for this step yet.
            </p>
          );
        })()}
        <s-button slot="primary-action" onClick={handleCloseProductsModal}>
          Close
        </s-button>
      </s-modal>
      <s-modal
        id="addon-selected-products-modal"
        ref={addonSelectedProductsModalRef}
        heading="Selected Products"
      >
        {(() => {
          const addonTiers = Array.isArray(addonDraft.addonTiers)
            ? addonDraft.addonTiers
            : [createDefaultAddonDraftTier()];
          const tierIndex = addonSelectedProductsTierIndex ?? 0;
          const tier = addonTiers[tierIndex] ?? addonTiers[0];
          const selectedAddonProducts = Array.isArray(
            tier?.selectedAddonProducts,
          )
            ? tier.selectedAddonProducts
            : [];
          return selectedAddonProducts.length > 0 ? (
            <s-stack direction="block" gap="small">
              <ul className={fullPageBundleStyles.addonSelectedProductList}>
                {selectedAddonProducts.map((product: any, index: number) => (
                  <li
                    key={product.graphqlId || product.id || index}
                    className={fullPageBundleStyles.addonSelectedProductRow}
                  >
                    <button
                      type="button"
                      className={fullPageBundleStyles.addonSelectedProductDrag}
                      aria-label={`Reorder ${product.title || "selected product"}`}
                    >
                      ::
                    </button>
                    <span
                      className={fullPageBundleStyles.addonSelectedProductName}
                    >
                      {product.title || product.name || "Unnamed Product"}
                    </span>
                    <button
                      type="button"
                      className={
                        fullPageBundleStyles.addonSelectedProductRemove
                      }
                      aria-label={`Remove ${product.title || "selected product"}`}
                      onClick={() =>
                        handleAddonSelectedProductRemove(tierIndex, index)
                      }
                    >
                      x
                    </button>
                  </li>
                ))}
              </ul>
            </s-stack>
          ) : (
            <p style={{ margin: 0, fontSize: 14, color: "#6d7175" }}>
              No products selected for this tier yet.
            </p>
          );
        })()}
        <s-button
          slot="secondary-actions"
          variant="secondary"
          commandFor="addon-selected-products-modal"
          command="--hide"
          onClick={handleCloseAddonSelectedProductsModal}
        >
          Close
        </s-button>
        <s-button
          slot="primary-action"
          variant="primary"
          onClick={() =>
            handleAddonSelectedProductAdd(addonSelectedProductsTierIndex ?? 0, {
              reopenSelectedProductsModal: true,
            })
          }
        >
          Add Products
        </s-button>
      </s-modal>
      {/* Selected Collections Modal */}
      <s-modal ref={collectionsModalRef} heading="Selected collections">
        {(() => {
          const collections = selectedCollections[currentModalStepId] || [];
          return collections.length > 0 ? (
            <s-stack direction="block" gap="small">
              <p style={{ margin: 0, fontSize: 14, fontWeight: 500 }}>
                {collections.length} collection
                {collections.length !== 1 ? "s" : ""} selected in this step.
              </p>
              <ul
                style={{
                  margin: 0,
                  padding: 0,
                  listStyle: "none",
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                {collections.map((collection: any, index: number) => (
                  <li
                    key={collection.id || index}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 8,
                      padding: "8px 0",
                      borderBottom: "1px solid #f1f2f3",
                    }}
                  >
                    <s-stack direction="block" gap="small-400">
                      <span style={{ fontSize: 14, fontWeight: 500 }}>
                        {collection.title || "Unnamed Collection"}
                      </span>
                      {collection.handle && (
                        <p
                          style={{ margin: 0, fontSize: 12, color: "#6d7175" }}
                        >
                          Handle: {collection.handle}
                        </p>
                      )}
                    </s-stack>
                    <s-badge tone="success">Collection</s-badge>
                  </li>
                ))}
              </ul>
            </s-stack>
          ) : (
            <p style={{ margin: 0, fontSize: 14, color: "#6d7175" }}>
              No collections selected for this step yet.
            </p>
          );
        })()}
        <s-button slot="primary-action" onClick={handleCloseCollectionsModal}>
          Close
        </s-button>
      </s-modal>
      {/* Template Variables Modal */}
      <s-modal
        id="template-variables-modal"
        ref={templateVariablesModalRef}
        heading="Message variables"
        size="small"
      >
        <s-stack direction="block" gap="small">
          <p style={{ margin: 0, fontSize: 14, color: "#6d7175" }}>
            Use these variables in Wolfpack Bundles messages. The widget
            replaces them with live bundle and discount values.
          </p>
          <div className={fullPageBundleStyles.templateVariableGrid}>
            {TEMPLATE_VARIABLES.map(([variable, description]) => (
              <div
                key={variable}
                className={fullPageBundleStyles.templateVariableItem}
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
          commandFor="template-variables-modal"
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
          {TEMPLATE_VARIABLES.map(([variable, description], index) => (
            <div key={variable}>
              {index > 0 && <s-divider />}
              <div className={fullPageBundleStyles.discountVariableRow}>
                <s-text color="subdued">{description}</s-text>
                <span className={fullPageBundleStyles.discountVariableCode}>
                  {variable}
                </span>
              </div>
            </div>
          ))}
        </div>
      </s-modal>
      <s-modal
        id="addon-variables-modal"
        ref={addonVariablesModalRef}
        heading="Variables"
        size="base"
      >
        <div>
          {ADDON_TEMPLATE_VARIABLES.map(([variable, description], index) => (
            <div key={variable}>
              {index > 0 && <s-divider />}
              <div className={fullPageBundleStyles.discountVariableRow}>
                <s-text color="subdued">{description}</s-text>
                <span className={fullPageBundleStyles.discountVariableCode}>
                  {variable}
                </span>
              </div>
            </div>
          ))}
        </div>
      </s-modal>
      <s-modal
        id="disable-addon-step-modal"
        ref={disableAddonStepModalRef}
        heading="Disable Personalization Step"
        size="small"
      >
        <p style={{ margin: 0, fontSize: 14 }}>
          This will disable the add-ons step. Are you sure you want to disable?
        </p>
        <s-button
          slot="secondary-actions"
          onClick={() => setIsDisableAddonStepModalOpen(false)}
        >
          Cancel
        </s-button>
        <s-button
          slot="primary-action"
          variant="primary"
          onClick={handleDisableAddonStepConfirm}
        >
          Yes
        </s-button>
      </s-modal>
    </>
  );
}
