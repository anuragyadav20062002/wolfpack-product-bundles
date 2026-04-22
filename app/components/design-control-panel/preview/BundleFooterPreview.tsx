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
  sidebarCardBgColor: string;
  sidebarCardTextColor: string;
  sidebarCardBorderColor: string;
  sidebarCardBorderWidth: number;
  sidebarCardBorderRadius: number;
  sidebarCardPadding: number;
  sidebarCardWidth: number;
  sidebarProductListMaxHeight: number;
  sidebarSkeletonRowCount: number;
  sidebarDiscountBgColor: string;
  sidebarDiscountTextColor: string;
  sidebarButtonBgColor: string;
  sidebarButtonTextColor: string;
  sidebarButtonBorderRadius: number;
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

// Full-page footer layout — matches actual storefront floating-card widget
// Structure: [callout banner] → compact footer bar (thumbstrip | centre column | cta button)
function FullPageFooterLayout({
  highlightTarget,
  footerBgColor,
  footerBorderRadius,
  footerStrikePriceColor,
  footerStrikeFontSize,
  footerStrikeFontWeight,
  footerFinalPriceColor,
  footerFinalPriceFontSize,
  footerFinalPriceFontWeight,
  footerPriceVisibility,
  footerNextButtonBgColor,
  footerNextButtonTextColor,
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
        borderRadius: `${footerBorderRadius || 16}px`,
        minWidth: "480px",
        maxWidth: "640px",
        border: "1px solid rgba(0, 0, 0, 0.08)",
        boxShadow: "0 10px 40px rgba(0, 0, 0, 0.18)",
        overflow: "hidden",
        ...(highlightTarget === "footer" ? HIGHLIGHT_STYLE : {}),
      }}
    >
      {/* Callout banner — shown at top when discount unlocked, matches .footer-callout-banner */}
      {footerDiscountTextVisibility && showSuccessBanner && (
        <div
          style={{
            backgroundColor: successMessageBgColor,
            color: successMessageTextColor,
            padding: "8px 16px",
            fontSize: `${successMessageFontSize}px`,
            fontWeight: successMessageFontWeight,
            textAlign: "center",
            lineHeight: 1.4,
            ...(highlightTarget === "footerDiscountProgress" ? HIGHLIGHT_STYLE : {}),
          }}
        >
          🎉 You unlocked 20% off!
        </div>
      )}

      {/* Footer bar — matches .footer-bar: thumbstrip | centre | cta */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          padding: "0 16px",
          height: "72px",
        }}
      >
        {/* Left: overlapping circular thumbnails — matches .footer-thumbstrip */}
        <div style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
          {SAMPLE_PRODUCTS.map((_, i) => (
            <div
              key={i}
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                background: "#E5E7EB",
                border: "2px solid #fff",
                marginLeft: i === 0 ? 0 : "-10px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <div style={{ width: "24px", height: "24px", background: "#D1D5DB", borderRadius: "3px" }} />
            </div>
          ))}
        </div>

        {/* Centre: stacked toggle + total — matches .footer-centre */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: "3px",
            minWidth: 0,
          }}
        >
          {/* Toggle row — matches .footer-toggle */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              fontSize: "13px",
              fontWeight: 600,
              color: "#333",
              cursor: "pointer",
            }}
          >
            <span>3/3 Products</span>
            <svg viewBox="0 0 20 20" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M5 8l5 5 5-5"/>
            </svg>
          </div>

          {/* Total area — matches .footer-total-area */}
          {footerPriceVisibility && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                flexWrap: "wrap",
                ...(highlightTarget === "footerPrice" ? HIGHLIGHT_STYLE : {}),
              }}
            >
              <span style={{ fontSize: "11px", color: "#666" }}>Total:</span>
              <span
                style={{
                  fontSize: `${footerStrikeFontSize}px`,
                  fontWeight: footerStrikeFontWeight,
                  color: footerStrikePriceColor,
                  textDecoration: "line-through",
                }}
              >
                $89.97
              </span>
              <span
                style={{
                  fontSize: `${footerFinalPriceFontSize}px`,
                  fontWeight: footerFinalPriceFontWeight,
                  color: footerFinalPriceColor,
                }}
              >
                $71.98
              </span>
              {footerDiscountTextVisibility && (
                <span
                  style={{
                    backgroundColor: successMessageBgColor,
                    color: successMessageTextColor,
                    fontSize: "10px",
                    fontWeight: 700,
                    padding: "2px 6px",
                    borderRadius: "100px",
                    whiteSpace: "nowrap",
                  }}
                >
                  20% OFF
                </span>
              )}
            </div>
          )}
        </div>

        {/* Right: CTA button — matches .footer-cta-btn */}
        <div style={highlightTarget === "footerButton" ? HIGHLIGHT_STYLE : {}}>
          <button
            style={{
              backgroundColor: footerNextButtonBgColor,
              color: footerNextButtonTextColor,
              border: "none",
              borderRadius: `${footerNextButtonBorderRadius || 50}px`,
              padding: "10px 20px",
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
              textTransform: "uppercase" as const,
              letterSpacing: "0.5px",
              flexShrink: 0,
            }}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

