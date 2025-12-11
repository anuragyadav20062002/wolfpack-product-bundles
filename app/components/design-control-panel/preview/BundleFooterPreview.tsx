import { Text } from "@shopify/polaris";
import { ArrowLabel } from "../common/ArrowLabel";

interface BundleFooterPreviewProps {
  activeSubSection: string;
  footerBgColor: string;
  footerBorderRadius: number;
  footerPadding: number;
  footerTotalBgColor: string;
  footerStrikePriceColor: string;
  footerStrikeFontSize: number;
  footerStrikeFontWeight: number;
  footerFinalPriceColor: string;
  footerFinalPriceFontSize: number;
  footerFinalPriceFontWeight: number;
  footerPriceVisibility: boolean;
  footerBackButtonBgColor: string;
  footerBackButtonTextColor: string;
  footerBackButtonBorderColor: string;
  footerBackButtonBorderRadius: number;
  footerNextButtonBgColor: string;
  footerNextButtonTextColor: string;
  footerNextButtonBorderColor: string;
  footerNextButtonBorderRadius: number;
}

export function BundleFooterPreview(props: BundleFooterPreviewProps) {
  const {
    activeSubSection,
    footerBgColor,
    footerBorderRadius,
    footerPadding,
    footerTotalBgColor,
    footerStrikePriceColor,
    footerStrikeFontSize,
    footerStrikeFontWeight,
    footerFinalPriceColor,
    footerFinalPriceFontSize,
    footerFinalPriceFontWeight,
    footerPriceVisibility,
    footerBackButtonBgColor,
    footerBackButtonTextColor,
    footerBackButtonBorderColor,
    footerBackButtonBorderRadius,
    footerNextButtonBgColor,
    footerNextButtonTextColor,
    footerNextButtonBorderColor,
    footerNextButtonBorderRadius,
  } = props;

  // Bundle Footer - Main footer subsection
  if (activeSubSection === "footer") {
    return (
      <div style={{ textAlign: "center", position: "relative" }}>
        <Text as="h3" variant="headingLg" fontWeight="semibold">
          Footer
        </Text>
        <div style={{ marginTop: "80px", display: "inline-block", position: "relative" }}>
          {/* Bundle Footer Container */}
          <div
            style={{
              backgroundColor: footerBgColor,
              borderRadius: `${footerBorderRadius}px`,
              padding: `${footerPadding}px`,
              minWidth: "422px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
            }}
          >
            {/* Centered Content */}
            <div
              style={{
                display: "inline-flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "15px",
              }}
            >
              {/* Total Pill */}
              <div
                style={{
                  backgroundColor: footerTotalBgColor,
                  padding: "6px 16px",
                  borderRadius: "6px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  fontSize: "14px",
                  fontWeight: 500,
                  position: "relative",
                }}
              >
                <span style={{
                  color: footerStrikePriceColor,
                  fontSize: `${footerStrikeFontSize}px`,
                  fontWeight: footerStrikeFontWeight,
                  textDecoration: "line-through",
                }}>
                  $24.99
                </span>
                <span style={{
                  color: footerFinalPriceColor,
                  fontSize: `${footerFinalPriceFontSize}px`,
                  fontWeight: footerFinalPriceFontWeight,
                }}>
                  $19.99
                </span>
                <span style={{ color: "#666" }}>|</span>
                <span style={{ color: "#666", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                  2
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 2L11 8M15 8L17 2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M1 7H21L19 21H3L1 7Z" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="9" cy="21" r="1" fill="currentColor" stroke="none"/>
                    <circle cx="17" cy="21" r="1" fill="currentColor" stroke="none"/>
                  </svg>
                </span>

                {/* Arrow pointing to Total Pill */}
                <ArrowLabel label="Total Pill" position="top" verticalDistance={150} />
              </div>

              {/* Buttons Row */}
              <div
                style={{
                  display: "flex",
                  gap: "15px",
                  alignItems: "center",
                }}
              >
                {/* Back Button */}
                <button
                  style={{
                    backgroundColor: footerBackButtonBgColor,
                    color: footerBackButtonTextColor,
                    border: `1px solid ${footerBackButtonBorderColor}`,
                    borderRadius: `${footerBackButtonBorderRadius}px`,
                    padding: "12px 56px",
                    fontSize: "14px",
                    fontWeight: 600,
                    cursor: "pointer",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  BACK
                </button>

                {/* Next Button */}
                <button
                  style={{
                    backgroundColor: footerNextButtonBgColor,
                    color: footerNextButtonTextColor,
                    border: `1px solid ${footerNextButtonBorderColor}`,
                    borderRadius: `${footerNextButtonBorderRadius}px`,
                    padding: "12px 56px",
                    fontSize: "14px",
                    fontWeight: 600,
                    cursor: "pointer",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  NEXT
                </button>
              </div>
            </div>

            {/* Arrow pointing to Footer Background (left side) */}
            <ArrowLabel label="Footer" position="top" verticalDistance={150} horizontalOffset={20} />
          </div>
        </div>
      </div>
    );
  }

  // Bundle Footer - Price subsection
  if (activeSubSection === "footerPrice") {
    return (
      <div style={{ textAlign: "center", position: "relative" }}>
        <Text as="h3" variant="headingLg" fontWeight="semibold">
          Price
        </Text>
        <div style={{ marginTop: "80px", display: "inline-block", position: "relative" }}>
          {/* Bundle Footer Container */}
          <div
            style={{
              backgroundColor: footerBgColor,
              borderRadius: `${footerBorderRadius}px`,
              padding: `${footerPadding}px`,
              minWidth: "422px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
            }}
          >
            {/* Centered Content */}
            <div
              style={{
                display: "inline-flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "15px",
              }}
            >
              {/* Total Pill with Price Label */}
              {footerPriceVisibility && (
                <div
                  style={{
                    backgroundColor: footerTotalBgColor,
                    padding: "6px 16px",
                    borderRadius: "6px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    fontSize: "14px",
                    fontWeight: 500,
                    position: "relative",
                  }}
                >
                  <span style={{
                    color: footerStrikePriceColor,
                    fontSize: `${footerStrikeFontSize}px`,
                    fontWeight: footerStrikeFontWeight,
                    textDecoration: "line-through",
                  }}>
                    $24.99
                  </span>
                  <span style={{
                    color: footerFinalPriceColor,
                    fontSize: `${footerFinalPriceFontSize}px`,
                    fontWeight: footerFinalPriceFontWeight,
                  }}>
                    $19.99
                  </span>
                  <span style={{ color: "#666" }}>|</span>
                  <span style={{ color: "#666", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                    2
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 2L11 8M15 8L17 2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M1 7H21L19 21H3L1 7Z" strokeLinecap="round" strokeLinejoin="round"/>
                      <circle cx="9" cy="21" r="1" fill="currentColor" stroke="none"/>
                      <circle cx="17" cy="21" r="1" fill="currentColor" stroke="none"/>
                    </svg>
                  </span>

                  {/* Arrow pointing to Price */}
                  <ArrowLabel label="Price" position="right" horizontalDistance={140} />
                </div>
              )}

              {/* Buttons Row */}
              <div
                style={{
                  display: "flex",
                  gap: "15px",
                  alignItems: "center",
                }}
              >
                {/* Back Button */}
                <button
                  style={{
                    backgroundColor: footerBackButtonBgColor,
                    color: footerBackButtonTextColor,
                    border: `1px solid ${footerBackButtonBorderColor}`,
                    borderRadius: `${footerBackButtonBorderRadius}px`,
                    padding: "12px 56px",
                    fontSize: "14px",
                    fontWeight: 600,
                    cursor: "pointer",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  BACK
                </button>

                {/* Next Button */}
                <button
                  style={{
                    backgroundColor: footerNextButtonBgColor,
                    color: footerNextButtonTextColor,
                    border: `1px solid ${footerNextButtonBorderColor}`,
                    borderRadius: `${footerNextButtonBorderRadius}px`,
                    padding: "12px 56px",
                    fontSize: "14px",
                    fontWeight: 600,
                    cursor: "pointer",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  NEXT
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Bundle Footer - Button subsection
  if (activeSubSection === "footerButton") {
    return (
      <div style={{ textAlign: "center", position: "relative" }}>
        <Text as="h3" variant="headingLg" fontWeight="semibold">
          Button
        </Text>
        <div style={{ marginTop: "80px", display: "inline-block", position: "relative" }}>
          {/* Bundle Footer Container */}
          <div
            style={{
              backgroundColor: footerBgColor,
              borderRadius: `${footerBorderRadius}px`,
              padding: `${footerPadding}px`,
              minWidth: "561px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
            }}
          >
            {/* Centered Content */}
            <div
              style={{
                display: "inline-flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "15px",
              }}
            >
              {/* Total Pill */}
              <div
                style={{
                  backgroundColor: footerTotalBgColor,
                  padding: "6px 16px",
                  borderRadius: "6px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  fontSize: "14px",
                  fontWeight: 500,
                }}
              >
                <span style={{
                  color: footerStrikePriceColor,
                  fontSize: `${footerStrikeFontSize}px`,
                  fontWeight: footerStrikeFontWeight,
                  textDecoration: "line-through",
                }}>
                  $24.99
                </span>
                <span style={{
                  color: footerFinalPriceColor,
                  fontSize: `${footerFinalPriceFontSize}px`,
                  fontWeight: footerFinalPriceFontWeight,
                }}>
                  $19.99
                </span>
                <span style={{ color: "#666" }}>|</span>
                <span style={{ color: "#666", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                  2
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 2L11 8M15 8L17 2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M1 7H21L19 21H3L1 7Z" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="9" cy="21" r="1" fill="currentColor" stroke="none"/>
                    <circle cx="17" cy="21" r="1" fill="currentColor" stroke="none"/>
                  </svg>
                </span>
              </div>

              {/* Buttons Row with labels */}
              <div
                style={{
                  display: "flex",
                  gap: "15px",
                  alignItems: "center",
                }}
              >
                {/* Back Button */}
                <button
                  style={{
                    backgroundColor: footerBackButtonBgColor,
                    color: footerBackButtonTextColor,
                    border: `1px solid ${footerBackButtonBorderColor}`,
                    borderRadius: `${footerBackButtonBorderRadius}px`,
                    padding: "12px 56px",
                    fontSize: "14px",
                    fontWeight: 600,
                    cursor: "pointer",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    position: "relative",
                  }}
                >
                  BACK

                  {/* Arrow pointing to Back Button (left side) */}
                  <ArrowLabel label="Back Button" position="left" horizontalDistance={140} />
                </button>

                {/* Next Button */}
                <button
                  style={{
                    backgroundColor: footerNextButtonBgColor,
                    color: footerNextButtonTextColor,
                    border: `1px solid ${footerNextButtonBorderColor}`,
                    borderRadius: `${footerNextButtonBorderRadius}px`,
                    padding: "12px 56px",
                    fontSize: "14px",
                    fontWeight: 600,
                    cursor: "pointer",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    position: "relative",
                  }}
                >
                  NEXT

                  {/* Arrow pointing to Next Button (right side) */}
                  <ArrowLabel label="Next Button" position="right" horizontalDistance={140} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Bundle Footer - Discount & Progress Bar subsection
  if (activeSubSection === "footerDiscountProgress") {
    return (
      <div style={{ textAlign: "center", position: "relative" }}>
        <Text as="h3" variant="headingLg" fontWeight="semibold">
          Discount Text & Progress Bar
        </Text>
        <div style={{ marginTop: "48px", display: "inline-block", position: "relative" }}>
          <Text as="p" variant="bodySm" tone="subdued">
            Preview updates as you customize
          </Text>
        </div>
      </div>
    );
  }

  return null;
}
