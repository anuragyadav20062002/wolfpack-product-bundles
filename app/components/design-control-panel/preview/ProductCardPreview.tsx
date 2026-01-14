import { Text } from "@shopify/polaris";

interface ProductCardPreviewProps {
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
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
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
              backgroundColor: productPriceBgColor,
              padding: "10px 12px",
              borderRadius: "10px",
              border: "1px solid rgba(0, 0, 0, 0.06)"
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
                  letterSpacing: "0.3px"
                }}
              >
                $14.99
              </span>
            </div>
          )}

          {/* Spacer */}
          <div style={{ flex: 1, minHeight: "8px" }} />

          {/* Variant Selector */}
          <div style={{ marginBottom: "12px", flexShrink: 0, position: "relative" }}>
            <select
              style={{
                width: "100%",
                padding: "10px 12px",
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

          {/* Quantity Selector */}
          <div style={{ marginBottom: "12px", flexShrink: 0, position: "relative", display: "flex", justifyContent: "center" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0px",
                backgroundColor: quantitySelectorBgColor,
                borderRadius: `${quantitySelectorBorderRadius}px`,
                overflow: "hidden",
                border: "1px solid #D1D1D1",
              }}
            >
              {/* Minus Button */}
              <button
                style={{
                  backgroundColor: "transparent",
                  color: quantitySelectorTextColor,
                  border: "none",
                  padding: "10px 16px",
                  fontSize: "18px",
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
                  color: quantitySelectorTextColor,
                  fontSize: "16px",
                  fontWeight: 500,
                  padding: "0 16px",
                  minWidth: "40px",
                  textAlign: "center",
                }}
              >
                1
              </div>

              {/* Plus Button */}
              <button
                style={{
                  backgroundColor: "transparent",
                  color: quantitySelectorTextColor,
                  border: "none",
                  padding: "10px 16px",
                  fontSize: "18px",
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

          {/* Add to Bundle Button */}
          <button
            style={{
              width: "100%",
              backgroundColor: buttonBgColor,
              color: buttonTextColor,
              border: "none",
              borderRadius: `${buttonBorderRadius}px`,
              padding: "12px 24px",
              fontSize: `${buttonFontSize}px`,
              fontWeight: buttonFontWeight,
              cursor: "pointer",
              flexShrink: 0,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              position: "relative",
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

          {/* Modal Variant Selector */}
          <select
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: `${modalVariantBorderRadius}px`,
              border: "1px solid #D1D1D1",
              backgroundColor: variantSelectorBgColor,
              color: variantSelectorTextColor,
              fontSize: "14px",
              marginBottom: "16px",
              cursor: "pointer",
            }}
          >
            <option>Select Size</option>
          </select>

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
