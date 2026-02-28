/**
 * BundleHeaderPreview
 *
 * Renders real widget HTML for the bundle header tabs and header text.
 * CSS variables are injected by the parent <PreviewScope>.
 *
 * Sub-sections:
 * - headerTabs: Shows tabs for both product-page (.bundle-header-tab) and
 *   full-page (.step-tab) bundle widgets with a toggle to switch between them
 * - headerText: Shows .bundle-header-instructions text using --bundle-conditions-text-*
 *   and --bundle-discount-text-* vars
 */

import { Text } from "@shopify/polaris";
import { useState } from "react";
import { HighlightBox } from "./HighlightBox";
import { BundleType } from "../../../constants/bundle";

// Real modal header tab HTML matching ComponentGenerator.renderTab() output.
// Classes: .bundle-header-tab(.active|.completed)
const headerTabsHTML = `
<div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center;">
  <button class="bundle-header-tab active" data-step-index="0">Step 1 ✓</button>
  <button class="bundle-header-tab completed" data-step-index="1">Step 2 ✓</button>
  <button class="bundle-header-tab" data-step-index="2">Step 3</button>
</div>
`.trim();

// Full-page step tabs HTML matching createStepTimeline() output.
// Classes: .step-tabs-container > .step-tab(.active|.completed|.locked)
// Uses real CSS classes from bundle-widget-full-page.css (injected by PreviewScope)
const fullPageTabsHTML = `
<div class="step-tabs-container" style="max-width:580px;">
  <div class="step-tab active completed" data-step-index="0">
    <div class="tab-number">1</div>
    <div class="tab-info">
      <span class="tab-name">Choose Tops</span>
      <span class="tab-count">2 selected</span>
    </div>
    <div class="tab-check">
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
        <path d="M13 4L6 11L3 8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </div>
  </div>
  <div class="step-tab" data-step-index="1">
    <div class="tab-number">2</div>
    <div class="tab-info">
      <span class="tab-name">Choose Bottoms</span>
    </div>
  </div>
  <div class="step-tab locked" data-step-index="2">
    <div class="tab-number">3</div>
    <div class="tab-info">
      <span class="tab-name">Accessories</span>
    </div>
    <div class="tab-lock">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
      </svg>
    </div>
  </div>
</div>
`.trim();

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

interface BundleHeaderPreviewProps {
  activeSubSection: string;
}

export function BundleHeaderPreview({ activeSubSection }: BundleHeaderPreviewProps) {
  const [bundleType, setBundleType] = useState<string>(BundleType.PRODUCT_PAGE);

  // Header Tabs sub-section
  if (activeSubSection === "headerTabs") {
    return (
      <div style={{ textAlign: "center", position: "relative" }}>
        <Text as="h3" variant="headingLg" fontWeight="semibold">
          Tabs
        </Text>
        <div style={{ marginTop: "24px" }}>
          <BundleTypeToggle selected={bundleType} onChange={setBundleType} />
        </div>
        <div
          style={{
            marginTop: "24px",
            padding: "40px",
            border: "1px solid #E3E3E3",
            borderRadius: "8px",
            backgroundColor: "#FAFAFA",
            display: "inline-block",
          }}
        >
          <HighlightBox active>
            {bundleType === BundleType.FULL_PAGE ? (
              /* eslint-disable-next-line react/no-danger */
              <div dangerouslySetInnerHTML={{ __html: fullPageTabsHTML }} />
            ) : (
              /* eslint-disable-next-line react/no-danger */
              <div dangerouslySetInnerHTML={{ __html: headerTabsHTML }} />
            )}
          </HighlightBox>
        </div>
        <div style={{ marginTop: "16px" }}>
          <Text as="p" variant="bodySm" tone="subdued">
            {bundleType === BundleType.FULL_PAGE ? "Full-page bundle step tabs" : "Product-page modal header tabs"}
          </Text>
        </div>
      </div>
    );
  }

  // Header Text sub-section — uses --bundle-conditions-text-* and --bundle-discount-text-* vars
  if (activeSubSection === "headerText") {
    return (
      <div style={{ textAlign: "center", position: "relative" }}>
        <Text as="h3" variant="headingLg" fontWeight="semibold">
          Header Text
        </Text>
        <div style={{ marginTop: "80px", display: "inline-block" }}>
          <HighlightBox active>
            <div
              style={{
                maxWidth: "400px",
                padding: "24px",
                border: "1px solid #E3E3E3",
                borderRadius: "8px",
                backgroundColor: "#FAFAFA",
              }}
            >
              {/* Conditions text — uses --bundle-conditions-text-color / font-size */}
              <h2
                style={{
                  color: "var(--bundle-conditions-text-color, #1E1E1E)",
                  fontSize: "var(--bundle-conditions-text-font-size, 16px)",
                  fontWeight: 600,
                  margin: "0 0 16px",
                  textAlign: "center",
                }}
              >
                Choose 3 products
              </h2>
              {/* Discount text — uses --bundle-discount-text-color / font-size */}
              <p
                style={{
                  color: "var(--bundle-discount-text-color, #1E1E1E)",
                  fontSize: "var(--bundle-discount-text-font-size, 14px)",
                  fontWeight: 400,
                  margin: 0,
                  textAlign: "center",
                }}
              >
                Add 2 more to get <strong>10% off</strong>
              </p>
            </div>
          </HighlightBox>
        </div>
      </div>
    );
  }

  return null;
}
