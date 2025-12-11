import { Text } from "@shopify/polaris";
import { ArrowLabel } from "../common/ArrowLabel";

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
            <div style={{ display: "flex", gap: "12px", justifyContent: "center", alignItems: "center" }}>
              {/* Active Tab */}
              <button style={{
                backgroundColor: headerTabActiveBgColor,
                color: headerTabActiveTextColor,
                borderRadius: `${headerTabRadius}px`,
                padding: "10px 24px",
                border: "none",
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
                boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)"
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
          <div style={{ maxWidth: "397px", width: "100%", position: "relative" }}>
            {/* Conditions Text */}
            <div style={{ marginBottom: "40px", position: "relative" }}>
              <h2 style={{
                color: conditionsTextColor,
                fontSize: `${conditionsTextFontSize * 2}px`,
                fontWeight: 600,
                margin: 0,
                textAlign: "center",
                position: "relative",
              }}>
                Choose 3 products
                {/* Arrow pointing to Conditions Text */}
                <ArrowLabel label="Conditions Text" position="top" verticalDistance={150} />
              </h2>
            </div>

            {/* Discount Text */}
            <div style={{ position: "relative" }}>
              <p style={{
                color: discountTextColor,
                fontSize: `${discountTextFontSize * 1.2}px`,
                fontWeight: 400,
                margin: 0,
                textAlign: "center",
                position: "relative",
              }}>
                Add 2 product(s) to get the bundle at $45
                {/* Arrow pointing to Discount Text */}
                <ArrowLabel label="Discount Text" position="bottom" verticalDistance={150} />
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
