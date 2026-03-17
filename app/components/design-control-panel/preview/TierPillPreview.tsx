/**
 * TierPillPreview
 *
 * Renders a representative .bundle-tier-pill-bar with sample pills.
 * CSS variables are injected by the parent <PreviewScope>:
 *   --bundle-tier-pill-active-bg/text, --bundle-tier-pill-inactive-bg/text,
 *   --bundle-tier-pill-hover-bg, --bundle-tier-pill-border,
 *   --bundle-tier-pill-border-radius, --bundle-tier-pill-height,
 *   --bundle-tier-pill-font-size, --bundle-tier-pill-font-weight,
 *   --bundle-tier-pill-gap
 */

import { Text } from "@shopify/polaris";
import { HighlightBox } from "./HighlightBox";

const SAMPLE_TIERS = [
  { label: "Buy 2 @ ₹499", active: true },
  { label: "Buy 3 @ ₹699", active: false },
  { label: "Buy 4 @ ₹849", active: false },
];

export function TierPillPreview() {
  const pillBarHTML = `
<div class="bundle-tier-pill-bar" role="group" aria-label="Bundle pricing tiers">
  ${SAMPLE_TIERS.map(({ label, active }) => `
  <button
    type="button"
    class="bundle-tier-pill${active ? ' bundle-tier-pill--active' : ''}"
    aria-pressed="${active}"
  >${label}</button>
  `).join('')}
</div>
  `.trim();

  return (
    <div style={{ textAlign: "center" }}>
      <Text as="h3" variant="headingLg" fontWeight="semibold">
        Pricing Tier Pills
      </Text>
      <Text as="p" variant="bodySm" tone="subdued">
        Full-page bundles only
      </Text>
      <div style={{ marginTop: "40px", display: "inline-block", maxWidth: "100%" }}>
        <HighlightBox active>
          {/* eslint-disable-next-line react/no-danger */}
          <div dangerouslySetInnerHTML={{ __html: pillBarHTML }} />
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
