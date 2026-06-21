import type { ConfigureBundleFlowContext } from "./useConfigureBundleFlow";

export function ConfigureCanvasHeader({
  flow,
}: {
  flow: ConfigureBundleFlowContext;
}) {
  const {
    AppEmbedBanner,
    appEmbedEnabled,
    bundle,
    bundleProduct,
    fetcher,
    fullPageBundleStyles,
    handleBackClick,
    handlePreviewBundle,
    openProductInAdmin,
    parentProductStatusUi,
    readinessClassName,
    readinessScore,
    setReadinessOpen,
    shop,
    suppressTopAppEmbedBannerForVisibility,
    themeEditorUrl,
    UnlistedBundleBanner,
  } = flow;

  return (
    <>
      <div className={fullPageBundleStyles.canvasHeader}>
        <div className={fullPageBundleStyles.canvasTitleGroup}>
          <div className={fullPageBundleStyles.canvasTitleRow}>
            <button
              type="button"
              className={fullPageBundleStyles.canvasBackButton}
              onClick={handleBackClick}
              aria-label="Back to dashboard"
            >
              ←
            </button>
            <h1 className={fullPageBundleStyles.canvasTitle}>
              Configure Bundle Flow
            </h1>
          </div>
        </div>
        <div className={fullPageBundleStyles.canvasActions}>
          <button
            type="button"
            className={`${fullPageBundleStyles.readinessButton} ${readinessClassName}`}
            onClick={() => setReadinessOpen(true)}
          >
            <span className={fullPageBundleStyles.readinessScore}>
              {readinessScore}
            </span>
            <span className={fullPageBundleStyles.readinessLabel}>
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
      {!suppressTopAppEmbedBannerForVisibility && (
        <AppEmbedBanner
          appEmbedEnabled={appEmbedEnabled}
          themeEditorUrl={themeEditorUrl}
        />
      )}
      {parentProductStatusUi.showUnlistedBanner && (
        <UnlistedBundleBanner
          shop={shop}
          bundleProductId={bundleProduct?.id ?? bundle.shopifyProductId ?? null}
          onManage={() => {
            const productId =
              bundleProduct?.legacyResourceId ||
              bundleProduct?.id?.split("/").pop() ||
              bundle.shopifyProductId?.split("/").pop();
            if (productId) openProductInAdmin(productId);
          }}
        />
      )}
    </>
  );
}