// Product-page (modal) footer layout — floating pill design matching storefront
function ProductPageFooterLayout({
  highlightTarget,
  footerNextButtonBgColor,
  footerNextButtonTextColor,
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
        position: "relative",
        height: "80px",
        background: "transparent",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        ...(highlightTarget === "footer" ? HIGHLIGHT_STYLE : {}),
      }}
    >
      {/* Cart count pill */}
      <div
        style={{
          position: "absolute",
          bottom: "56px",
          left: "50%",
          transform: "translateX(-50%)",
          background: "#FFFFFF",
          borderRadius: "50px",
          padding: "6px 14px",
          display: "flex",
          alignItems: "center",
          gap: "6px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.12)",
          fontSize: "14px",
          fontWeight: 700,
          color: "#333",
        }}
      >
        2 <ShoppingCartIcon width={18} height={18} color="#333" />
      </div>
      {/* Nav pill */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "40px",
          backgroundColor: footerNextButtonBgColor,
          borderRadius: "50px",
          padding: "14px 25px",
          boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
          ...(highlightTarget === "footerButton" ? HIGHLIGHT_STYLE : {}),
        }}
      >
        <span
          style={{
            color: footerNextButtonTextColor,
            fontSize: "13px",
            fontWeight: 700,
            textTransform: "uppercase" as const,
            letterSpacing: "0.5px",
            opacity: 0.85,
            cursor: "pointer",
          }}
        >
          BACK
        </span>
        <span
          style={{
            color: footerNextButtonTextColor,
            fontSize: "13px",
            fontWeight: 700,
            textTransform: "uppercase" as const,
            letterSpacing: "0.5px",
            cursor: "pointer",
          }}
        >
          NEXT
        </span>
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
  footerNextButtonBgColor,
  footerNextButtonTextColor,
  footerNextButtonBorderColor,
  footerNextButtonBorderRadius,
  footerDiscountTextVisibility,
  sidebarCardBgColor,
  sidebarCardTextColor,
  sidebarCardBorderColor,
  sidebarCardBorderWidth,
  sidebarCardBorderRadius,
  sidebarCardPadding,
  sidebarCardWidth,
  sidebarProductListMaxHeight,
  sidebarSkeletonRowCount,
  sidebarDiscountBgColor,
  sidebarDiscountTextColor,
  sidebarButtonBgColor,
  sidebarButtonTextColor,
  sidebarButtonBorderRadius,
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
          width: `${Math.max(220, Math.min(sidebarCardWidth, 460))}px`,
          maxWidth: "260px",
          background: sidebarCardBgColor || footerBgColor,
          color: sidebarCardTextColor,
          border: `${sidebarCardBorderWidth}px solid ${sidebarCardBorderColor}`,
          borderRadius: `${sidebarCardBorderRadius}px`,
          padding: `${Math.min(sidebarCardPadding, 24)}px`,
          overflow: "hidden",
          boxSizing: "border-box",
          ...(highlightTarget === "footer" ? HIGHLIGHT_STYLE : {}),
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
          <span style={{ fontSize: "15px", fontWeight: 700, color: sidebarCardTextColor }}>Your Bundle</span>
          <span style={{ fontSize: "11px", color: "#BD0000", cursor: "pointer" }}>Clear</span>
        </div>
        <p style={{ margin: "0 0 12px", fontSize: "12px", color: "rgba(17,24,39,0.62)" }}>Review your bundle</p>

        {/* Discount message */}
        {footerDiscountTextVisibility && (
          <div
            style={{
              padding: "8px 10px",
              backgroundColor: sidebarDiscountBgColor || successMessageBgColor,
              color: sidebarDiscountTextColor || successMessageTextColor,
              fontSize: `${successMessageFontSize}px`,
              fontWeight: successMessageFontWeight,
              textAlign: "center",
              borderRadius: "6px",
              marginBottom: "12px",
              ...(highlightTarget === "footerDiscountProgress" ? HIGHLIGHT_STYLE : {}),
            }}
          >
            10% off unlocked!
          </div>
        )}

        {/* Selected items */}
        <div style={{ fontSize: "11px", color: "#6B7280", marginBottom: "6px" }}>
          {highlightTarget === "footer" ? "0 items" : "3 items"}
        </div>
        <div style={{ maxHeight: `${Math.min(sidebarProductListMaxHeight, 170)}px`, overflow: "auto" }}>
          {(highlightTarget === "footer"
            ? Array.from({ length: sidebarSkeletonRowCount }, (_, i) => ({ name: "", variant: "", qty: 0, skeleton: true, key: `skeleton-${i}` }))
            : SAMPLE_PRODUCTS.map((product, i) => ({ ...product, skeleton: false, key: `product-${i}` }))
          ).map((product, i) => (
            <div
              key={product.key}
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
                  {product.skeleton ? <span style={{ display: "block", width: "72%", height: "10px", borderRadius: "4px", background: "#e5e7eb" }} /> : product.name}
                </div>
                {product.skeleton ? (
                  <span style={{ display: "block", width: "44%", height: "8px", borderRadius: "4px", background: "#e5e7eb", marginTop: "5px" }} />
                ) : product.variant && (
                  <div style={{ fontSize: "10px", color: "#888" }}>{product.variant}</div>
                )}
              </div>
              <span
                style={{
                  fontSize: "11px",
                  color: footerFinalPriceColor,
                  fontWeight: footerFinalPriceFontWeight,
                  minWidth: product.skeleton ? "32px" : undefined,
                  height: product.skeleton ? "10px" : undefined,
                  borderRadius: product.skeleton ? "4px" : undefined,
                  background: product.skeleton ? "#e5e7eb" : undefined,
                  ...(highlightTarget === "footerPrice" ? HIGHLIGHT_STYLE : {}),
                }}
              >
                {product.skeleton ? "" : "$9.99"}
              </span>
            </div>
          ))}
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr auto",
            alignItems: "center",
            gap: "12px",
            marginTop: "14px",
            ...(highlightTarget === "footerButton" ? HIGHLIGHT_STYLE : {}),
          }}
        >
          {footerPriceVisibility && (
            <div
              style={{
                ...(highlightTarget === "footerPrice" ? HIGHLIGHT_STYLE : {}),
              }}
            >
              <span style={{ display: "block", fontSize: "13px", fontWeight: 700, color: sidebarCardTextColor }}>Total</span>
              <div style={{ display: "flex", gap: "6px", alignItems: "baseline" }}>
                <span style={{ fontSize: `${footerStrikeFontSize}px`, fontWeight: footerStrikeFontWeight, color: footerStrikePriceColor, textDecoration: "line-through" }}>
                  $69.98
                </span>
                <span style={{ fontSize: `${footerFinalPriceFontSize}px`, fontWeight: footerFinalPriceFontWeight, color: footerFinalPriceColor }}>
                  $62.98
                </span>
              </div>
            </div>
          )}
          <button
            style={{
              minWidth: "104px",
              backgroundColor: sidebarButtonBgColor || footerNextButtonBgColor,
              color: sidebarButtonTextColor || footerNextButtonTextColor,
              border: `1px solid ${footerNextButtonBorderColor}`,
              borderRadius: `${sidebarButtonBorderRadius ?? footerNextButtonBorderRadius}px`,
              padding: "10px 14px",
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
    sidebarCardBgColor,
    sidebarCardTextColor,
    sidebarCardBorderColor,
    sidebarCardBorderWidth,
    sidebarCardBorderRadius,
    sidebarCardPadding,
    sidebarCardWidth,
    sidebarProductListMaxHeight,
    sidebarSkeletonRowCount,
    sidebarDiscountBgColor,
    sidebarDiscountTextColor,
    sidebarButtonBgColor,
    sidebarButtonTextColor,
    sidebarButtonBorderRadius,
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
    sidebarCardBgColor,
    sidebarCardTextColor,
    sidebarCardBorderColor,
    sidebarCardBorderWidth,
    sidebarCardBorderRadius,
    sidebarCardPadding,
    sidebarCardWidth,
    sidebarProductListMaxHeight,
    sidebarSkeletonRowCount,
    sidebarDiscountBgColor,
    sidebarDiscountTextColor,
    sidebarButtonBgColor,
    sidebarButtonTextColor,
    sidebarButtonBorderRadius,
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
    sidebarCardBgColor,
    sidebarCardTextColor,
    sidebarCardBorderColor,
    sidebarCardBorderWidth,
    sidebarCardBorderRadius,
    sidebarCardPadding,
    sidebarCardWidth,
    sidebarProductListMaxHeight,
    sidebarSkeletonRowCount,
    sidebarDiscountBgColor,
    sidebarDiscountTextColor,
    sidebarButtonBgColor,
    sidebarButtonTextColor,
    sidebarButtonBorderRadius,
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
