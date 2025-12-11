import { Text } from "@shopify/polaris";
import { ArrowLabel } from "../common/ArrowLabel";

interface GeneralPreviewProps {
  activeSubSection: string;
  emptyStateCardBgColor: string;
  emptyStateBorderStyle: string;
  emptyStateCardBorderColor: string;
  emptyStateTextColor: string;
  addToCartButtonBgColor: string;
  addToCartButtonTextColor: string;
  buttonAddToCartText: string;
  toastBgColor: string;
  toastTextColor: string;
  filterBgColor: string;
  filterIconColor: string;
  filterTextColor: string;
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
    buttonAddToCartText,
    toastBgColor,
    toastTextColor,
    filterBgColor,
    filterIconColor,
    filterTextColor,
  } = props;

  // Empty State - Show 3 empty product cards
  if (activeSubSection === "emptyState") {
    return (
      <div style={{ textAlign: "center", position: "relative" }}>
        <Text as="h3" variant="headingLg" fontWeight="semibold">
          Empty State
        </Text>
        <div style={{ marginTop: "80px", display: "inline-block", position: "relative" }}>
          {/* 3 Empty Cards */}
          <div style={{ display: "flex", gap: "20px", justifyContent: "center" }}>
            {[1, 2, 3].map((index) => (
              <div
                key={index}
                style={{
                  width: "176px",
                  height: "233px",
                  backgroundColor: emptyStateCardBgColor,
                  border: `2px ${emptyStateBorderStyle} ${emptyStateCardBorderColor}`,
                  borderRadius: "8px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "12px",
                  padding: "20px",
                  position: "relative",
                }}
              >
                {/* Image placeholder icon */}
                <svg width="69" height="69" viewBox="0 0 69 69" fill="none">
                  <rect width="69" height="69" rx="8" fill={emptyStateTextColor} opacity="0.1"/>
                  <path d="M24.5 34.5L28.5 30.5L37.5 39.5L44.5 32.5" stroke={emptyStateTextColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.4"/>
                  <circle cx="40" cy="28" r="2.5" fill={emptyStateTextColor} opacity="0.4"/>
                </svg>

                {/* Text placeholder */}
                <div style={{ width: "100%", textAlign: "center" }}>
                  <div style={{ height: "10px", backgroundColor: emptyStateTextColor, opacity: 0.2, borderRadius: "4px", marginBottom: "8px" }} />
                  <div style={{ height: "8px", backgroundColor: emptyStateTextColor, opacity: 0.15, borderRadius: "4px", width: "70%", margin: "0 auto" }} />
                </div>

                {/* Label for first card */}
                {index === 2 && (
                  <ArrowLabel label="Empty State Card" position="top" verticalDistance={150} />
                )}
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
              padding: "20px 120px",
              borderRadius: "12px",
              fontSize: "18px",
              fontWeight: 600,
              border: "none",
              cursor: "pointer",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              position: "relative",
            }}
          >
            {buttonAddToCartText || "Add to Cart"}
            {/* Arrow pointing to Add to Cart Button */}
            <ArrowLabel label="Add to Cart Button" position="top" verticalDistance={150} />
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
            padding: "20px 32px",
            borderRadius: "10px",
            display: "inline-flex",
            alignItems: "center",
            gap: "16px",
            boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
            position: "relative",
          }}
        >
          <span style={{ fontSize: "16px", fontWeight: 500 }}>
            Add at least 1 product on this step
          </span>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M18 6L6 18M6 6L18 18" stroke={toastTextColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {/* Arrow pointing to Toast */}
          <ArrowLabel label="Toast Notification" position="top" verticalDistance={150} />
        </div>
        <div style={{ marginTop: "40px" }}>
          <Text as="p" variant="bodySm" tone="subdued">
            Preview updates as you customize
          </Text>
        </div>
      </div>
    );
  }

  // Filters - Only show the large filter button
  if (activeSubSection === "filters") {
    return (
      <div style={{ maxWidth: "600px", width: "100%", textAlign: "center", marginTop: "80px" }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "16px",
            backgroundColor: filterBgColor,
            padding: "20px 40px",
            borderRadius: "12px",
            border: "2px solid #E3E3E3",
            position: "relative",
          }}
        >
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
            <path
              d="M3 4.99509C3 3.89323 3.89262 3 4.99509 3H19.0049C20.1068 3 21 3.89262 21 4.99509V6.5C21 7.05 20.78 7.58 20.38 7.96L14.5 13.5V21L9.5 19V13.5L3.62 7.96C3.22 7.58 3 7.05 3 6.5V4.99509Z"
              stroke={filterIconColor}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span style={{ color: filterTextColor, fontSize: "20px", fontWeight: 600 }}>Filters</span>
          {/* Arrow pointing to Filter Button */}
          <ArrowLabel label="Filter Button" position="top" verticalDistance={150} />
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
