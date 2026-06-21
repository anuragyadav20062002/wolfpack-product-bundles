import { usePpbConfigureContext } from "./PpbConfigureContext";

export function PpbPageSelectionModal() {
  const {
    availablePages,
    closePageSelectionModal,
    handlePageSelection,
    isPageSelectionModalOpen,
  } = usePpbConfigureContext();

  return (
    <>
      {/* Page Selection Modal */}
      {isPageSelectionModalOpen && (
        <div
          role="presentation"
          onClick={closePageSelectionModal}
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
            aria-labelledby="product-page-template-modal-title"
            onClick={(event) => event.stopPropagation()}
            style={{
              width: "min(520px, calc(100vw - 40px))",
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
                id="product-page-template-modal-title"
                style={{
                  margin: 0,
                  fontSize: 14,
                  fontWeight: 650,
                  color: "#202223",
                }}
              >
                Select Product Page Template
              </h2>
              <button
                type="button"
                aria-label="Close"
                onClick={closePageSelectionModal}
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
                  cursor: "pointer",
                  fontSize: 18,
                  lineHeight: 1,
                }}
              >
                ×
              </button>
            </div>
            {availablePages.length > 0 ? (
              <div>
                {availablePages.map((template) => (
                  <button
                    key={template.id ?? template.handle ?? template.title}
                    type="button"
                    onClick={() => handlePageSelection(template)}
                    style={{
                      appearance: "none",
                      background: "transparent",
                      border: 0,
                      borderBottom: "1px solid #ebebeb",
                      color: "#202223",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      fontSize: 14,
                      fontWeight: 600,
                      minHeight: 48,
                      padding: "0 14px",
                      textAlign: "left",
                      width: "100%",
                    }}
                  >
                    <span>{template.title}</span>
                    <span
                      aria-hidden="true"
                      style={{
                        color: "#202223",
                        fontSize: 20,
                        lineHeight: 1,
                      }}
                    >
                      ›
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <div
                style={{
                  padding: 24,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <p
                  style={{
                    margin: 0,
                    fontSize: 14,
                    color: "#6d7175",
                    textAlign: "center",
                  }}
                >
                  No templates available
                </p>
                <s-button href="https://admin.shopify.com/admin/pages">
                  Create Page
                </s-button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
