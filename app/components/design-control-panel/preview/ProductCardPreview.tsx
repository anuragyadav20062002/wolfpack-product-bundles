import { Text } from "@shopify/polaris";

const HIGHLIGHT_STYLE = {
  outline: "2px dashed #5C6AC4",
  outlineOffset: "4px",
};

interface ProductCardPreviewProps {
  activeSubSection: string;
  productCardBgColor: string;
  productCardFontColor: string;
  productCardFontSize: number;
  productCardFontWeight: number;
  productCardImageFit: string;
  productTitleVisibility: boolean;
  productPriceVisibility: boolean;
  productPriceBgColor: string;
  productStrikePriceColor: string;
  productStrikeFontSize: number;
  productStrikeFontWeight: number;
  productFinalPriceColor: string;
  productFinalPriceFontSize: number;
  productFinalPriceFontWeight: number;
  variantSelectorBgColor: string;
  variantSelectorTextColor: string;
  variantSelectorBorderRadius: number;
  quantitySelectorBgColor: string;
  quantitySelectorTextColor: string;
  quantitySelectorBorderRadius: number;
  buttonBgColor: string;
  buttonTextColor: string;
  buttonBorderRadius: number;
  buttonFontSize: number;
  buttonFontWeight: number;
  buttonAddToCartText: string;
  // Phase 6 - Product Card Layout & Dimensions
  productCardWidth: number;
  productCardHeight: number;
  productCardSpacing: number;
  productCardBorderRadius: number;
  productCardPadding: number;
  productCardBorderWidth: number;
  productCardBorderColor: string;
  productCardShadow: string;
  productCardHoverShadow: string;
  // Phase 6 - Product Image
  productImageHeight: number;
  productImageBorderRadius: number;
  productImageBgColor: string;
  // Phase 6 - Product Modal Styling
  modalBgColor: string;
  modalBorderRadius: number;
  modalTitleFontSize: number;
  modalTitleFontWeight: number;
  modalPriceFontSize: number;
  modalVariantBorderRadius: number;
  modalButtonBgColor: string;
  modalButtonTextColor: string;
  modalButtonBorderRadius: number;
}

