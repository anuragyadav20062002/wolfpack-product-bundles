/**
 * PromoBannerPreview
 *
 * Renders the real .promo-banner HTML structure.
 * CSS variables are injected by the parent <PreviewScope>:
 *   --bundle-promo-banner-bg, --bundle-promo-banner-title-color/font-size/font-weight,
 *   --bundle-promo-banner-subtitle-color/font-size, --bundle-promo-banner-note-color/font-size,
 *   --bundle-promo-banner-radius, --bundle-promo-banner-padding
 */

import { Text } from "@shopify/polaris";
import { HighlightBox } from "./HighlightBox";

interface PromoBannerPreviewProps {
  promoBannerEnabled: boolean;
  promoBannerBgColor: string;
}

export function PromoBannerPreview({ promoBannerEnabled, promoBannerBgColor }: PromoBannerPreviewProps) {
  // Real .promo-banner HTML matching the widget's createPromoBanner() output.
  // Classes: .promo-banner > .promo-banner-content > .promo-banner-subtitle +
  //          .promo-banner-title + .promo-banner-note
  const promoBannerHTML = `
<div class="promo-banner" style="opacity:${promoBannerEnabled ? 1 : 0.5};position:relative;">
  ${!promoBannerEnabled ? `
    <div style="position:absolute;top:12px;right:12px;background:#EF4444;color:#fff;padding:4px 8px;border-radius:4px;font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">
      Disabled
    </div>
  ` : ''}
  <div class="promo-banner-content">
    <div class="promo-banner-subtitle">Special Offer</div>
    <div class="promo-banner-title">Add any 3 products, get 20% off!</div>
    <div class="promo-banner-note">*Discount applied automatically at checkout</div>
  </div>
</div>
  `.trim();

  return (
    <div style={{ textAlign: "center", position: "relative" }}>
      <Text as="h3" variant="headingLg" fontWeight="semibold">
        Promo Banner
      </Text>
      <Text as="p" variant="bodySm" tone="subdued">
        Full-page bundles only
      </Text>
      <div style={{ marginTop: "40px", display: "inline-block", maxWidth: "100%" }}>
        <HighlightBox active>
          {/* eslint-disable-next-line react/no-danger */}
          <div dangerouslySetInnerHTML={{ __html: promoBannerHTML }} />
        </HighlightBox>
        <div style={{ marginTop: "24px" }}>
          <Text as="p" variant="bodySm" tone="subdued">
            Preview updates as you customize
          </Text>
        </div>
      </div>
    </div>
  );
}
