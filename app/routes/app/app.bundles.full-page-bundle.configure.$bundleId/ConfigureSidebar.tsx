import type { ConfigureBundleFlowContext } from "./useConfigureBundleFlow";

export function ConfigureSidebar({
  flow,
}: {
  flow: ConfigureBundleFlowContext;
}) {
  const {
    activeSection,
    appEmbedEnabled,
    bundle,
    bundleProduct,
    bundleSetupItems,
    bundleVisibilityChildItems,
    formState,
    fullPageBundleStyles,
    handleBundleProductSelect,
    handleSectionChange,
    handleSyncProduct,
    openProductInAdmin,
    openSelectTemplateModal,
    parentProductStatusUi,
    pricingState,
    productImageUrl,
    productMenuOpen,
    productTitle,
    selectTemplateOpenButtonRef,
    setProductMenuOpen,
    stepSetupChildItems,
    upsellWidgetEnabled,
    VisibilityBadge,
  } = flow;

  return (
    <>
      <div className={fullPageBundleStyles.leftColumn}>
        <s-stack direction="block" gap="base">
          <s-section>
            <s-stack direction="block" gap="small">
              <div className={fullPageBundleStyles.leftCardHeader}>
                <h3 className={fullPageBundleStyles.leftCardTitle}>
                  Bundle Product
                </h3>
                <div className={fullPageBundleStyles.productMenuWrapper}>
                  <button
                    type="button"
                    className={fullPageBundleStyles.productMenuBtn}
                    aria-label="Bundle product options"
                    onClick={() => setProductMenuOpen((o) => !o)}
                  >
                    <s-icon type="menu-vertical" />
                  </button>
                  {productMenuOpen && (
                    <>
                      <div
                        className={fullPageBundleStyles.productMenuBackdrop}
                        onClick={() => setProductMenuOpen(false)}
                      />
                      <div className={fullPageBundleStyles.productMenuDropdown}>
                        <button
                          type="button"
                          className={
                            fullPageBundleStyles.productMenuDropdownItem
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
                            fullPageBundleStyles.productMenuDropdownItem
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
              <div className={fullPageBundleStyles.bundleProductPanel}>
                <div className={fullPageBundleStyles.bundleProductSummary}>
                  <div className={fullPageBundleStyles.bundleProductIconTile}>
                    {productImageUrl ? (
                      <img
                        src={productImageUrl}
                        alt=""
                        className={fullPageBundleStyles.bundleProductIconImage}
                      />
                    ) : (
                      <s-icon type="product" />
                    )}
                  </div>
                  <span className={fullPageBundleStyles.bundleProductName}>
                    {productTitle ||
                      bundleProduct?.title ||
                      formState.bundleName ||
                      "Bundle Product"}
                  </span>
                </div>
                <button
                  type="button"
                  className={fullPageBundleStyles.bundleProductEditButton}
                  onClick={() => {
                    const productId =
                      bundleProduct?.legacyResourceId ||
                      bundleProduct?.id?.split("/").pop() ||
                      bundle.shopifyProductId?.split("/").pop();
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
              <div className={fullPageBundleStyles.parentProductStatus}>
                <span>Parent Product Status</span>
                <s-badge tone={parentProductStatusUi.tone}>
                  {parentProductStatusUi.label}
                </s-badge>
              </div>
            </s-stack>
          </s-section>
          <s-section>
            <s-stack direction="block" gap="small">
              <h3 className={fullPageBundleStyles.leftCardTitle}>
                Bundle Setup
              </h3>
              <p className={fullPageBundleStyles.leftCardSubtitle}>
                Set-up your bundle builder
              </p>
              <div className={fullPageBundleStyles.setupNavList}>
                {bundleSetupItems
                  .filter(
                    (item) =>
                      !item.fullPageOnly || bundle.bundleType === "full_page",
                  )
                  .map((item) => {
                    const isActive =
                      activeSection === item.id ||
                      (item.id === "step_setup" &&
                        activeSection === "free_gift_addons") ||
                      (item.id === "bundle_visibility" &&
                        activeSection === "bundle_widget");
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
                          className={`${fullPageBundleStyles.setupNavItem} ${isActive ? fullPageBundleStyles.setupNavItemActive : ""}`}
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
                            className={fullPageBundleStyles.setupNavIcon}
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
                          <span className={fullPageBundleStyles.setupNavLabel}>
                            {item.label}
                          </span>
                          <span className={fullPageBundleStyles.setupNavMeta}>
                            {statusBadge &&
                              (statusBadge.label === "Pending" ||
                              statusBadge.label === "Optimised" ? (
                                <VisibilityBadge
                                  isOptimised={
                                    statusBadge.label === "Optimised"
                                  }
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
                        {item.id === "step_setup" &&
                          (activeSection === "step_setup" ||
                            activeSection === "free_gift_addons") && (
                            <div className={fullPageBundleStyles.subNav}>
                              {stepSetupChildItems.map((child) => (
                                <button
                                  key={child.id}
                                  type="button"
                                  className={`${fullPageBundleStyles.subNavItem} ${activeSection === child.id ? fullPageBundleStyles.subNavItemActive : ""}`}
                                  onClick={() => {
                                    if (child.id === "free_gift_addons")
                                      handleSectionChange("free_gift_addons");
                                  }}
                                >
                                  {child.label}
                                </button>
                              ))}
                            </div>
                          )}
                        {item.id === "bundle_visibility" &&
                          (activeSection === "bundle_visibility" ||
                            activeSection === "bundle_widget") && (
                            <div className={fullPageBundleStyles.subNav}>
                              {bundleVisibilityChildItems.map((child) => (
                                <button
                                  key={child.id}
                                  type="button"
                                  className={`${fullPageBundleStyles.subNavItem} ${activeSection === child.id ? fullPageBundleStyles.subNavItemActive : ""}`}
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
        </s-stack>
      </div>
    </>
  );
}