export function ProductCardPreview(props: ProductCardPreviewProps) {
  const {
    activeSubSection,
    productCardBgColor,
    productCardFontColor,
    productCardFontSize,
    productCardFontWeight,
    productCardImageFit,
    productTitleVisibility,
    productPriceVisibility,
    productPriceBgColor,
    productStrikePriceColor,
    productStrikeFontSize,
    productStrikeFontWeight,
    productFinalPriceColor,
    productFinalPriceFontSize,
    productFinalPriceFontWeight,
    variantSelectorBgColor,
    variantSelectorTextColor,
    variantSelectorBorderRadius,
    quantitySelectorBgColor,
    quantitySelectorTextColor,
    quantitySelectorBorderRadius,
    buttonBgColor,
    buttonTextColor,
    buttonBorderRadius,
    buttonFontSize,
    buttonFontWeight,
    buttonAddToCartText,
    // Phase 6 props
    productCardWidth,
    productCardHeight,
    productCardSpacing,
    productCardBorderRadius,
    productCardPadding,
    productCardBorderWidth,
    productCardBorderColor,
    productCardShadow,
    productCardHoverShadow,
    productImageHeight,
    productImageBorderRadius,
    productImageBgColor,
    modalBgColor,
    modalBorderRadius,
    modalTitleFontSize,
    modalTitleFontWeight,
    modalPriceFontSize,
    modalVariantBorderRadius,
    modalButtonBgColor,
    modalButtonTextColor,
    modalButtonBorderRadius,
  } = props;

  return (
    <div style={{ textAlign: "center", marginTop: "80px", display: "inline-block", position: "relative" }}>
      {/* Product Card Preview */}
      <div
        style={{
          backgroundColor: productCardBgColor,
          borderRadius: `${productCardBorderRadius}px`,
          padding: `${productCardPadding}px`,
          width: `${productCardWidth}px`,
          minHeight: `${productCardHeight}px`,
          boxShadow: productCardShadow,
          border: `${productCardBorderWidth}px solid ${productCardBorderColor}`,
          position: "relative",
          display: "flex",
          flexDirection: "column",
          ...(activeSubSection === "productCard" ? HIGHLIGHT_STYLE : {}),
        }}
      >
        {/* Checkmark Badge for Selected State */}
        <div
          style={{
            position: "absolute",
            top: "8px",
            right: "8px",
            width: "24px",
            height: "24px",
            borderRadius: "50%",
            backgroundColor: "#4CAF50",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontSize: "14px",
            fontWeight: "bold",
            zIndex: 1,
          }}
        >
          ✓
        </div>

        {/* Product Image */}
        <div
          style={{
            width: "100%",
            height: `${productImageHeight}px`,
            backgroundColor: productImageBgColor,
            borderRadius: `${productImageBorderRadius}px`,
            marginBottom: "12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
            flexShrink: 0,
            position: "relative",
          }}
        >
          <img
            src="/bundle.png"
            alt="Product"
            style={{
              width: "100%",
              height: "100%",
              objectFit: productCardImageFit as any,
            }}
          />
        </div>

        {/* Content Container with Flex Grow */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
          {/* Typography Area (Title + Price) */}
          <div style={activeSubSection === "productCardTypography" ? HIGHLIGHT_STYLE : {}}>
            {/* Product Title - Conditional Rendering */}
            {productTitleVisibility && (
              <div
                style={{
                  color: productCardFontColor,
                  fontSize: `${productCardFontSize}px`,
                  fontWeight: productCardFontWeight,
                  textAlign: "center",
                  marginBottom: "8px",
                  overflow: "hidden",
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  lineHeight: 1.4,
                  minHeight: "calc(1.4em * 2)",
                  flexShrink: 0,
                  position: "relative",
                }}
              >
                PRODUCT NAME
              </div>
            )}

            {/* Prices */}
            {productPriceVisibility && (
              <div style={{
                margin: "12px 0",
                textAlign: "center",
                flexShrink: 0,
                position: "relative",
              }}>
                <span
                  style={{
                    color: productStrikePriceColor,
                    fontSize: `${productStrikeFontSize}px`,
                    fontWeight: productStrikeFontWeight,
                    textDecoration: "line-through",
                    marginRight: "8px",
                  }}
                >
                  $19.99
                </span>
                <span
                  style={{
                    color: productFinalPriceColor,
                    fontSize: `${productFinalPriceFontSize}px`,
                    fontWeight: productFinalPriceFontWeight,
                  }}
                >
                  $14.99
                </span>
              </div>
            )}
          </div>

          {/* Spacer */}
          <div style={{ flex: 1, minHeight: "8px" }} />

          {/* Variant & Quantity Selectors */}
          <div style={activeSubSection === "quantityVariantSelector" ? HIGHLIGHT_STYLE : {}}>
          {/* Variant Selector */}
          <div style={{ marginBottom: "12px", flexShrink: 0, position: "relative" }}>
            <select
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: `${variantSelectorBorderRadius}px`,
                border: "1px solid #D1D1D1",
                backgroundColor: variantSelectorBgColor,
                color: variantSelectorTextColor,
                fontSize: "14px",
                cursor: "pointer",
                appearance: "none",
                backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%23303030' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\")",
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 12px center",
              }}
            >
              <option>Size: M</option>
            </select>
          </div>

          {/* Inline Quantity Controls (matches storefront .inline-quantity-controls) */}
          <div style={{ marginBottom: "12px", flexShrink: 0, position: "relative" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                width: "100%",
                backgroundColor: buttonBgColor,
                borderRadius: `${buttonBorderRadius}px`,
                overflow: "hidden",
                boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
              }}
            >
              {/* Minus Button */}
              <button
                style={{
                  backgroundColor: "transparent",
                  color: buttonTextColor,
                  border: "none",
                  width: "48px",
                  height: "48px",
                  fontSize: "24px",
                  fontWeight: "bold",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                −
              </button>

              {/* Quantity Display */}
              <div
                style={{
                  color: buttonTextColor,
                  fontSize: "16px",
                  fontWeight: 600,
                  flex: 1,
                  textAlign: "center",
                }}
              >
                1
              </div>

              {/* Plus Button */}
              <button
                style={{
                  backgroundColor: "transparent",
                  color: buttonTextColor,
                  border: "none",
                  width: "48px",
                  height: "48px",
                  fontSize: "24px",
                  fontWeight: "bold",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                +
              </button>
            </div>
          </div>
          </div>

          {/* Add to Bundle Button */}
          <button
            style={{
              width: "100%",
              background: `linear-gradient(135deg, ${buttonBgColor} 0%, rgba(0,0,0,0.9) 100%)`,
              color: buttonTextColor,
              border: "none",
              borderRadius: `${buttonBorderRadius}px`,
              padding: "14px 20px",
              fontSize: `${buttonFontSize}px`,
              fontWeight: buttonFontWeight,
              cursor: "pointer",
              flexShrink: 0,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              position: "relative",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
              marginTop: "auto",
              ...(activeSubSection === "button" ? HIGHLIGHT_STYLE : {}),
            }}
          >
            {buttonAddToCartText}
          </button>
        </div>
      </div>

      {/* Modal Preview Section (Phase 6) */}
      <div style={{ marginTop: "32px", textAlign: "center" }}>
        <Text as="p" variant="headingSm" tone="subdued" fontWeight="semibold">
          Product Modal Preview
        </Text>
        <div
          style={{
            marginTop: "16px",
            backgroundColor: modalBgColor,
            borderRadius: `${modalBorderRadius}px`,
            padding: "24px",
            width: "320px",
            boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
            textAlign: "left",
          }}
        >
          {/* Modal Title */}
          <div
            style={{
              fontSize: `${modalTitleFontSize}px`,
              fontWeight: modalTitleFontWeight,
              color: productCardFontColor,
              marginBottom: "12px",
            }}
          >
            Product Modal
          </div>

          {/* Modal Price */}
          <div
            style={{
              fontSize: `${modalPriceFontSize}px`,
              fontWeight: 600,
              color: productFinalPriceColor,
              marginBottom: "16px",
            }}
          >
            $14.99
          </div>

          {/* Modal Variant Buttons */}
          <div style={{ marginBottom: "16px" }}>
            <div style={{ fontSize: "13px", fontWeight: 500, color: productCardFontColor, marginBottom: "8px" }}>
              Size: <span style={{ fontWeight: 600 }}>M</span>
            </div>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {["S", "M", "L"].map((size) => (
                <button
                  key={size}
                  style={{
                    padding: "8px 16px",
                    borderRadius: `${modalVariantBorderRadius}px`,
                    border: size === "M" ? "2px solid #000" : "1px solid #D1D1D1",
                    backgroundColor: size === "M" ? "#F3F4F6" : "#FFFFFF",
                    color: productCardFontColor,
                    fontSize: "13px",
                    fontWeight: size === "M" ? 600 : 400,
                    cursor: "pointer",
                    minWidth: "44px",
                  }}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Add To Box Button */}
          <button
            style={{
              width: "100%",
              backgroundColor: modalButtonBgColor,
              color: modalButtonTextColor,
              border: "none",
              borderRadius: `${modalButtonBorderRadius}px`,
              padding: "12px 24px",
              fontSize: "15px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Add To Box
          </button>
        </div>
      </div>

      {/* Annotation Labels */}
      <div style={{ marginTop: "40px" }}>
        <Text as="p" variant="bodySm" tone="subdued">
          Preview updates as you customize
        </Text>
      </div>
    </div>
  );
}
