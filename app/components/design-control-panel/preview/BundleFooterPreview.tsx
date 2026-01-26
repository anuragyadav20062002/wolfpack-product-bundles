import { Text, ChoiceList } from "@shopify/polaris";
import { useState } from "react";
import { ShoppingCartIcon } from "../icons";

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
  footerDiscountTextVisibility: boolean;
  footerProgressBarFilledColor: string;
  footerProgressBarEmptyColor: string;
  successMessageFontSize: number;
  successMessageFontWeight: number;
  successMessageTextColor: string;
  successMessageBgColor: string;
}

// Bundle type toggle component for preview
function BundleTypeToggle({ selected, onChange }: { selected: string; onChange: (value: string) => void }) {
  return (
    <div style={{ marginBottom: "16px", display: "flex", gap: "8px", justifyContent: "center" }}>
      <button
        onClick={() => onChange("product_page")}
        style={{
          padding: "8px 16px",
          border: `2px solid ${selected === "product_page" ? "#000" : "#ddd"}`,
          borderRadius: "6px",
          background: selected === "product_page" ? "#000" : "#fff",
          color: selected === "product_page" ? "#fff" : "#333",
          cursor: "pointer",
          fontSize: "12px",
          fontWeight: 500,
        }}
      >
        Product Page
      </button>
      <button
        onClick={() => onChange("full_page")}
        style={{
          padding: "8px 16px",
          border: `2px solid ${selected === "full_page" ? "#000" : "#ddd"}`,
          borderRadius: "6px",
          background: selected === "full_page" ? "#000" : "#fff",
          color: selected === "full_page" ? "#fff" : "#333",
          cursor: "pointer",
          fontSize: "12px",
          fontWeight: 500,
        }}
      >
        Full Page
      </button>
    </div>
  );
}

