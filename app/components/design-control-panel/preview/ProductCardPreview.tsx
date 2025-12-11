import { Text } from "@shopify/polaris";

interface ProductCardPreviewProps {
  productCardBgColor: string;
  productCardFontColor: string;
  productCardFontSize: number;
  productCardFontWeight: number;
  productCardImageFit: string;
  productTitleVisibility: boolean;
  productPriceVisibility: boolean;
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
  } = props;

  return (
    <div style={{ textAlign: "center", marginTop: "80px", display: "inline-block", position: "relative" }}>
      {/* Product Card Preview */}
      <div
        style={{
          backgroundColor: productCardBgColor,
          borderRadius: "12px",
          padding: "16px",
          width: "280px",
          minHeight: "420px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
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
            height: "200px",
            backgroundColor: "#FFFFFF",
            borderRadius: "8px",
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
            <div style={{ margin: "8px 0", textAlign: "center", flexShrink: 0, position: "relative" }}>
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

      {/* Annotation Labels */}
      <div style={{ marginTop: "40px" }}>
        <Text as="p" variant="bodySm" tone="subdued">
          Preview updates as you customize
        </Text>
      </div>
    </div>
  );
}
