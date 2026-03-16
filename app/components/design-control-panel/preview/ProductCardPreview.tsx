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

// Search input HTML — class names match bundle-widget-full-page.css references
const searchInputHTML = `
<div style="padding: 16px; background: #fff; border-radius: 8px; min-width: 320px;">
  <div class="step-search-input-wrapper">
    <svg class="step-search-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
    <input class="step-search-input" type="text" placeholder="Search products..." value="" />
  </div>
  <div style="margin-top: 12px;">
    <div class="step-search-input-wrapper" style="border-color: var(--bundle-search-focus-border, #00BCD4); box-shadow: 0 0 0 3px rgba(0,188,212,0.1);">
      <svg class="step-search-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--bundle-search-focus-border, #00BCD4); opacity: 1;">
        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
      <input class="step-search-input" type="text" value="Nike Air" style="color: var(--bundle-search-text-color, #333);" />
      <button class="step-search-clear-btn" style="display: flex;">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
  </div>
</div>
`.trim();

// Skeleton loading HTML — classes match what bundle-widget-full-page.js injects at runtime
// The keyframe animation is injected inline (same as the widget does)
const skeletonHTML = `
<div style="display: flex; gap: 16px; padding: 8px;">
  <style>
    @keyframes dcp-skeleton-pulse {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
    .dcp-skeleton-card {
      width: 140px;
      height: 200px;
      border-radius: 12px;
      background: var(--bundle-skeleton-base-bg, #f0f0f0);
      position: relative;
      overflow: hidden;
    }
    .dcp-skeleton-card-content {
      position: absolute;
      inset: 0;
      background: linear-gradient(
        110deg,
        var(--bundle-skeleton-shimmer, #e8e8e8) 0%,
        var(--bundle-skeleton-shimmer, #e8e8e8) 40%,
        var(--bundle-skeleton-highlight, #ffffff) 50%,
        var(--bundle-skeleton-shimmer, #e8e8e8) 60%,
        var(--bundle-skeleton-shimmer, #e8e8e8) 100%
      );
      background-size: 200% 100%;
      animation: dcp-skeleton-pulse 1.5s ease-in-out infinite;
    }
  </style>
  <div class="dcp-skeleton-card"><div class="dcp-skeleton-card-content"></div></div>
  <div class="dcp-skeleton-card" style="animation-delay: 0.2s;"><div class="dcp-skeleton-card-content"></div></div>
  <div class="dcp-skeleton-card" style="animation-delay: 0.4s;"><div class="dcp-skeleton-card-content"></div></div>
</div>
`.trim();

// Added button state HTML — shows unselected vs added/selected button side-by-side
// Wrapped in .modal-body .product-card so the existing CSS selectors match
const addedButtonStateHTML = `
<div class="modal-body" style="padding: 24px; background: #fff; border-radius: 8px;">
  <div style="display: flex; gap: 32px; justify-content: center; align-items: flex-end;">
    <div style="display: flex; flex-direction: column; align-items: center; gap: 10px;">
      <span style="font-size: 11px; color: #888; text-transform: uppercase; letter-spacing: 0.08em;">Before adding</span>
      <div class="product-card" style="padding: 0; border: none; box-shadow: none; width: auto; background: transparent;">
        <button class="product-add-btn" style="min-width: 160px;">Add to Bundle</button>
      </div>
    </div>
    <div style="display: flex; flex-direction: column; align-items: center; gap: 10px;">
      <span style="font-size: 11px; color: #888; text-transform: uppercase; letter-spacing: 0.08em;">After adding</span>
      <div class="product-card" style="padding: 0; border: none; box-shadow: none; width: auto; background: transparent;">
        <button class="product-add-btn added" style="min-width: 160px;">Added to Bundle</button>
      </div>
    </div>
  </div>
</div>
`.trim();

// Typography preview HTML — button using CSS vars for text-transform and letter-spacing
const typographyHTML = `
<div style="display: flex; flex-direction: column; gap: 20px; align-items: center; padding: 16px;">
  <div style="display: flex; flex-direction: column; gap: 8px; align-items: center;">
    <span style="font-size: 11px; color: #888; text-transform: uppercase; letter-spacing: 0.08em;">Add button</span>
    <button class="product-add-btn" style="min-width: 180px;">Add to Bundle</button>
  </div>
  <div style="display: flex; flex-direction: column; gap: 8px; align-items: center;">
    <span style="font-size: 11px; color: #888; text-transform: uppercase; letter-spacing: 0.08em;">Cart button</span>
    <button class="bundle-add-to-cart-button" style="min-width: 220px; padding: 14px 24px;">Add Bundle to Cart</button>
  </div>
</div>
`.trim();

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

