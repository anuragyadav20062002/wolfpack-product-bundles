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

// Full-page step timeline HTML matching createStepTimeline() output.
// Classes: .step-timeline > .timeline-step + .timeline-connector
// Uses real CSS classes from bundle-widget-full-page.css (injected by PreviewScope)
const fullPageTabsHTML = `
<div class="step-timeline" style="width:420px;max-width:100%;">
  <div class="timeline-step timeline-step--completed" data-step-index="0">
    <div class="timeline-icon-wrapper">
      <svg class="timeline-step-icon--svg" viewBox="0 0 24 24" fill="none">
        <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <line x1="3" y1="6" x2="21" y2="6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        <path d="M16 10a4 4 0 01-8 0" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <div class="timeline-checkmark">
        <svg viewBox="0 0 12 12" fill="none">
          <path d="M2 6L5 9L10 3" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
    </div>
    <span class="timeline-step-name">Step 1</span>
  </div>
  <div class="timeline-connector">
    <div class="timeline-connector-fill" style="width:100%;"></div>
  </div>
  <div class="timeline-step timeline-step--active" data-step-index="1">
    <div class="timeline-icon-wrapper">
      <svg class="timeline-step-icon--svg" viewBox="0 0 24 24" fill="none">
        <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <line x1="3" y1="6" x2="21" y2="6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        <path d="M16 10a4 4 0 01-8 0" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <div class="timeline-checkmark"></div>
    </div>
    <span class="timeline-step-name">Step 2</span>
  </div>
  <div class="timeline-connector">
    <div class="timeline-connector-fill" style="width:50%;"></div>
  </div>
  <div class="timeline-step timeline-step--inactive timeline-step--locked" data-step-index="2">
    <div class="timeline-icon-wrapper">
      <svg class="timeline-step-icon--svg" viewBox="0 0 24 24" fill="none">
        <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <line x1="3" y1="6" x2="21" y2="6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        <path d="M16 10a4 4 0 01-8 0" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <div class="timeline-checkmark"></div>
    </div>
    <span class="timeline-step-name">Step 3</span>
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
            {bundleType === BundleType.FULL_PAGE ? "Full-page bundle step timeline" : "Product-page modal header tabs"}
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
