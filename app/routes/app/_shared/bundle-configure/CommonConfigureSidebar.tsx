import type { Ref } from "react";
import type { ConfigureChildItem } from "../../../../lib/bundle-config/common-configure-page-model";

type StatusBadge = { label: string; tone?: string } | null;
type CommonSetupItem = ConfigureChildItem & {
  iconType?: string;
  fullPageOnly?: boolean;
};

export interface CommonConfigureSidebarAdapter {
  activeSection: string;
  appEmbedEnabled: boolean;
  bundle: {
    bundleType?: string | null;
    shopifyProductId?: string | null;
  };
  bundleProduct?: {
    id?: string | null;
    legacyResourceId?: string | null;
    title?: string | null;
  } | null;
  bundleSetupItems: CommonSetupItem[];
  bundleVisibilityChildItems: ConfigureChildItem[];
  formState: { bundleName?: string | null };
  handleBundleProductSelect: () => void | Promise<void>;
  handleSectionChange: (section: string) => void;
  handleSyncProduct: () => void;
  openProductInAdmin: (productId: string) => void;
  openSelectTemplateModal: () => void;
  parentProductStatusUi: { label: string; tone?: string };
  pricingState: any;
  productImageUrl?: string | null;
  productMenuOpen: boolean;
  productTitle?: string | null;
  selectTemplateOpenButtonRef?: Ref<HTMLButtonElement>;
  setProductMenuOpen: (updater: boolean | ((open: boolean) => boolean)) => void;
  stepSetupChildItems?: ConfigureChildItem[];
  styles: Record<string, string>;
  VisibilityBadge: (props: { isOptimised: boolean }) => JSX.Element;
  liveCard?: {
    title: string;
    label: string;
    actionLabel: string;
    loading?: boolean;
    disabled?: boolean;
    onAction: () => void;
  };
}

function getProductId(adapter: CommonConfigureSidebarAdapter) {
  return (
    adapter.bundleProduct?.legacyResourceId ||
    adapter.bundleProduct?.id?.split("/").pop() ||
    adapter.bundle.shopifyProductId?.split("/").pop() ||
    null
  );
}

function isItemActive(
  item: CommonSetupItem,
  adapter: CommonConfigureSidebarAdapter,
) {
  const { activeSection } = adapter;
  if (activeSection === item.id) return true;
  if (
    item.id === "step_setup" &&
    adapter.stepSetupChildItems?.some((child) => child.id === activeSection)
  ) {
    return true;
  }
  if (
    item.id === "bundle_visibility" &&
    adapter.bundleVisibilityChildItems.some((child) => child.id === activeSection)
  ) {
    return true;
  }
  return false;
}

function getItemStatusBadge(
  item: CommonSetupItem,
  adapter: CommonConfigureSidebarAdapter,
): StatusBadge {
  if (item.id === "discount_pricing" && !adapter.pricingState.discountEnabled) {
    return { label: "None" };
  }
  if (item.id === "bundle_visibility") {
    return adapter.appEmbedEnabled
      ? { label: "Optimised", tone: "success" }
      : { label: "Pending", tone: "warning" };
  }
  return null;
}

function renderStatusBadge(
  statusBadge: StatusBadge,
  VisibilityBadge: CommonConfigureSidebarAdapter["VisibilityBadge"],
) {
  if (!statusBadge) return null;
  if (statusBadge.label === "Pending" || statusBadge.label === "Optimised") {
    return <VisibilityBadge isOptimised={statusBadge.label === "Optimised"} />;
  }
  return <s-badge tone={(statusBadge.tone as any) || "subdued"}>{statusBadge.label}</s-badge>;
}

