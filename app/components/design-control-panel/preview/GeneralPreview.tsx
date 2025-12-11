import { Text } from "@shopify/polaris";

interface GeneralPreviewProps {
  activeSubSection: string;
  emptyStateCardBgColor: string;
  emptyStateBorderStyle: string;
  emptyStateCardBorderColor: string;
  emptyStateTextColor: string;
  addToCartButtonBgColor: string;
  addToCartButtonTextColor: string;
  addToCartButtonBorderRadius: number;
  buttonAddToCartText: string;
  toastBgColor: string;
  toastTextColor: string;
}

export function GeneralPreview(props: GeneralPreviewProps) {
  const {
    activeSubSection,
    emptyStateCardBgColor,
    emptyStateBorderStyle,
    emptyStateCardBorderColor,
    emptyStateTextColor,
    addToCartButtonBgColor,
    addToCartButtonTextColor,
    addToCartButtonBorderRadius,
    buttonAddToCartText,
    toastBgColor,
    toastTextColor,
  } = props;

  // Empty State - Show 3 empty product cards
  if (activeSubSection === "emptyState") {
    const cardLabels = ["Select Socks", "Select Laces", "Select Cleaner"];

    return (
      <div style={{ textAlign: "center", position: "relative" }}>
        <Text as="h3" variant="headingLg" fontWeight="semibold">
          Empty State
        </Text>
        <div style={{ marginTop: "80px", display: "inline-block", position: "relative" }}>
          {/* 3 Empty Cards */}
          <div style={{ display: "flex", gap: "20px", justifyContent: "center", alignItems: "flex-start" }}>
            {cardLabels.map((label, index) => (
              <div key={index} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
                <div
                  style={{
                    width: "176px",
                    height: "233px",
                    backgroundColor: emptyStateCardBgColor,
                    border: `2.6px ${emptyStateBorderStyle} ${emptyStateCardBorderColor}`,
                    borderRadius: "12px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "16px",
                    padding: "20px",
                    position: "relative",
                  }}
                >
                  {/* Plus icon */}
                  <svg width="69" height="69" viewBox="0 0 69 69" fill="none">
                    <line x1="34.5" y1="15" x2="34.5" y2="54" stroke={emptyStateTextColor} strokeWidth="4" strokeLinecap="round"/>
                    <line x1="15" y1="34.5" x2="54" y2="34.5" stroke={emptyStateTextColor} strokeWidth="4" strokeLinecap="round"/>
                  </svg>
                </div>

                {/* Label below card */}
                <Text as="p" variant="bodyLg" fontWeight="bold" tone="subdued">
                  {label}
                </Text>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Add to Cart Button - Show large button
  if (activeSubSection === "addToCartButton") {
    return (
      <div style={{ textAlign: "center", position: "relative" }}>
        <Text as="h3" variant="headingLg" fontWeight="semibold">
          Add to Cart Button
        </Text>
        <div style={{ marginTop: "80px", display: "inline-block", position: "relative" }}>
          {/* Add to Cart Button Preview */}
          <button
            style={{
              backgroundColor: addToCartButtonBgColor,
              color: addToCartButtonTextColor,
              width: "578px",
              height: "87px",
              borderRadius: `${addToCartButtonBorderRadius}px`,
              fontSize: "34px",
              fontWeight: "bold",
              border: "none",
              cursor: "pointer",
              position: "relative",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {buttonAddToCartText || "Add to Cart"}
          </button>
        </div>
      </div>
    );
  }

  // Toasts - Only show the toast notification
  if (activeSubSection === "toasts") {
    return (
      <div style={{ maxWidth: "600px", width: "100%", textAlign: "center", marginTop: "80px" }}>
        <div
          style={{
            backgroundColor: toastBgColor,
            color: toastTextColor,
            width: "495px",
            height: "81px",
            borderRadius: "11px",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
            position: "relative",
          }}
        >
          <span style={{ fontSize: "24px", fontWeight: 500 }}>
            Add at least 1 product on this step
          </span>
        </div>
        <div style={{ marginTop: "40px" }}>
          <Text as="p" variant="bodySm" tone="subdued">
            Preview updates as you customize
          </Text>
        </div>
      </div>
    );
  }

  return null;
}
