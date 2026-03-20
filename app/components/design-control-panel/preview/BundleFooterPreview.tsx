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
  bundleType?: BundleType;
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
function BundleTypeToggle({ selected, onChange, options }: {
  selected: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <div style={{ marginBottom: "16px", display: "flex", gap: "8px", justifyContent: "center", flexWrap: "wrap" }}>
      {options.map(({ value, label }) => (
        <button
          key={value}
          onClick={() => onChange(value)}
          style={{
            padding: "8px 16px",
            border: `2px solid ${selected === value ? "#000" : "#ddd"}`,
            borderRadius: "6px",
            background: selected === value ? "#000" : "#fff",
            color: selected === value ? "#fff" : "#333",
            cursor: "pointer",
            fontSize: "12px",
            fontWeight: 500,
          }}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

// Full-page footer layout — matches storefront: Success Banner → Progress Message → Product Tiles → Back | Total | Next
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
  successMessageFontSize,
  successMessageFontWeight,
  successMessageTextColor,
  successMessageBgColor,
  showSuccessBanner = false,
}: Omit<BundleFooterPreviewProps, "activeSubSection" | "footerTotalBgColor"> & { highlightTarget: HighlightTarget; showSuccessBanner?: boolean }) {
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
        overflow: "hidden",
        ...(highlightTarget === "footer" ? HIGHLIGHT_STYLE : {}),
      }}
    >
      {/* SECTION 0: Success Banner (Beco-style — shown when discount unlocked) */}
      {footerDiscountTextVisibility && showSuccessBanner && (
        <div
          style={{
            width: "100%",
            backgroundColor: successMessageBgColor,
            color: successMessageTextColor,
            textAlign: "center",
            padding: "10px 16px",
            fontSize: `${successMessageFontSize}px`,
            fontWeight: successMessageFontWeight,
            lineHeight: 1.4,
            boxSizing: "border-box",
            ...(highlightTarget === "footerDiscountProgress" ? HIGHLIGHT_STYLE : {}),
          }}
        >
          🎉 Best Deal Unlocked! You&apos;ve got <strong>10% off</strong>
        </div>
      )}

      {/* SECTION 1: Progress / Discount Message (shown when discount not yet unlocked) */}
      {footerDiscountTextVisibility && !showSuccessBanner && (
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
            <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: "8px" }}>
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
              {/* Discount badge (Beco-style) */}
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  backgroundColor: successMessageBgColor,
                  color: successMessageTextColor,
                  fontSize: "11px",
                  fontWeight: 700,
                  padding: "3px 8px",
                  borderRadius: "12px",
                  whiteSpace: "nowrap",
                  letterSpacing: "0.3px",
                }}
              >
                20% OFF
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