export function CommonConfigureSidebar({
  adapter,
}: {
  adapter: CommonConfigureSidebarAdapter;
}) {
  const {
    activeSection,
    bundleProduct,
    bundleSetupItems,
    bundleVisibilityChildItems,
    formState,
    handleBundleProductSelect,
    handleSectionChange,
    handleSyncProduct,
    liveCard,
    openProductInAdmin,
    openSelectTemplateModal,
    parentProductStatusUi,
    productImageUrl,
    productMenuOpen,
    productTitle,
    selectTemplateOpenButtonRef,
    setProductMenuOpen,
    stepSetupChildItems = [],
    styles,
    VisibilityBadge,
  } = adapter;

  return (
    <div className={styles.leftColumn}>
      <s-stack direction="block" gap="base">
        <s-section>
          <s-stack direction="block" gap="small">
            <div className={styles.leftCardHeader}>
              <h3 className={styles.leftCardTitle}>Bundle Product</h3>
              <div className={styles.productMenuWrapper}>
                <button
                  type="button"
                  className={styles.productMenuBtn}
                  aria-label="Bundle product options"
                  onClick={() => setProductMenuOpen((open) => !open)}
                >
                  <s-icon type="menu-vertical" />
                </button>
                {productMenuOpen && (
                  <>
                    <div
                      className={styles.productMenuBackdrop}
                      onClick={() => setProductMenuOpen(false)}
                    />
                    <div className={styles.productMenuDropdown}>
                      <button
                        type="button"
                        className={styles.productMenuDropdownItem}
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
                        className={styles.productMenuDropdownItem}
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
            <div className={styles.bundleProductPanel}>
              <div className={styles.bundleProductSummary}>
                <div className={styles.bundleProductIconTile}>
                  {productImageUrl ? (
                    <img
                      src={productImageUrl}
                      alt=""
                      className={styles.bundleProductIconImage}
                    />
                  ) : (
                    <s-icon type="product" />
                  )}
                </div>
                <span className={styles.bundleProductName}>
                  {productTitle ||
                    bundleProduct?.title ||
                    formState.bundleName ||
                    "Bundle Product"}
                </span>
              </div>
              <button
                type="button"
                className={styles.bundleProductEditButton}
                onClick={() => {
                  const productId = getProductId(adapter);
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
            <div className={styles.parentProductStatus}>
              <span>Parent Product Status</span>
              <s-badge tone={parentProductStatusUi.tone as any}>
                {parentProductStatusUi.label}
              </s-badge>
            </div>
            <s-text tone="neutral">
              Change product discoverability through Edit Product in Shopify Admin.
            </s-text>
          </s-stack>
        </s-section>

        <s-section>
          <s-stack direction="block" gap="small">
            <h3 className={styles.leftCardTitle}>Bundle Setup</h3>
            <p className={styles.leftCardSubtitle}>Set-up your bundle builder</p>
            <div className={styles.setupNavList}>
              {bundleSetupItems.map((item) => {
                const isActive = isItemActive(item, adapter);
                const statusBadge = getItemStatusBadge(item, adapter);
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
                      className={`${styles.setupNavItem} ${isActive ? styles.setupNavItemActive : ""}`}
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
                      <span className={styles.setupNavIcon} aria-hidden="true">
                        {item.iconType ? (
                          <s-icon type={item.iconType as any} />
                        ) : isActive ? (
                          "●"
                        ) : (
                          "○"
                        )}
                      </span>
                      <span className={styles.setupNavLabel}>{item.label}</span>
                      <span className={styles.setupNavMeta}>
                        {renderStatusBadge(statusBadge, VisibilityBadge)}
                      </span>
                    </button>
                    {item.id === "step_setup" &&
                      stepSetupChildItems.length > 0 &&
                      (activeSection === "step_setup" ||
                        stepSetupChildItems.some(
                          (child) => child.id === activeSection,
                        )) && (
                        <div className={styles.subNav}>
                          {stepSetupChildItems.map((child) => (
                            <button
                              key={child.id}
                              type="button"
                              className={`${styles.subNavItem} ${activeSection === child.id ? styles.subNavItemActive : ""}`}
                              onClick={() => handleSectionChange(child.id)}
                            >
                              {child.label}
                            </button>
                          ))}
                        </div>
                      )}
                    {item.id === "bundle_visibility" &&
                      (activeSection === "bundle_visibility" ||
                        bundleVisibilityChildItems.some(
                          (child) => child.id === activeSection,
                        )) && (
                        <div className={styles.subNav}>
                          {bundleVisibilityChildItems.map((child) => (
                            <button
                              key={child.id}
                              type="button"
                              className={`${styles.subNavItem} ${activeSection === child.id ? styles.subNavItemActive : ""}`}
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

        {liveCard && (
          <s-section>
            <s-stack direction="block" gap="small">
              <h3 className={styles.leftCardTitle}>{liveCard.title}</h3>
              <div className={styles.bundleLivePanel}>
                <span className={styles.bundleLivePlaceOnTheme}>
                  {liveCard.label}
                </span>
                <s-button
                  variant="secondary"
                  loading={liveCard.loading || undefined}
                  disabled={liveCard.disabled || undefined}
                  onClick={liveCard.onAction}
                >
                  {liveCard.actionLabel}
                </s-button>
              </div>
            </s-stack>
          </s-section>
        )}
      </s-stack>
    </div>
  );
}
