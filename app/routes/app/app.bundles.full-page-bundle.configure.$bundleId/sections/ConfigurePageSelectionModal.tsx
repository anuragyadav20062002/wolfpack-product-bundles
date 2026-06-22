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
    handlePageSelectionBackdropClick,
    isInstallingWidget,
    isLoadingPages,
    isPageSelectionModalOpen,
    shopify,
  } = flow;

  return (
    <>
      {/* Page Selection Modal */}
      {isPageSelectionModalOpen && (
        <div
          role="presentation"
          onClick={handlePageSelectionBackdropClick}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0, 0, 0, 0.45)",
            padding: 20,
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="fpb-page-selection-modal-title"
            onClick={(event) => event.stopPropagation()}
            style={{
              width: "min(560px, calc(100vw - 40px))",
              overflow: "hidden",
              border: "1px solid #d9d9d9",
              borderRadius: 12,
              background: "#ffffff",
              boxShadow: "0 18px 48px rgba(0, 0, 0, 0.22)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                minHeight: 48,
                padding: "0 12px",
                borderBottom: "1px solid #ebebeb",
              }}
            >
              <h2
                id="fpb-page-selection-modal-title"
                style={{
                  margin: 0,
                  fontSize: 14,
                  fontWeight: 650,
                  color: "#202223",
                }}
              >
                Add Wolfpack Bundles to storefront
              </h2>
              <button
                type="button"
                aria-label="Close"
                onClick={closePageSelectionModal}
                disabled={isInstallingWidget}
                style={{
                  appearance: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 28,
                  height: 28,
                  border: "1px solid #d1d5db",
                  borderRadius: 8,
                  background: "#f3f4f6",
                  color: "#5f6368",
                  cursor: isInstallingWidget ? "not-allowed" : "pointer",
                  fontSize: 18,
                  lineHeight: 1,
                  opacity: isInstallingWidget ? 0.6 : 1,
                }}
              >
                ×
              </button>
            </div>
            <div style={{ padding: 16 }}>
              <p style={{ margin: "0 0 14px", fontSize: 14, color: "#6d7175" }}>
                {bundle.bundleType === "full_page"
                  ? "Select a page to place and preview the bundle."
                  : "Select a template to place and preview the bundle."}
              </p>
              {isLoadingPages ? (
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <s-spinner />
                  <p style={{ margin: 0, fontSize: 13, color: "#6d7175" }}>
                    {bundle.bundleType === "full_page"
                      ? "Loading pages..."
                      : "Loading templates..."}
                  </p>
                </div>
              ) : availablePages.length > 0 ? (
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 8 }}
                >
                  {availablePages.map((template) => (
                    <div
                      key={template.id || template.handle}
                      style={{
                        border: "1px solid #e1e3e5",
                        borderRadius: 8,
                        padding: 12,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: 12,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 4,
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                          }}
                        >
                          <span style={{ fontSize: 14, fontWeight: 500 }}>
                            {template.title}
                          </span>
                          {template.recommended && (
                            <s-badge tone="success">Bundle Product</s-badge>
                          )}
                        </div>
                        {template.description && (
                          <p
                            style={{
                              margin: 0,
                              fontSize: 13,
                              color: "#6d7175",
                            }}
                          >
                            {template.description}
                          </p>
                        )}
                      </div>
                      <s-button
                        variant={template.recommended ? "primary" : undefined}
                        loading={isInstallingWidget || undefined}
                        disabled={isInstallingWidget || undefined}
                        onClick={() => handlePageSelection(template)}
                      >
                        {isInstallingWidget ? "Adding..." : "Select"}
                      </s-button>
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 12 }}
                >
                  <p style={{ margin: 0, fontSize: 14, color: "#6d7175" }}>
                    {bundle.bundleType === "full_page"
                      ? "No pages available"
                      : "No templates available"}
                  </p>
                  <s-button
                    href="https://admin.shopify.com/admin/pages"
                    target="_blank"
                  >
                    Create page
                  </s-button>
                </div>
              )}
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 8,
                padding: "12px 16px",
                borderTop: "1px solid #ebebeb",
              }}
            >
              <s-button
                disabled={isInstallingWidget || undefined}
                onClick={closePageSelectionModal}
              >
                Cancel
              </s-button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
