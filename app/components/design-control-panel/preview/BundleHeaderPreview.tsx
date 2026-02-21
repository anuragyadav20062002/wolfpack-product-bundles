/**
 * BundleHeaderPreview
 *
 * Renders real widget HTML for the bundle header tabs and header text.
 * CSS variables are injected by the parent <PreviewScope>.
 *
 * Sub-sections:
 * - headerTabs: Shows .bundle-header-tab buttons using --bundle-header-tab-* vars
 * - headerText: Shows .bundle-header-instructions text using --bundle-conditions-text-*
 *   and --bundle-discount-text-* vars
 */

import { Text } from "@shopify/polaris";
import { HighlightBox } from "./HighlightBox";

// Real modal header tab HTML matching ComponentGenerator.renderTab() output.
// Classes: .bundle-header-tab(.active|.completed)
const headerTabsHTML = `
<div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center;">
  <button class="bundle-header-tab active" data-step-index="0">Step 1 ✓</button>
  <button class="bundle-header-tab completed" data-step-index="1">Step 2 ✓</button>
  <button class="bundle-header-tab" data-step-index="2">Step 3</button>
</div>
`.trim();

interface BundleHeaderPreviewProps {
  activeSubSection: string;
}

export function BundleHeaderPreview({ activeSubSection }: BundleHeaderPreviewProps) {
  // Header Tabs sub-section
  if (activeSubSection === "headerTabs") {
    return (
      <div style={{ textAlign: "center", position: "relative" }}>
        <Text as="h3" variant="headingLg" fontWeight="semibold">
          Tabs
        </Text>
        <div
          style={{
            marginTop: "80px",
            padding: "40px",
            border: "1px solid #E3E3E3",
            borderRadius: "8px",
            backgroundColor: "#FAFAFA",
            display: "inline-block",
          }}
        >
          <HighlightBox active>
            {/* eslint-disable-next-line react/no-danger */}
            <div dangerouslySetInnerHTML={{ __html: headerTabsHTML }} />
          </HighlightBox>
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
