import { Text } from "@shopify/polaris";

interface PromoBannerPreviewProps {
  promoBannerEnabled: boolean;
  promoBannerBgColor: string;
  promoBannerTitleColor: string;
  promoBannerTitleFontSize: number;
  promoBannerTitleFontWeight: number;
  promoBannerSubtitleColor: string;
  promoBannerSubtitleFontSize: number;
  promoBannerNoteColor: string;
  promoBannerNoteFontSize: number;
  promoBannerBorderRadius: number;
  promoBannerPadding: number;
}

export function PromoBannerPreview(props: PromoBannerPreviewProps) {
  const {
    promoBannerEnabled,
    promoBannerBgColor,
    promoBannerTitleColor,
    promoBannerTitleFontSize,
    promoBannerTitleFontWeight,
    promoBannerSubtitleColor,
    promoBannerSubtitleFontSize,
    promoBannerNoteColor,
    promoBannerNoteFontSize,
    promoBannerBorderRadius,
    promoBannerPadding,
  } = props;

  return (
    <div style={{ textAlign: "center", position: "relative" }}>
      <Text as="h3" variant="headingLg" fontWeight="semibold">
        Promo Banner
      </Text>
      <Text as="p" variant="bodySm" tone="subdued">
        Full-page bundles only
      </Text>
      <div style={{ marginTop: "40px", display: "inline-block", position: "relative" }}>
        {/* Promo Banner Container */}
        <div
          style={{
            backgroundColor: promoBannerBgColor,
            borderRadius: `${promoBannerBorderRadius}px`,
            padding: `${promoBannerPadding}px 48px`,
            minWidth: "500px",
            maxWidth: "600px",
            textAlign: "center",
            position: "relative",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06)",
            opacity: promoBannerEnabled ? 1 : 0.5,
          }}
        >
          {/* Disabled Badge */}
          {!promoBannerEnabled && (
            <div
              style={{
                position: "absolute",
                top: "12px",
                right: "12px",
                backgroundColor: "#EF4444",
                color: "#FFFFFF",
                padding: "4px 8px",
                borderRadius: "4px",
                fontSize: "10px",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              Disabled
            </div>
          )}

          {/* Subtitle */}
          <div
            style={{
              fontSize: `${promoBannerSubtitleFontSize}px`,
              fontWeight: 600,
              color: promoBannerSubtitleColor,
              textTransform: "uppercase",
              letterSpacing: "2px",
              marginBottom: "12px",
            }}
          >
            Special Offer
          </div>

          {/* Title */}
          <div
            style={{
              fontSize: `${promoBannerTitleFontSize}px`,
              fontWeight: promoBannerTitleFontWeight,
              color: promoBannerTitleColor,
              margin: "0 0 12px",
              lineHeight: 1.3,
            }}
          >
            Add any 3 products to your basket, get 20% off!
          </div>

          {/* Note */}
          <div
            style={{
              fontSize: `${promoBannerNoteFontSize}px`,
              color: promoBannerNoteColor,
              fontStyle: "italic",
            }}
          >
            *Discount applied automatically at checkout
          </div>
        </div>

        {/* Preview Label */}
        <div style={{ marginTop: "24px" }}>
          <Text as="p" variant="bodySm" tone="subdued">
            Preview updates as you customize
          </Text>
        </div>
      </div>
    </div>
  );
}