export function BundleFooterPreview(props: BundleFooterPreviewProps) {
  const [bundleType, setBundleType] = useState<string>("product_page");

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
    footerDiscountTextVisibility,
    footerProgressBarFilledColor,
    footerProgressBarEmptyColor,
    successMessageFontSize,
    successMessageFontWeight,
    successMessageTextColor,
    successMessageBgColor,
  } = props;

  // Full-page bundle footer preview component
  const FullPageFooterPreview = () => (
    <div
      style={{
        backgroundColor: footerBgColor,
        borderRadius: `${footerBorderRadius}px`,
        padding: `${footerPadding}px 24px`,
        minWidth: "600px",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        border: "1px solid rgba(0, 0, 0, 0.1)",
        boxShadow: "0 -2px 8px rgba(0, 0, 0, 0.05)",
      }}
    >
      {/* Progress Section */}
      {footerDiscountTextVisibility && (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <div style={{ fontSize: "13px", fontWeight: 500, color: "#374151", textAlign: "center" }}>
            Add 1 more item to get <strong style={{ color: footerProgressBarFilledColor }}>10% off</strong>
          </div>
          <div
            style={{
              width: "100%",
              height: "6px",
              backgroundColor: footerProgressBarEmptyColor,
              borderRadius: "3px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: "66%",
                height: "100%",
                backgroundColor: footerProgressBarFilledColor,
                borderRadius: "3px",
              }}
            />
          </div>
        </div>
      )}

      {/* Products Strip + Total + Buttons Row */}
      <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
        {/* Products Strip (Left) */}
        <div style={{ display: "flex", gap: "8px", flex: 1 }}>
          {[1, 2].map((i) => (
            <div
              key={i}
              style={{
                width: "50px",
                height: "50px",
                backgroundColor: "#F3F4F6",
                borderRadius: "6px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
              }}
            >
              <div style={{ width: "30px", height: "30px", backgroundColor: "#D1D5DB", borderRadius: "4px" }} />
              <div
                style={{
                  position: "absolute",
                  top: "-4px",
                  right: "-4px",
                  width: "16px",
                  height: "16px",
                  backgroundColor: "#EF4444",
                  borderRadius: "50%",
                  color: "#fff",
                  fontSize: "10px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                &times;
              </div>
            </div>
          ))}
        </div>

        {/* Total Section (Center) */}
        {footerPriceVisibility && (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "11px", color: "#6B7280", marginBottom: "2px" }}>Total</div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span
                style={{
                  color: footerStrikePriceColor,
                  fontSize: `${footerStrikeFontSize}px`,
                  fontWeight: footerStrikeFontWeight,
                  textDecoration: "line-through",
                }}
              >
                $24.99
              </span>
              <span
                style={{
                  color: footerFinalPriceColor,
                  fontSize: `${footerFinalPriceFontSize}px`,
                  fontWeight: footerFinalPriceFontWeight,
                }}
              >
                $19.99
              </span>
            </div>
          </div>
        )}

        {/* Navigation Buttons (Right) */}
        <div style={{ display: "flex", gap: "12px" }}>
          <button
            style={{
              backgroundColor: footerBackButtonBgColor,
              color: footerBackButtonTextColor,
              border: `1px solid ${footerBackButtonBorderColor}`,
              borderRadius: `${footerBackButtonBorderRadius}px`,
              padding: "10px 24px",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Back
          </button>
          <button
            style={{
              backgroundColor: footerNextButtonBgColor,
              color: footerNextButtonTextColor,
              border: `1px solid ${footerNextButtonBorderColor}`,
              borderRadius: `${footerNextButtonBorderRadius}px`,
              padding: "10px 24px",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );

  // Bundle Footer - Main footer subsection
  if (activeSubSection === "footer") {
    return (
      <div style={{ textAlign: "center", position: "relative" }}>
        <Text as="h3" variant="headingLg" fontWeight="semibold">
          Footer
        </Text>
        <div style={{ marginTop: "24px" }}>
          <BundleTypeToggle selected={bundleType} onChange={setBundleType} />
        </div>
        <div style={{ marginTop: "24px", display: "inline-block", position: "relative" }}>
          {bundleType === "full_page" ? (
            <FullPageFooterPreview />
          ) : (
            /* Product Page Bundle Footer Container */
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
                    <ShoppingCartIcon width={18} height={18} color="#666" />
                  </span>
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
            </div>
          )}
        </div>
        <div style={{ marginTop: "16px" }}>
          <Text as="p" variant="bodySm" tone="subdued">
            {bundleType === "full_page" ? "Full-page bundle footer layout" : "Product-page bundle footer layout"}
          </Text>
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
                    <ShoppingCartIcon width={18} height={18} color="#666" />
                  </span>
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
                  <ShoppingCartIcon width={18} height={18} color="#666" />
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
        <div style={{ marginTop: "80px", display: "inline-block", position: "relative" }}>
          {/* Bundle Footer Messaging Container */}
          <div
            style={{
              backgroundColor: footerBgColor,
              borderRadius: `${footerBorderRadius}px`,
              padding: `${footerPadding}px`,
              minWidth: "422px",
              maxWidth: "500px",
              position: "relative",
            }}
          >
            {/* Discount Text */}
            {footerDiscountTextVisibility && (
              <div
                style={{
                  textAlign: "center",
                  marginBottom: "16px",
                  fontSize: "14px",
                  fontWeight: 500,
                  color: "#374151",
                  position: "relative",
                }}
              >
                Add 2 more items to get <strong>10% off</strong>
              </div>
            )}

            {/* Progress Bar Container */}
            <div style={{ position: "relative" }}>
              {/* Progress Bar */}
              <div
                style={{
                  width: "100%",
                  height: "8px",
                  backgroundColor: footerProgressBarEmptyColor,
                  borderRadius: "4px",
                  overflow: "hidden",
                  marginBottom: "8px",
                  position: "relative",
                }}
              >
                {/* Progress Fill */}
                <div
                  style={{
                    width: "50%",
                    height: "100%",
                    backgroundColor: footerProgressBarFilledColor,
                    borderRadius: "4px",
                    transition: "width 0.3s ease",
                  }}
                />
              </div>

              {/* Progress Details */}
              <div
                style={{
                  textAlign: "center",
                  fontSize: "12px",
                  color: "#6B7280",
                  fontWeight: 500,
                  position: "relative",
                }}
              >
                <span style={{ color: "#374151", fontWeight: 600 }}>2</span> / <span style={{ color: "#374151", fontWeight: 600 }}>4</span> items
              </div>
            </div>

            {/* Success Message Preview */}
            <div
              style={{
                marginTop: "16px",
                padding: "12px 16px",
                backgroundColor: successMessageBgColor,
                borderRadius: "8px",
                textAlign: "center",
                position: "relative",
              }}
            >
              <div
                style={{
                  fontSize: `${successMessageFontSize}px`,
                  fontWeight: successMessageFontWeight,
                  color: successMessageTextColor,
                }}
              >
                Congratulations! You got 10% off!
              </div>
            </div>
          </div>

          {/* Annotation Label */}
          <div style={{ marginTop: "24px" }}>
            <Text as="p" variant="bodySm" tone="subdued">
              Preview updates as you customize
            </Text>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
