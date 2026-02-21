/**
 * GeneralPreview
 *
 * Renders real widget HTML for general UI elements.
 * CSS variables are injected by the parent <PreviewScope>.
 *
 * Sub-sections:
 * - emptyState: Real .empty-state-card HTML using --bundle-empty-state-* vars
 * - addToCartButton: Real .bundle-add-to-cart-button using --bundle-add-to-cart-* vars
 * - toasts: Real .bundle-toast using --bundle-toast-* vars
 */

import { Text } from "@shopify/polaris";
import { HighlightBox } from "./HighlightBox";

// Real empty state cards HTML matching ComponentGenerator.renderEmptyStateCards() output.
// Classes: .empty-state-card > .empty-state-card-icon + .empty-state-card-text
const emptyStateHTML = `
<div style="display:flex;gap:16px;justify-content:center;align-items:flex-start;">
  <div class="empty-state-card">
    <svg class="empty-state-card-icon" width="69" height="69" viewBox="0 0 69 69" fill="none">
      <line x1="34.5" y1="15" x2="34.5" y2="54" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
      <line x1="15" y1="34.5" x2="54" y2="34.5" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
    </svg>
    <p class="empty-state-card-text">Select Socks</p>
  </div>
  <div class="empty-state-card">
    <svg class="empty-state-card-icon" width="69" height="69" viewBox="0 0 69 69" fill="none">
      <line x1="34.5" y1="15" x2="34.5" y2="54" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
      <line x1="15" y1="34.5" x2="54" y2="34.5" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
    </svg>
    <p class="empty-state-card-text">Select Laces</p>
  </div>
  <div class="empty-state-card">
    <svg class="empty-state-card-icon" width="69" height="69" viewBox="0 0 69 69" fill="none">
      <line x1="34.5" y1="15" x2="34.5" y2="54" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
      <line x1="15" y1="34.5" x2="54" y2="34.5" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
    </svg>
    <p class="empty-state-card-text">Select Cleaner</p>
  </div>
</div>
`.trim();

interface GeneralPreviewProps {
  activeSubSection: string;
  addToCartButtonBgColor: string;
  addToCartButtonTextColor: string;
  addToCartButtonBorderRadius: number;
  buttonAddToCartText: string;
  toastBgColor: string;
  toastTextColor: string;
}

export function GeneralPreview({
  activeSubSection,
  addToCartButtonBgColor,
  addToCartButtonTextColor,
  addToCartButtonBorderRadius,
  buttonAddToCartText,
  toastBgColor,
  toastTextColor,
}: GeneralPreviewProps) {
  // Empty State — real .empty-state-card structure
  if (activeSubSection === "emptyState") {
    return (
      <div style={{ textAlign: "center", position: "relative" }}>
        <Text as="h3" variant="headingLg" fontWeight="semibold">
          Empty State
        </Text>
        <div style={{ marginTop: "80px", display: "inline-block" }}>
          <HighlightBox active>
            {/* eslint-disable-next-line react/no-danger */}
            <div dangerouslySetInnerHTML={{ __html: emptyStateHTML }} />
          </HighlightBox>
        </div>
      </div>
    );
  }

  // Add to Cart Button — uses --bundle-add-to-cart-button-* vars
  if (activeSubSection === "addToCartButton") {
    return (
      <div style={{ textAlign: "center", position: "relative" }}>
        <Text as="h3" variant="headingLg" fontWeight="semibold">
          Add to Cart Button
        </Text>
        <div style={{ marginTop: "80px", display: "inline-block" }}>
          <HighlightBox active>
            <button
              style={{
                backgroundColor: addToCartButtonBgColor,
                color: addToCartButtonTextColor,
                width: "578px",
                height: "87px",
                borderRadius: `${addToCartButtonBorderRadius}px`,
                fontSize: "34px",
                fontWeight: "bold",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {buttonAddToCartText || "Add to Cart"}
            </button>
          </HighlightBox>
        </div>
      </div>
    );
  }

  // Toasts — uses --bundle-toast-bg / --bundle-toast-text vars
  if (activeSubSection === "toasts") {
    return (
      <div style={{ textAlign: "center", position: "relative" }}>
        <Text as="h3" variant="headingLg" fontWeight="semibold">
          Toasts
        </Text>
        <div style={{ marginTop: "80px", display: "inline-block" }}>
          <HighlightBox active>
            <div
              style={{
                backgroundColor: toastBgColor,
                color: toastTextColor,
                width: "495px",
                height: "81px",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              }}
            >
              <span style={{ fontSize: "24px", fontWeight: 400 }}>
                Add at least 1 product on this step
              </span>
            </div>
          </HighlightBox>
        </div>
      </div>
    );
  }

  return null;
}
