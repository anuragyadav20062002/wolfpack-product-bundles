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

  // Loading State — uses --bundle-loading-overlay-bg / --bundle-loading-overlay-text vars
  if (activeSubSection === "loadingState") {
    return (
      <div style={{ textAlign: "center", position: "relative" }}>
        <Text as="h3" variant="headingLg" fontWeight="semibold">
          Loading State
        </Text>
        <div style={{ marginTop: "80px", display: "inline-block" }}>
          <HighlightBox active>
            <div
              style={{
                padding: "16px 24px",
                background: "var(--bundle-loading-overlay-bg, #E3F2FD)",
                color: "var(--bundle-loading-overlay-text, #1976D2)",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: 500,
                textAlign: "center",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                minWidth: "240px",
                justifyContent: "center",
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
              Loading bundle…
            </div>
          </HighlightBox>
        </div>
        <div style={{ marginTop: "24px" }}>
          <Text as="p" variant="bodySm" tone="subdued">
            Shown while the bundle is processing
          </Text>
        </div>
      </div>
    );
  }

  // Modal Close Button — uses .close-button CSS class + --bundle-modal-close-* vars
  if (activeSubSection === "modalCloseButton") {
    return (
      <div style={{ textAlign: "center", position: "relative" }}>
        <Text as="h3" variant="headingLg" fontWeight="semibold">
          Modal Close Button
        </Text>
        <div style={{ marginTop: "80px", display: "inline-block" }}>
          <HighlightBox active>
            <div
              style={{
                background: "#fff",
                borderRadius: "12px",
                padding: "16px 32px",
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "40px",
                border: "1px solid #eee",
                minWidth: "280px",
              }}
            >
              <span style={{ fontSize: "16px", fontWeight: 600, color: "#333" }}>
                Choose your products
              </span>
              {/* eslint-disable-next-line react/no-danger */}
              <div dangerouslySetInnerHTML={{ __html: '<span class="close-button">&times;</span>' }} />
            </div>
          </HighlightBox>
        </div>
        <div style={{ marginTop: "24px" }}>
          <Text as="p" variant="bodySm" tone="subdued">
            Appears at the top-right of the bundle modal
          </Text>
        </div>
      </div>
    );
  }

  // Accessibility — focus outline applied to interactive elements
  if (activeSubSection === "accessibility") {
    return (
      <div style={{ textAlign: "center", position: "relative" }}>
        <Text as="h3" variant="headingLg" fontWeight="semibold">
          Focus &amp; Accessibility
        </Text>
        <div style={{ marginTop: "60px", display: "inline-block" }}>
          <HighlightBox active>
            <div style={{ display: "flex", gap: "24px", padding: "16px", background: "#fff", borderRadius: "12px", border: "1px solid #eee" }}>
              {/* Simulated focused button */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "11px", color: "#888", textTransform: "uppercase", letterSpacing: "0.06em" }}>Button</span>
                <button
                  style={{
                    padding: "10px 20px",
                    background: "var(--bundle-global-primary-button, #4CAF50)",
                    color: "#fff",
                    border: "none",
                    borderRadius: "6px",
                    fontSize: "14px",
                    fontWeight: 600,
                    cursor: "pointer",
                    outline: `var(--bundle-focus-outline-width, 2px) solid var(--bundle-focus-outline-color, #5C6AC4)`,
                    outlineOffset: "3px",
                  }}
                >
                  Add to Bundle
                </button>
              </div>
              {/* Simulated focused input */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "11px", color: "#888", textTransform: "uppercase", letterSpacing: "0.06em" }}>Input</span>
                <input
                  type="text"
                  defaultValue="Search…"
                  style={{
                    padding: "10px 14px",
                    border: "1.5px solid #ddd",
                    borderRadius: "6px",
                    fontSize: "14px",
                    outline: `var(--bundle-focus-outline-width, 2px) solid var(--bundle-focus-outline-color, #5C6AC4)`,
                    outlineOffset: "3px",
                    width: "130px",
                  }}
                  readOnly
                />
              </div>
            </div>
          </HighlightBox>
        </div>
        <div style={{ marginTop: "24px" }}>
          <Text as="p" variant="bodySm" tone="subdued">
            Focus ring shown on keyboard-navigable elements
          </Text>
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
