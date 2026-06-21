import { usePpbConfigureContext } from "./PpbConfigureContext";

export function PpbSelectedItemsModals() {
  const {
    DiscardChangesModal,
    closeDiscardModal,
    collectionsModalRef,
    currentModalStepId,
    handleCloseCollectionsModal,
    handleCloseProductsModal,
    handleConfirmDiscard,
    openProductInAdmin,
    productsModalRef,
    selectedCollections,
    showDiscardModal,
    stepsState,
  } = usePpbConfigureContext();

  return (
    <>
      {/* Selected Products Modal */}
      <s-modal ref={productsModalRef} heading="Selected Products">
        <s-stack direction="block" gap="base">
          {(() => {
            const currentStep = stepsState.steps.find(
              (step) => step.id === currentModalStepId,
            );
            const selectedProducts = currentStep?.StepProduct || [];
            return selectedProducts.length > 0 ? (
              <s-stack direction="block" gap="small">
                <span style={{ fontSize: 14, fontWeight: 500 }}>
                  {selectedProducts.length} product
                  {selectedProducts.length !== 1 ? "s" : ""} selected for this
                  step:
                </span>
                <s-section>
                  <ul style={{ margin: 0, paddingLeft: 20 }}>
                    {selectedProducts.map((product: any, index: number) => {
                      const productId =
                        product.productId || product.id?.split("/").pop();
                      return (
                        <li key={product.id || index}>
                          <s-stack
                            direction="inline"
                            gap="small-100"
                            justifyContent="space-between"
                            alignItems="center"
                          >
                            <s-stack
                              direction="inline"
                              gap="small"
                              alignItems="center"
                            >
                              <img
                                src={
                                  product.imageUrl ||
                                  product.image?.url ||
                                  "/bundle.png"
                                }
                                alt={product.title || product.name || "Product"}
                                style={{
                                  width: 40,
                                  height: 40,
                                  objectFit: "cover",
                                  borderRadius: 4,
                                }}
                              />
                              <s-stack direction="block">
                                <s-button
                                  variant="tertiary"
                                  onClick={() => {
                                    if (!productId) return;
                                    openProductInAdmin(productId);
                                  }}
                                  disabled={!productId || undefined}
                                >
                                  <s-icon type="view" />
                                  {product.title ||
                                    product.name ||
                                    "Unnamed Product"}
                                </s-button>
                                {product.variants &&
                                  product.variants.length > 0 && (
                                    <p
                                      style={{
                                        margin: 0,
                                        fontSize: 14,
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
                          </s-stack>
                        </li>
                      );
                    })}
                  </ul>
                </s-section>
              </s-stack>
            ) : (
              <s-stack direction="block" gap="small-100" alignItems="center">
                <p style={{ margin: 0, fontSize: 14, color: "#6d7175" }}>
                  No products selected for this step yet.
                </p>
              </s-stack>
            );
          })()}
        </s-stack>
        <s-button slot="primary-action" onClick={handleCloseProductsModal}>
          Close
        </s-button>
      </s-modal>
      {/* Selected Collections Modal */}
      <s-modal ref={collectionsModalRef} heading="Selected Collections">
        <s-stack direction="block" gap="base">
          {(() => {
            const collections = selectedCollections[currentModalStepId] || [];
            return collections.length > 0 ? (
              <s-stack direction="block" gap="small">
                <span style={{ fontSize: 14, fontWeight: 500 }}>
                  {collections.length} collection
                  {collections.length !== 1 ? "s" : ""} selected for this step:
                </span>
                <s-section>
                  <ul style={{ margin: 0, paddingLeft: 20 }}>
                    {collections.map((collection: any, index: number) => (
                      <li key={collection.id || index}>
                        <s-stack
                          direction="inline"
                          gap="small-100"
                          justifyContent="space-between"
                        >
                          <s-stack direction="block">
                            <span style={{ fontSize: 14, fontWeight: 500 }}>
                              {collection.title || "Unnamed Collection"}
                            </span>
                            {collection.handle && (
                              <p
                                style={{
                                  margin: 0,
                                  fontSize: 14,
                                  color: "#6d7175",
                                }}
                              >
                                Handle: {collection.handle}
                              </p>
                            )}
                          </s-stack>
                          <s-badge tone="success">Collection</s-badge>
                        </s-stack>
                      </li>
                    ))}
                  </ul>
                </s-section>
              </s-stack>
            ) : (
              <s-stack direction="block" gap="small-100" alignItems="center">
                <p style={{ margin: 0, fontSize: 14, color: "#6d7175" }}>
                  No collections selected for this step yet.
                </p>
              </s-stack>
            );
          })()}
        </s-stack>
        <s-button slot="primary-action" onClick={handleCloseCollectionsModal}>
          Close
        </s-button>
      </s-modal>
      <DiscardChangesModal
        open={showDiscardModal}
        onDiscard={handleConfirmDiscard}
        onContinue={closeDiscardModal}
      />
    </>
  );
}
