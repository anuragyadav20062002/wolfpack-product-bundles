/**
 * ProductCardPreview
 *
 * Renders real widget HTML for the product card and modal previews.
 * CSS variables are injected by the parent <PreviewScope>; this component
 * just provides the correct DOM structure that the real widget CSS styles.
 *
 * Shows two cards side-by-side: unselected state and selected state.
 * For the modal sub-section, shows the real modal-content structure.
 */

import { Text } from "@shopify/polaris";
import { HighlightBox } from "./HighlightBox";

const PLACEHOLDER_IMG =
  "https://cdn.shopify.com/s/files/1/0533/2089/files/placeholder-images-image_large.png";

// Real product card HTML matching ComponentGenerator.renderProductCard() output
const unselectedCardHTML = `
<div class="product-card" data-product-id="preview-unselected">
  <div class="product-image">
    <img src="${PLACEHOLDER_IMG}" alt="Sample Product" loading="lazy">
  </div>
  <div class="product-content-wrapper">
    <div class="product-title">Sample Product</div>
    <div class="product-price-row">
      <span class="product-price-strike">$19.99</span>
      <span class="product-price">$14.99</span>
    </div>
    <div class="product-spacer"></div>
    <select class="variant-selector" data-product-id="preview-unselected">
      <option>Size: M</option>
      <option>Size: L</option>
      <option>Size: XL</option>
    </select>
    <button class="product-add-btn" data-product-id="preview-unselected">Add to Bundle</button>
  </div>
</div>
`.trim();

// Selected state card
const selectedCardHTML = `
<div class="product-card selected" data-product-id="preview-selected">
  <div class="selected-overlay">✓</div>
  <div class="product-image">
    <img src="${PLACEHOLDER_IMG}" alt="Sample Product" loading="lazy">
  </div>
  <div class="product-content-wrapper">
    <div class="product-title">Sample Product</div>
    <div class="product-price-row">
      <span class="product-price-strike">$19.99</span>
      <span class="product-price">$14.99</span>
    </div>
    <div class="product-spacer"></div>
    <div class="inline-quantity-controls">
      <button class="inline-qty-btn qty-decrease" data-product-id="preview-selected">−</button>
      <span class="inline-qty-display">2</span>
      <button class="inline-qty-btn qty-increase" data-product-id="preview-selected">+</button>
    </div>
  </div>
</div>
`.trim();

// Real modal structure matching ComponentGenerator.createModalHTML()
const modalHTML = `
<div class="modal-content" style="position:relative;max-width:680px;margin:0 auto;">
  <div class="modal-header">
    <div class="modal-step-title">Choose your products</div>
    <div class="modal-tabs-wrapper">
      <button class="tab-arrow tab-arrow-left" aria-label="Scroll tabs left">&#x2039;</button>
      <div class="modal-tabs">
        <button class="bundle-header-tab active" data-step-index="0">Step 1</button>
        <button class="bundle-header-tab" data-step-index="1">Step 2</button>
        <button class="bundle-header-tab" data-step-index="2">Step 3</button>
      </div>
      <button class="tab-arrow tab-arrow-right" aria-label="Scroll tabs right">&#x203a;</button>
    </div>
    <span class="close-button">&times;</span>
  </div>
  <div class="modal-body">
    <div class="product-grid">
      <div class="product-card" data-product-id="m1">
        <div class="product-image"><img src="${PLACEHOLDER_IMG}" alt="Product 1" loading="lazy"></div>
        <div class="product-content-wrapper">
          <div class="product-title">Product 1</div>
          <div class="product-price-row"><span class="product-price">$14.99</span></div>
          <div class="product-spacer"></div>
          <button class="product-add-btn" data-product-id="m1">Add to Bundle</button>
        </div>
      </div>
      <div class="product-card selected" data-product-id="m2">
        <div class="selected-overlay">✓</div>
        <div class="product-image"><img src="${PLACEHOLDER_IMG}" alt="Product 2" loading="lazy"></div>
        <div class="product-content-wrapper">
          <div class="product-title">Product 2</div>
          <div class="product-price-row"><span class="product-price">$19.99</span></div>
          <div class="product-spacer"></div>
          <div class="inline-quantity-controls">
            <button class="inline-qty-btn qty-decrease" data-product-id="m2">−</button>
            <span class="inline-qty-display">1</span>
            <button class="inline-qty-btn qty-increase" data-product-id="m2">+</button>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div class="modal-footer">
    <div class="modal-footer-grouped-content">
      <div class="modal-footer-total-pill">
        <span class="total-price-strike">$39.98</span>
        <span class="total-price-final">$29.99</span>
        <span class="price-cart-separator">|</span>
        <span class="cart-badge-wrapper">
          <span class="cart-badge-count">2</span>
          <svg class="cart-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
            <circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle>
          </svg>
        </span>
      </div>
      <div class="modal-footer-buttons-row">
        <button class="modal-nav-button prev-button">BACK</button>
        <button class="modal-nav-button next-button">NEXT</button>
      </div>
    </div>
  </div>
</div>
`.trim();

interface ProductCardPreviewProps {
  activeSubSection: string;
}

export function ProductCardPreview({ activeSubSection }: ProductCardPreviewProps) {
  // Modal sub-section — show real modal-content structure
  if (activeSubSection === "productCardContent") {
    return (
      <div style={{ textAlign: "center" }}>
        <Text as="h3" variant="headingLg" fontWeight="semibold">
          Product Modal
        </Text>
        <div style={{ marginTop: "24px", position: "relative" }}>
          <HighlightBox active>
            {/* eslint-disable-next-line react/no-danger */}
            <div dangerouslySetInnerHTML={{ __html: modalHTML }} />
          </HighlightBox>
        </div>
        <div style={{ marginTop: "24px" }}>
          <Text as="p" variant="bodySm" tone="subdued">
            Preview updates as you customize
          </Text>
        </div>
      </div>
    );
  }

  // All other product card sub-sections: show two cards side-by-side
  return (
    <div style={{ textAlign: "center" }}>
      <Text as="h3" variant="headingLg" fontWeight="semibold">
        Product Card
      </Text>
      <div
        style={{
          marginTop: "24px",
          display: "flex",
          gap: "24px",
          justifyContent: "center",
          alignItems: "flex-start",
          flexWrap: "wrap",
        }}
      >
        {/* Unselected card */}
        <HighlightBox active={activeSubSection === "productCard"}>
          {/* eslint-disable-next-line react/no-danger */}
          <div dangerouslySetInnerHTML={{ __html: unselectedCardHTML }} />
        </HighlightBox>

        {/* Selected card */}
        <HighlightBox
          active={
            activeSubSection === "quantityVariantSelector" ||
            activeSubSection === "button"
          }
        >
          {/* eslint-disable-next-line react/no-danger */}
          <div dangerouslySetInnerHTML={{ __html: selectedCardHTML }} />
        </HighlightBox>
      </div>

      <div style={{ marginTop: "32px" }}>
        <Text as="p" variant="bodySm" tone="subdued">
          Left: unselected · Right: selected with quantity controls
        </Text>
      </div>
    </div>
  );
}
