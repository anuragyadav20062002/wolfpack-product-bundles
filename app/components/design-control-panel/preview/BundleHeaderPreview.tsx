import { Text } from "@shopify/polaris";

const HIGHLIGHT_STYLE = {
  outline: "2px dashed #5C6AC4",
  outlineOffset: "4px",
};

interface BundleHeaderPreviewProps {
  activeSubSection: string;
  headerTabActiveBgColor: string;
  headerTabActiveTextColor: string;
  headerTabInactiveBgColor: string;
  headerTabInactiveTextColor: string;
  headerTabRadius: number;
  conditionsTextColor: string;
  conditionsTextFontSize: number;
  discountTextColor: string;
  discountTextFontSize: number;
}

export function BundleHeaderPreview(props: BundleHeaderPreviewProps) {
  const {
    activeSubSection,
    headerTabActiveBgColor,
    headerTabActiveTextColor,
    headerTabInactiveBgColor,
    headerTabInactiveTextColor,
    headerTabRadius,
    conditionsTextColor,
    conditionsTextFontSize,
    discountTextColor,
    discountTextFontSize,
  } = props;

  // Bundle Header - Tabs subsection
  if (activeSubSection === "headerTabs") {
    return (
      <div style={{ textAlign: "center", position: "relative" }}>
        <Text as="h3" variant="headingLg" fontWeight="semibold">
          Tabs
        </Text>
        <div style={{ marginTop: "80px", display: "inline-block", position: "relative" }}>
          {/* Tabs Preview */}
          <div style={{
            width: "600px",
            padding: "40px",
            border: "1px solid #E3E3E3",
            borderRadius: "8px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#FAFAFA"
          }}>
            <div style={{ display: "flex", gap: "12px", justifyContent: "center", alignItems: "center", ...(activeSubSection === "headerTabs" ? HIGHLIGHT_STYLE : {}) }}>
              {/* Active Tab */}
              <button style={{
                backgroundColor: headerTabActiveBgColor,
                color: headerTabActiveTextColor,
                borderRadius: `${headerTabRadius}px`,
                padding: "10px 24px",
                border: `2px solid ${headerTabActiveBgColor}`,
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
                transform: "translateY(-2px)",
                minHeight: "38px",
                minWidth: "100px",
              }}>
                Step 1
              </button>

              {/* Inactive Tab */}
              <button style={{
                backgroundColor: headerTabInactiveBgColor,
                color: headerTabInactiveTextColor,
                borderRadius: `${headerTabRadius}px`,
                padding: "10px 24px",
                border: "1px solid #E5E7EB",
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer"
              }}>
                Step 2
              </button>

              {/* Inactive Tab */}
              <button style={{
                backgroundColor: headerTabInactiveBgColor,
                color: headerTabInactiveTextColor,
                borderRadius: `${headerTabRadius}px`,
                padding: "10px 24px",
                border: "1px solid #E5E7EB",
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer"
              }}>
                Step 3
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Bundle Header - Header Text subsection
  if (activeSubSection === "headerText") {
    return (
      <div style={{ textAlign: "center", position: "relative" }}>
        <Text as="h3" variant="headingLg" fontWeight="semibold">
          Header Text
        </Text>
        <div style={{ marginTop: "80px", display: "inline-block", position: "relative" }}>
          {/* Header Text Preview */}
          <div style={{ maxWidth: "397px", width: "100%", position: "relative", ...(activeSubSection === "headerText" ? HIGHLIGHT_STYLE : {}) }}>
            {/* Conditions Text */}
            <div style={{ marginBottom: "40px", position: "relative" }}>
              <h2 style={{
                color: conditionsTextColor,
                fontSize: `${conditionsTextFontSize}px`,
                fontWeight: 600,
                margin: 0,
                textAlign: "center",
                position: "relative",
              }}>
                Choose 3 products
              </h2>
            </div>

            {/* Discount Text */}
            <div style={{ position: "relative" }}>
              <p style={{
                color: discountTextColor,
                fontSize: `${discountTextFontSize}px`,
                fontWeight: 400,
                margin: 0,
                textAlign: "center",
                position: "relative",
              }}>
                Add 2 product(s) to get the bundle at $45
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