// Sidebar layout preview — right-hand panel with selected items list, total, and nav buttons
function SidebarFooterLayout({
  highlightTarget,
  footerBgColor,
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
  successMessageBgColor,
  successMessageTextColor,
  successMessageFontSize,
  successMessageFontWeight,
}: Omit<BundleFooterPreviewProps, "activeSubSection" | "footerTotalBgColor"> & { highlightTarget: HighlightTarget }) {
  return (
    <div style={{ display: "flex", gap: "16px", alignItems: "flex-start", justifyContent: "center" }}>
      {/* Left: mock product grid area */}
      <div
        style={{
          flex: 1,
          minWidth: "260px",
          maxWidth: "320px",
          background: "#f8f9fa",
          borderRadius: "12px",
          padding: "16px",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "8px",
        }}
      >
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            style={{
              background: "#e5e7eb",
              borderRadius: "8px",
              height: "80px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div style={{ width: "32px", height: "32px", background: "#d1d5db", borderRadius: "4px" }} />
          </div>
        ))}
      </div>

      {/* Right: sidebar panel */}
      <div
        style={{
          width: "220px",
          background: footerBgColor,
          border: "1px solid rgba(0,0,0,0.1)",
          borderRadius: "12px",
          overflow: "hidden",
          boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
          ...(highlightTarget === "footer" ? HIGHLIGHT_STYLE : {}),
        }}
      >
        {/* Header */}
        <div style={{ padding: "12px 14px 8px", borderBottom: "1px solid rgba(0,0,0,0.07)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "13px", fontWeight: 600, color: "#111" }}>Your Bundle</span>
          <span style={{ fontSize: "11px", color: "#999", cursor: "pointer" }}>Clear all</span>
        </div>

        {/* Discount message */}
        {footerDiscountTextVisibility && (
          <div
            style={{
              padding: "8px 14px",
              backgroundColor: successMessageBgColor,
              color: successMessageTextColor,
              fontSize: `${successMessageFontSize}px`,
              fontWeight: successMessageFontWeight,
              textAlign: "center",
              ...(highlightTarget === "footerDiscountProgress" ? HIGHLIGHT_STYLE : {}),
            }}
          >
            🎉 10% off unlocked!
          </div>
        )}

        {/* Selected items */}
        <div style={{ padding: "8px 14px" }}>
          {SAMPLE_PRODUCTS.map((product, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "6px 0",
                borderBottom: i < SAMPLE_PRODUCTS.length - 1 ? "1px solid rgba(0,0,0,0.05)" : "none",
              }}
            >
              <div style={{ width: "32px", height: "32px", background: "#e5e7eb", borderRadius: "4px", flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "11px", fontWeight: 500, color: "#333", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {product.name}
                </div>
                {product.variant && (
                  <div style={{ fontSize: "10px", color: "#888" }}>{product.variant}</div>
                )}
              </div>
              <span
                style={{
                  fontSize: "11px",
                  color: footerFinalPriceColor,
                  fontWeight: footerFinalPriceFontWeight,
                  ...(highlightTarget === "footerPrice" ? HIGHLIGHT_STYLE : {}),
                }}
              >
                $9.99
              </span>
            </div>
          ))}
        </div>

        {/* Total row */}
        {footerPriceVisibility && (
          <div
            style={{
              padding: "8px 14px",
              borderTop: "1px solid rgba(0,0,0,0.07)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              ...(highlightTarget === "footerPrice" ? HIGHLIGHT_STYLE : {}),
            }}
          >
            <span style={{ fontSize: "13px", fontWeight: 600, color: "#111" }}>Total</span>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
              <span style={{ fontSize: `${footerStrikeFontSize}px`, fontWeight: footerStrikeFontWeight, color: footerStrikePriceColor, textDecoration: "line-through" }}>
                $29.97
              </span>
              <span style={{ fontSize: `${footerFinalPriceFontSize}px`, fontWeight: footerFinalPriceFontWeight, color: footerFinalPriceColor }}>
                $26.97
              </span>
            </div>
          </div>
        )}

        {/* Nav buttons */}
        <div
          style={{
            padding: "10px 14px",
            display: "flex",
            gap: "8px",
            ...(highlightTarget === "footerButton" ? HIGHLIGHT_STYLE : {}),
          }}
        >
          <button
            style={{
              flex: 1,
              backgroundColor: footerBackButtonBgColor,
              color: footerBackButtonTextColor,
              border: `1px solid ${footerBackButtonBorderColor}`,
              borderRadius: `${footerBackButtonBorderRadius}px`,
              padding: "8px",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Back
          </button>
          <button
            style={{
              flex: 2,
              backgroundColor: footerNextButtonBgColor,
              color: footerNextButtonTextColor,
              border: `1px solid ${footerNextButtonBorderColor}`,
              borderRadius: `${footerNextButtonBorderRadius}px`,
              padding: "8px",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Next Step
          </button>
        </div>
      </div>
    </div>
  );
}

export function BundleFooterPreview(props: BundleFooterPreviewProps) {
  const isFullPageBundle = props.bundleType === BundleType.FULL_PAGE;

  // Toggle options filtered to only show layouts relevant to the current bundle type
  const toggleOptions = isFullPageBundle
    ? [
        { value: BundleType.FULL_PAGE, label: "Full Page · Floating" },
        { value: "full_page_sidebar", label: "Full Page · Sidebar" },
      ]
    : [
        { value: BundleType.PRODUCT_PAGE, label: "Product Page" },
      ];

  const [bundleType, setBundleType] = useState<string>(
    isFullPageBundle ? BundleType.FULL_PAGE : BundleType.PRODUCT_PAGE
  );

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
    successMessageFontSize,
    successMessageFontWeight,
    successMessageTextColor,
    successMessageBgColor,
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
          <BundleTypeToggle selected={bundleType} onChange={setBundleType} options={toggleOptions} />
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

  // footerDiscountProgress + sidebar: show the sidebar with discount message highlighted
  if (activeSubSection === "footerDiscountProgress" && bundleType === "full_page_sidebar") {
    const sidebarProps = {
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
      successMessageFontSize,
      successMessageFontWeight,
      successMessageTextColor,
      successMessageBgColor,
    };
    return (
      <div style={{ textAlign: "center", position: "relative" }}>
        <Text as="h3" variant="headingLg" fontWeight="semibold">
          {titles[activeSubSection]}
        </Text>
        <div style={{ marginTop: "24px" }}>
          <BundleTypeToggle selected={bundleType} onChange={setBundleType} options={toggleOptions} />
        </div>
        <div style={{ marginTop: "24px" }}>
          <SidebarFooterLayout {...sidebarProps} />
        </div>
        <div style={{ marginTop: "16px" }}>
          <Text as="p" variant="bodySm" tone="subdued">
            Discount message shown in the sidebar header when threshold is reached
          </Text>
        </div>
      </div>
    );
  }

  // footerDiscountProgress + full-page: show both progress and success-banner states side by side
  if (activeSubSection === "footerDiscountProgress" && bundleType === BundleType.FULL_PAGE) {
    return (
      <div style={{ textAlign: "center", position: "relative" }}>
        <Text as="h3" variant="headingLg" fontWeight="semibold">
          {titles[activeSubSection]}
        </Text>
        <div style={{ marginTop: "24px" }}>
          <BundleTypeToggle selected={bundleType} onChange={setBundleType} options={toggleOptions} />
        </div>
        <div style={{ marginTop: "24px", display: "flex", flexDirection: "column", gap: "24px", alignItems: "center" }}>
          {/* Progress state */}
          <div>
            <div style={{ marginBottom: "8px", fontSize: "11px", color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              — In Progress —
            </div>
            <FullPageFooterLayout {...sharedFullPageProps} showSuccessBanner={false} />
          </div>
          {/* Success banner state */}
          <div>
            <div style={{ marginBottom: "8px", fontSize: "11px", color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              — When Discount Unlocked —
            </div>
            <FullPageFooterLayout {...sharedFullPageProps} showSuccessBanner={true} />
          </div>
        </div>
        <div style={{ marginTop: "16px" }}>
          <Text as="p" variant="bodySm" tone="subdued">
            Top banner appears when the discount threshold is reached
          </Text>
        </div>
      </div>
    );
  }

  // Shared sidebar props (subset of sharedFullPageProps)
  const sharedSidebarProps = {
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
    successMessageFontSize,
    successMessageFontWeight,
    successMessageTextColor,
    successMessageBgColor,
  };

  const layoutLabels: Record<string, string> = {
    [BundleType.PRODUCT_PAGE]: "Product-page bundle (modal) footer",
    [BundleType.FULL_PAGE]: "Full-page bundle — floating footer layout",
    "full_page_sidebar": "Full-page bundle — sidebar panel layout",
  };

  // All other subsections: show toggle + shared footer layout
  return (
    <div style={{ textAlign: "center", position: "relative" }}>
      <Text as="h3" variant="headingLg" fontWeight="semibold">
        {titles[activeSubSection] ?? activeSubSection}
      </Text>
      <div style={{ marginTop: "24px" }}>
        <BundleTypeToggle selected={bundleType} onChange={setBundleType} options={toggleOptions} />
      </div>
      <div style={{ marginTop: "24px", display: "inline-block", position: "relative" }}>
        {bundleType === BundleType.FULL_PAGE ? (
          <FullPageFooterLayout {...sharedFullPageProps} />
        ) : bundleType === "full_page_sidebar" ? (
          <SidebarFooterLayout {...sharedSidebarProps} />
        ) : (
          <ProductPageFooterLayout {...sharedProductPageProps} />
        )}
      </div>
      <div style={{ marginTop: "16px" }}>
        <Text as="p" variant="bodySm" tone="subdued">
          {layoutLabels[bundleType] ?? ""}
        </Text>
      </div>
    </div>
  );
}
