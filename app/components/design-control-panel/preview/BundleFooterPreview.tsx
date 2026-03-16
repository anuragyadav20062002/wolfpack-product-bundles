import { Text } from "@shopify/polaris";
import { useState } from "react";
import { ShoppingCartIcon } from "../icons";
import { BundleType } from "../../../constants/bundle";
import { HighlightBox } from "./HighlightBox";

const HIGHLIGHT_STYLE = {
  outline: "2px dashed #5C6AC4",
  outlineOffset: "4px",
};

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
  successMessageFontSize: number;
  successMessageFontWeight: number;
  successMessageTextColor: string;
  successMessageBgColor: string;
}

type HighlightTarget = "footer" | "footerPrice" | "footerButton" | "footerDiscountProgress" | null;

// Sample product data for preview tiles
const SAMPLE_PRODUCTS = [
  { name: "Classic T-Shirt", variant: "Medium / Black", qty: 1 },
  { name: "Running Shorts", variant: "Large / Navy", qty: 2 },
  { name: "Sport Socks", variant: "", qty: 1 },
];

// Bundle type toggle component for preview
function BundleTypeToggle({ selected, onChange }: { selected: string; onChange: (value: string) => void }) {
  return (
    <div style={{ marginBottom: "16px", display: "flex", gap: "8px", justifyContent: "center" }}>
      <button
        onClick={() => onChange(BundleType.PRODUCT_PAGE)}
        style={{
          padding: "8px 16px",
          border: `2px solid ${selected === BundleType.PRODUCT_PAGE ? "#000" : "#ddd"}`,
          borderRadius: "6px",
          background: selected === BundleType.PRODUCT_PAGE ? "#000" : "#fff",
          color: selected === BundleType.PRODUCT_PAGE ? "#fff" : "#333",
          cursor: "pointer",
          fontSize: "12px",
          fontWeight: 500,
        }}
      >
        Product Page
      </button>
      <button
        onClick={() => onChange(BundleType.FULL_PAGE)}
        style={{
          padding: "8px 16px",
          border: `2px solid ${selected === BundleType.FULL_PAGE ? "#000" : "#ddd"}`,
          borderRadius: "6px",
          background: selected === BundleType.FULL_PAGE ? "#000" : "#fff",
          color: selected === BundleType.FULL_PAGE ? "#fff" : "#333",
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

// Full-page footer layout — matches storefront: Progress Message → Product Tiles → Back | Total | Next
function FullPageFooterLayout({
  highlightTarget,
  footerBgColor,
  footerBorderRadius,
  footerPadding,
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
}: Omit<BundleFooterPreviewProps, "activeSubSection" | "footerTotalBgColor" | "successMessageFontSize" | "successMessageFontWeight" | "successMessageTextColor" | "successMessageBgColor"> & { highlightTarget: HighlightTarget }) {
  return (
    <div
      style={{
        backgroundColor: footerBgColor,
        borderRadius: "16px",
        padding: 0,
        minWidth: "520px",
        maxWidth: "680px",
        display: "block",
        border: "1px solid rgba(0, 0, 0, 0.08)",
        boxShadow: "0 10px 40px rgba(0, 0, 0, 0.18)",
        ...(highlightTarget === "footer" ? HIGHLIGHT_STYLE : {}),
      }}
    >
      {/* SECTION 1: Progress / Discount Message */}
      {footerDiscountTextVisibility && (
        <div
          style={{
            padding: "16px 40px 12px",
            textAlign: "center",
            ...(highlightTarget === "footerDiscountProgress" ? HIGHLIGHT_STYLE : {}),
          }}
        >
          <div
            style={{
              fontSize: "15px",
              fontWeight: 600,
              color: "#374151",
            }}
          >
            Add 1 more item to get <strong>10% off</strong>
          </div>
        </div>
      )}

      {/* SECTION 2: Scrollable Product Tiles */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          padding: "12px 24px",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            gap: "16px",
            overflowX: "auto",
            padding: "10px 44px",
            maxWidth: "100%",
            alignItems: "center",
          }}
        >
          {SAMPLE_PRODUCTS.map((product, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                gap: "10px",
                padding: "8px 12px",
                background: "#f8f9fa",
                border: "1px solid rgba(0, 0, 0, 0.08)",
                borderRadius: "8px",
                flexShrink: 0,
                minWidth: "160px",
                maxWidth: "180px",
                position: "relative",
              }}
            >
              {/* Tile Image + Quantity Badge */}
              <div style={{ position: "relative", flexShrink: 0, width: "44px", height: "44px" }}>
                <div
                  style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "6px",
                    background: "#E5E7EB",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <div style={{ width: "28px", height: "28px", backgroundColor: "#D1D5DB", borderRadius: "4px" }} />
                </div>
                {/* Quantity Badge */}
                <span
                  style={{
                    position: "absolute",
                    top: "-6px",
                    right: "-6px",
                    minWidth: "20px",
                    height: "20px",
                    padding: "0 5px",
                    background: footerNextButtonBgColor,
                    color: footerNextButtonTextColor,
                    borderRadius: "10px",
                    fontSize: "11px",
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.15)",
                  }}
                >
                  {product.qty}
                </span>
              </div>

              {/* Tile Info */}
              <div style={{ display: "flex", flexDirection: "column", gap: "2px", minWidth: 0, flex: 1 }}>
                <span
                  style={{
                    fontSize: "13px",
                    fontWeight: 500,
                    color: "#333",
                    lineHeight: 1.3,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {product.name}
                </span>
                {product.variant && (
                  <span
                    style={{
                      fontSize: "11px",
                      color: "#666",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {product.variant}
                  </span>
                )}
              </div>

              {/* Remove Button */}
              <div
                style={{
                  position: "absolute",
                  top: "-8px",
                  right: "-8px",
                  width: "22px",
                  height: "22px",
                  background: "#ff4444",
                  color: "#fff",
                  border: "2px solid #fff",
                  borderRadius: "50%",
                  fontSize: "13px",
                  fontWeight: "bold",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 2px 6px rgba(0, 0, 0, 0.2)",
                  lineHeight: 1,
                }}
              >
                &times;
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 3: Navigation — Back | Total | Next */}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: "16px",
          padding: `12px 24px ${footerPadding}px`,
        }}
      >
        {/* Back Button */}
        <div style={highlightTarget === "footerButton" ? HIGHLIGHT_STYLE : {}}>
          <button
            style={{
              backgroundColor: footerBackButtonBgColor,
              color: footerBackButtonTextColor,
              border: `1px solid ${footerBackButtonBorderColor}`,
              borderRadius: `${footerBackButtonBorderRadius || 50}px`,
              padding: "12px 28px",
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              minWidth: "100px",
            }}
          >
            Back
          </button>
        </div>

        {/* Total Section (between buttons) */}
        {footerPriceVisibility && (
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              gap: "8px",
              padding: "0 20px",
              ...(highlightTarget === "footerPrice" ? HIGHLIGHT_STYLE : {}),
            }}
          >
            <span style={{ fontSize: "20px", fontWeight: 550, color: "#333" }}>Total</span>
            <div style={{ display: "flex", flexDirection: "row", alignItems: "baseline", gap: "8px" }}>
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

        {/* Next Button */}
        <div style={highlightTarget === "footerButton" ? HIGHLIGHT_STYLE : {}}>
          <button
            style={{
              backgroundColor: footerNextButtonBgColor,
              color: footerNextButtonTextColor,
              border: "none",
              borderRadius: `${footerNextButtonBorderRadius || 50}px`,
              padding: "12px 28px",
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              minWidth: "100px",
            }}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

// Product-page (modal) footer layout — matches storefront: Total Pill → Discount Text → Buttons
function ProductPageFooterLayout({
  highlightTarget,
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
}: {
  highlightTarget: HighlightTarget;
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
}) {
  return (
    <div
      style={{
        backgroundColor: footerBgColor,
        borderRadius: `${footerBorderRadius}px`,
        padding: "12px 24px",
        minWidth: "480px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        borderTop: "1px solid #E5E7EB",
        boxShadow: "0 -2px 8px rgba(0,0,0,0.06)",
        width: "100%",
        ...(highlightTarget === "footer" ? HIGHLIGHT_STYLE : {}),
      }}
    >
      {/* Centered Grouped Content — matches .modal-footer-grouped-content */}
      <div
        style={{
          display: "inline-flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "8px",
        }}
      >
        {/* Total Pill — matches .modal-footer-total-pill */}
        {footerPriceVisibility !== false && (
          <div
            style={{
              backgroundColor: footerTotalBgColor,
              padding: "10px 20px",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "16px",
              fontWeight: 500,
              position: "relative",
              ...(highlightTarget === "footerPrice" ? HIGHLIGHT_STYLE : {}),
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
            <span style={{ color: "#666", fontWeight: 400 }}>|</span>
            <span style={{ color: "#666", display: "inline-flex", alignItems: "center", gap: "4px", fontWeight: 600 }}>
              2
              <ShoppingCartIcon width={18} height={18} color="#666" />
            </span>
          </div>
        )}

        {/* Discount Messaging — matches .modal-footer-discount-messaging */}
        {footerDiscountTextVisibility && (
          <div
            style={{
              textAlign: "center",
              marginBottom: "8px",
              marginTop: "8px",
              ...(highlightTarget === "footerDiscountProgress" ? HIGHLIGHT_STYLE : {}),
            }}
          >
            <div style={{ fontSize: "14px", fontWeight: 500, color: "#374151", lineHeight: 1.4 }}>
              Add 2 more items to get <strong>10% off</strong>
            </div>
          </div>
        )}

        {/* Buttons Row — matches .modal-footer-buttons-row */}
        <div
          style={{
            display: "flex",
            gap: "12px",
            alignItems: "center",
            ...(highlightTarget === "footerButton" ? HIGHLIGHT_STYLE : {}),
          }}
        >
          {/* Back Button — matches .modal-nav-button.prev-button */}
          <button
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: footerBackButtonBgColor,
              color: footerBackButtonTextColor,
              border: `2px solid ${footerBackButtonBorderColor}`,
              borderRadius: `${footerBackButtonBorderRadius}px`,
              padding: "10px 28px",
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
              boxShadow: "0 2px 6px rgba(0, 0, 0, 0.06)",
            }}
          >
            BACK
          </button>

          {/* Next Button — matches .modal-nav-button.next-button */}
          <button
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: footerNextButtonBgColor,
              color: footerNextButtonTextColor,
              border: `2px solid ${footerNextButtonBorderColor}`,
              borderRadius: `${footerNextButtonBorderRadius}px`,
              padding: "10px 28px",
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
              boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
            }}
          >
            NEXT
          </button>
        </div>
      </div>
    </div>
  );
}

export function BundleFooterPreview(props: BundleFooterPreviewProps) {
  const [bundleType, setBundleType] = useState<string>(BundleType.PRODUCT_PAGE);

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
    successMessageFontSize,
    successMessageFontWeight,
    successMessageTextColor,
    successMessageBgColor,
  } = props;

  const highlightTarget = activeSubSection as HighlightTarget;

  const sharedProductPageProps = {
    highlightTarget,
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
  };

  const sharedFullPageProps = {
    highlightTarget,
    footerBgColor,
    footerBorderRadius,
    footerPadding,
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
  };

  // quantityBadge — show a footer tile with the quantity badge highlighted
  if (activeSubSection === "quantityBadge") {
    return (
      <div style={{ textAlign: "center", position: "relative" }}>
        <Text as="h3" variant="headingLg" fontWeight="semibold">
          Quantity Badge
        </Text>
        <div style={{ marginTop: "60px", display: "inline-block" }}>
          <HighlightBox active>
            {/* paddingTop gives room for the badge that overflows by 6px above the tile */}
            <div style={{ display: "flex", gap: "16px", padding: "16px", paddingTop: "20px", background: "#f8f9fa", borderRadius: "12px" }}>
              {SAMPLE_PRODUCTS.slice(0, 2).map((product, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    gap: "10px",
                    padding: "8px 12px",
                    background: "#ffffff",
                    border: "1px solid rgba(0,0,0,0.08)",
                    borderRadius: "8px",
                    minWidth: "140px",
                    position: "relative",
                  }}
                >
                  {/* Image + Badge */}
                  <div style={{ position: "relative", flexShrink: 0, width: "44px", height: "44px" }}>
                    <div
                      style={{
                        width: "44px",
                        height: "44px",
                        borderRadius: "6px",
                        background: "#E5E7EB",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <div style={{ width: "28px", height: "28px", backgroundColor: "#D1D5DB", borderRadius: "4px" }} />
                    </div>
                    {/* Pure React badge — reads CSS vars via inline style so DCP changes apply */}
                    <span
                      style={{
                        position: "absolute",
                        top: "-6px",
                        right: "-6px",
                        minWidth: "20px",
                        height: "20px",
                        padding: "0 5px",
                        background: "var(--bundle-tile-badge-bg, #000000)",
                        color: "var(--bundle-tile-badge-text, #ffffff)",
                        borderRadius: "10px",
                        fontSize: "11px",
                        fontWeight: 600,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.15)",
                      }}
                    >
                      {product.qty}
                    </span>
                  </div>
                  {/* Info */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "2px", minWidth: 0, flex: 1 }}>
                    <span style={{ fontSize: "13px", fontWeight: 500, color: "#333", lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {product.name}
                    </span>
                    {product.variant && (
                      <span style={{ fontSize: "11px", color: "#666", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {product.variant}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </HighlightBox>
        </div>
        <div style={{ marginTop: "16px" }}>
          <Text as="p" variant="bodySm" tone="subdued">
            Badge shows quantity on each footer tile
          </Text>
        </div>
      </div>
    );
  }

  // Subsection title mapping
  const titles: Record<string, string> = {
    footer: "Footer",
    footerPrice: "Price",
    footerButton: "Button",
    footerDiscountProgress: "Discount Text & Progress Bar",
  };

  // For footerDiscountProgress, show dedicated discount/progress layout when product_page
  if (activeSubSection === "footerDiscountProgress" && bundleType === BundleType.PRODUCT_PAGE) {
    return (
      <div style={{ textAlign: "center", position: "relative" }}>
        <Text as="h3" variant="headingLg" fontWeight="semibold">
          {titles[activeSubSection]}
        </Text>
        <div style={{ marginTop: "24px" }}>
          <BundleTypeToggle selected={bundleType} onChange={setBundleType} />
        </div>
        <div style={{ marginTop: "24px", display: "inline-block", position: "relative" }}>
          {/* Bundle Footer Messaging Container */}
          <div
            style={{
              backgroundColor: footerBgColor,
              borderRadius: `${footerBorderRadius}px`,
              padding: `${footerPadding}px`,
              minWidth: "422px",
              maxWidth: "500px",
              position: "relative",
              ...(highlightTarget === "footerDiscountProgress" ? HIGHLIGHT_STYLE : {}),
            }}
          >
            {/* Progress State — shown when discount threshold not yet reached */}
            {footerDiscountTextVisibility && (
              <div
                style={{
                  textAlign: "center",
                  fontSize: "14px",
                  fontWeight: 500,
                  color: "#374151",
                  padding: "4px 0",
                }}
              >
                Add 2 more items to get <strong>10% off</strong>
              </div>
            )}

            {/* Divider between states */}
            <div
              style={{
                margin: "12px 0",
                fontSize: "11px",
                color: "#9CA3AF",
                textAlign: "center",
                letterSpacing: "0.04em",
                textTransform: "uppercase",
              }}
            >
              — when qualified —
            </div>

            {/* Success State — shown when discount threshold is reached */}
            <div
              style={{
                padding: "12px 16px",
                backgroundColor: successMessageBgColor,
                borderRadius: "8px",
                textAlign: "center",
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

  // All other subsections: show toggle + shared footer layout
  return (
    <div style={{ textAlign: "center", position: "relative" }}>
      <Text as="h3" variant="headingLg" fontWeight="semibold">
        {titles[activeSubSection] ?? activeSubSection}
      </Text>
      <div style={{ marginTop: "24px" }}>
        <BundleTypeToggle selected={bundleType} onChange={setBundleType} />
      </div>
      <div style={{ marginTop: "24px", display: "inline-block", position: "relative" }}>
        {bundleType === BundleType.FULL_PAGE ? (
          <FullPageFooterLayout {...sharedFullPageProps} />
        ) : (
          <ProductPageFooterLayout {...sharedProductPageProps} />
        )}
      </div>
      <div style={{ marginTop: "16px" }}>
        <Text as="p" variant="bodySm" tone="subdued">
          {bundleType === BundleType.FULL_PAGE ? "Full-page bundle footer layout" : "Product-page bundle footer layout"}
        </Text>
      </div>
    </div>
  );
}
