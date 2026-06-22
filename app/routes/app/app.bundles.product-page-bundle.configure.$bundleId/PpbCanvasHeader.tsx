import { usePpbConfigureContext } from "./PpbConfigureContext";

export function PpbCanvasHeader() {
  const {
    UnlistedBundleBanner,
    bundle,
    bundleProduct,
    fetcher,
    handleBackClick,
    handlePreviewBundle,
    loadedBundleProduct,
    openProductInAdmin,
    parentProductStatusUi,
    productPageBundleStyles,
    readinessClassName,
    readinessScore,
    setReadinessOpen,
    shop,
  } = usePpbConfigureContext();

  return (
    <>
      <div className={productPageBundleStyles.canvasHeader}>
        <div className={productPageBundleStyles.canvasTitleGroup}>
          <div className={productPageBundleStyles.canvasTitleRow}>
            <button
              type="button"
              className={productPageBundleStyles.canvasBackButton}
              onClick={handleBackClick}
              aria-label="Back to dashboard"
            >
              ←
            </button>
            <h1 className={productPageBundleStyles.canvasTitle}>
              Configure Bundle Flow
            </h1>
          </div>
        </div>
        <div className={productPageBundleStyles.canvasActions}>
          <button
            type="button"
            className={`${productPageBundleStyles.readinessButton} ${readinessClassName}`}
            onClick={() => setReadinessOpen(true)}
          >
            <span className={productPageBundleStyles.readinessScore}>
              {readinessScore}
            </span>
            <span className={productPageBundleStyles.readinessLabel}>
              Readiness Score
            </span>
          </button>
          <s-button
            variant="secondary"
            icon="view"
            onClick={() => {
              void handlePreviewBundle();
            }}
            disabled={fetcher.state !== "idle"}
          >
            Preview Bundle
          </s-button>
        </div>
      </div>
      {parentProductStatusUi.showUnlistedBanner && (
        <UnlistedBundleBanner
          shop={shop}
          bundleProductId={
            loadedBundleProduct?.id ?? (bundle as any).shopifyProductId ?? null
          }
          onManage={() => {
            const productId =
              bundleProduct?.legacyResourceId ||
              bundleProduct?.id?.split("/").pop() ||
              (bundle as any).shopifyProductId?.split("/").pop();
            if (productId) openProductInAdmin(productId);
          }}
        />
      )}
    </>
  );
}