// Dimmed state card — shown when step quota is full (Beco-style)
const dimmedCardHTML = `
<div class="product-card dimmed" data-product-id="preview-dimmed">
  <div class="product-image">
    <img src="${PLACEHOLDER_IMG}" alt="Another Product" loading="lazy">
  </div>
  <div class="product-content-wrapper">
    <div class="product-title">Another Product</div>
    <div class="product-price-row">
      <span class="product-price">$9.99</span>
    </div>
    <div class="product-spacer"></div>
    <button class="product-add-btn" data-product-id="preview-dimmed">Add to Bundle</button>
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
  // Search Input sub-section — show normal + focused states
  if (activeSubSection === "searchInput") {
    return (
      <div style={{ textAlign: "center" }}>
        <Text as="h3" variant="headingLg" fontWeight="semibold">
          Search Input
        </Text>
        <div style={{ marginTop: "24px", display: "inline-block" }}>
          <HighlightBox active>
            {/* eslint-disable-next-line react/no-danger */}
            <div dangerouslySetInnerHTML={{ __html: searchInputHTML }} />
          </HighlightBox>
        </div>
        <div style={{ marginTop: "16px" }}>
          <Text as="p" variant="bodySm" tone="subdued">
            Top: default · Bottom: focused state
          </Text>
        </div>
      </div>
    );
  }

  // Skeleton Loading sub-section — animated pulsing skeleton cards
  if (activeSubSection === "skeletonLoading") {
    return (
      <div style={{ textAlign: "center" }}>
        <Text as="h3" variant="headingLg" fontWeight="semibold">
          Skeleton Loading
        </Text>
        <div style={{ marginTop: "24px", display: "inline-block" }}>
          <HighlightBox active>
            {/* eslint-disable-next-line react/no-danger */}
            <div dangerouslySetInnerHTML={{ __html: skeletonHTML }} />
          </HighlightBox>
        </div>
        <div style={{ marginTop: "16px" }}>
          <Text as="p" variant="bodySm" tone="subdued">
            Shown while products are loading
          </Text>
        </div>
      </div>
    );
  }

  // Typography sub-section — button text-transform and letter-spacing
  if (activeSubSection === "typography") {
    return (
      <div style={{ textAlign: "center" }}>
        <Text as="h3" variant="headingLg" fontWeight="semibold">
          Button Typography
        </Text>
        <div style={{ marginTop: "24px", display: "inline-block" }}>
          <HighlightBox active>
            {/* eslint-disable-next-line react/no-danger */}
            <div dangerouslySetInnerHTML={{ __html: typographyHTML }} />
          </HighlightBox>
        </div>
        <div style={{ marginTop: "16px" }}>
          <Text as="p" variant="bodySm" tone="subdued">
            Text transform &amp; letter spacing applied to all buttons
          </Text>
        </div>
      </div>
    );
  }

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

  // Added button state sub-section — show unselected vs added button
  if (activeSubSection === "addedButtonState") {
    return (
      <div style={{ textAlign: "center" }}>
        <Text as="h3" variant="headingLg" fontWeight="semibold">
          Added State
        </Text>
        <div style={{ marginTop: "24px", display: "inline-block" }}>
          <HighlightBox active>
            {/* eslint-disable-next-line react/no-danger */}
            <div dangerouslySetInnerHTML={{ __html: addedButtonStateHTML }} />
          </HighlightBox>
        </div>
        <div style={{ marginTop: "16px" }}>
          <Text as="p" variant="bodySm" tone="subdued">
            Left: default · Right: after product is added to bundle
          </Text>
        </div>
      </div>
    );
  }

  // All other product card sub-sections: show three cards (unselected, selected, dimmed)
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

        {/* Dimmed card — when step quota is full */}
        <HighlightBox active={false}>
          {/* eslint-disable-next-line react/no-danger */}
          <div dangerouslySetInnerHTML={{ __html: dimmedCardHTML }} />
        </HighlightBox>
      </div>

      <div style={{ marginTop: "32px" }}>
        <Text as="p" variant="bodySm" tone="subdued">
          Left: unselected · Middle: selected · Right: dimmed (step quota full)
        </Text>
      </div>
    </div>
  );
}
