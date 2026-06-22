import { usePpbConfigureContext } from "./PpbConfigureContext";

export function PpbConfigureSidebar() {
  const {
    VisibilityBadge,
    activeSection,
    appEmbedEnabled,
    bundle,
    bundleProduct,
    bundleSetupItems,
    bundleVisibilityChildItems,
    formState,
    handleBundleProductSelect,
    handlePlaceWidget,
    handleSectionChange,
    handleSyncProduct,
    isPreparingPlacementTemplates,
    openProductInAdmin,
    openSelectTemplateModal,
    parentProductStatusUi,
    pricingState,
    productImageUrl,
    productMenuOpen,
    productPageBundleStyles,
    productTitle,
    selectTemplateOpenButtonRef,
    setProductMenuOpen,
  } = usePpbConfigureContext();

  return (
    <>
      {/* Left Sidebar */}
      <div className={productPageBundleStyles.leftColumn}>
        <s-stack direction="block" gap="base">
          {/* Bundle Product Card */}
          <s-section>
            <s-stack direction="block" gap="small">
              <div className={productPageBundleStyles.leftCardHeader}>
                <h3 className={productPageBundleStyles.leftCardTitle}>
                  Bundle Product
                </h3>
                <div className={productPageBundleStyles.productMenuWrapper}>
                  <button
                    type="button"
                    className={productPageBundleStyles.productMenuBtn}
                    aria-label="Bundle product options"
                    onClick={() => setProductMenuOpen((o) => !o)}
                  >
                    <s-icon type="menu-vertical" />
                  </button>
                  {productMenuOpen && (
                    <>
                      <div
                        className={productPageBundleStyles.productMenuBackdrop}
                        onClick={() => setProductMenuOpen(false)}
                      />
                      <div
                        className={productPageBundleStyles.productMenuDropdown}
                      >
                        <button
                          type="button"
                          className={
                            productPageBundleStyles.productMenuDropdownItem
                          }
                          onClick={() => {
                            setProductMenuOpen(false);
                            void handleBundleProductSelect();
                          }}
                        >
                          <s-icon type="edit" />
                          <span>Replace Product</span>
                        </button>
                        <button
                          type="button"
                          className={
                            productPageBundleStyles.productMenuDropdownItem
                          }
                          onClick={() => {
                            setProductMenuOpen(false);
                            handleSyncProduct();
                          }}
                        >
                          <s-icon type="duplicate" />
                          <span>Sync Product</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
              <div className={productPageBundleStyles.bundleProductPanel}>
                <div className={productPageBundleStyles.bundleProductSummary}>
                  <div
                    className={productPageBundleStyles.bundleProductIconTile}
                  >
                    {productImageUrl ? (
                      <img
                        src={productImageUrl}
                        alt=""
                        className={
                          productPageBundleStyles.bundleProductIconImage
                        }
                      />
                    ) : (
                      <s-icon type="product" />
                    )}
                  </div>
                  <span className={productPageBundleStyles.bundleProductName}>
                    {productTitle ||
                      bundleProduct?.title ||
                      formState.bundleName ||
                      "Bundle Product"}
                  </span>
                </div>
                <button
                  type="button"
                  className={productPageBundleStyles.bundleProductEditButton}
                  onClick={() => {
                    const productId =
                      bundleProduct?.legacyResourceId ||
                      bundleProduct?.id?.split("/").pop() ||
                      (bundle as any).shopifyProductId?.split("/").pop();
                    if (!productId) {
                      void handleBundleProductSelect();
                      return;
                    }
                    openProductInAdmin(productId);
                  }}
                >
                  <s-icon type="edit" /> <span>Edit Product</span>
                </button>
              </div>
              <div className={productPageBundleStyles.parentProductStatus}>
                <span>Parent Product Status</span>
                <s-badge tone={parentProductStatusUi.tone}>
                  {parentProductStatusUi.label}
                </s-badge>
              </div>
            </s-stack>
          </s-section>
          {/* Bundle Setup Navigation Card */}
          <s-section>
            <s-stack direction="block" gap="small">
              <h3 className={productPageBundleStyles.leftCardTitle}>
                Bundle Setup
              </h3>
              <p className={productPageBundleStyles.leftCardSubtitle}>
                Set-up your bundle builder
              </p>
              <div className={productPageBundleStyles.setupNavList}>
                {bundleSetupItems.map((item) => {
                  const isActive =
                    activeSection === item.id ||
                    (item.id === "bundle_visibility" &&
                      (activeSection === "bundle_widget" ||
                        activeSection === "bundle_embed"));
                  let statusBadge: { label: string; tone?: string } | null =
                    null;
                  if (item.id === "discount_pricing") {
                    statusBadge = pricingState.discountEnabled
                      ? null
                      : { label: "None" };
                  }
                  if (item.id === "bundle_visibility") {
                    statusBadge = appEmbedEnabled
                      ? { label: "Optimised", tone: "success" }
                      : { label: "Pending", tone: "warning" };
                  }
                  return (
                    <div key={item.id}>
                      {item.id === "select_template" && (
                        <hr
                          style={{
                            margin: "8px 0",
                            border: "none",
                            borderTop: "1px solid #e1e3e5",
                          }}
                        />
                      )}
                      <button
                        type="button"
                        className={`${productPageBundleStyles.setupNavItem} ${isActive ? productPageBundleStyles.setupNavItemActive : ""}`}
                        onClick={() => {
                          if (item.id === "select_template") {
                            openSelectTemplateModal();
                          } else {
                            handleSectionChange(item.id);
                          }
                        }}
                        ref={
                          item.id === "select_template"
                            ? selectTemplateOpenButtonRef
                            : undefined
                        }
                      >
                        <span
                          className={productPageBundleStyles.setupNavIcon}
                          aria-hidden="true"
                        >
                          {item.iconType ? (
                            <s-icon type={item.iconType as any} />
                          ) : isActive ? (
                            "●"
                          ) : (
                            "○"
                          )}
                        </span>
                        <span className={productPageBundleStyles.setupNavLabel}>
                          {item.label}
                        </span>
                        <span className={productPageBundleStyles.setupNavMeta}>
                          {statusBadge &&
                            (statusBadge.label === "Pending" ||
                            statusBadge.label === "Optimised" ? (
                              <VisibilityBadge
                                isOptimised={statusBadge.label === "Optimised"}
                              />
                            ) : (
                              <s-badge
                                tone={(statusBadge.tone as any) || "subdued"}
                              >
                                {statusBadge.label}
                              </s-badge>
                            ))}
                        </span>
                      </button>
                      {item.id === "bundle_visibility" &&
                        (activeSection === "bundle_visibility" ||
                          activeSection === "bundle_widget" ||
                          activeSection === "bundle_embed") && (
                          <div className={productPageBundleStyles.subNav}>
                            {bundleVisibilityChildItems.map((child) => (
                              <button
                                key={child.id}
                                type="button"
                                className={`${productPageBundleStyles.subNavItem} ${activeSection === child.id ? productPageBundleStyles.subNavItemActive : ""}`}
                                onClick={() => handleSectionChange(child.id)}
                              >
                                {child.label}
                              </button>
                            ))}
                          </div>
                        )}
                    </div>
                  );
                })}
              </div>
            </s-stack>
          </s-section>
          {/* Take your bundle live card */}
          <s-section>
            <s-stack direction="block" gap="small">
              <h3 className={productPageBundleStyles.leftCardTitle}>
                Take your bundle live
              </h3>
              <div className={productPageBundleStyles.bundleLivePanel}>
                <span
                  className={productPageBundleStyles.bundleLivePlaceOnTheme}
                >
                  Place on theme
                </span>
                <s-button
                  variant="secondary"
                  loading={isPreparingPlacementTemplates || undefined}
                  disabled={isPreparingPlacementTemplates || undefined}
                  onClick={handlePlaceWidget}
                >
                  Place Widget
                </s-button>
              </div>
            </s-stack>
          </s-section>
        </s-stack>
      </div>
    </>
  );
}
