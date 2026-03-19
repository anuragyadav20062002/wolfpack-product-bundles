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

  // Widget Style sub-section — full-width two-section preview: slot cards + bottom sheet
  if (activeSubSection === "widgetStyle") {
    const slotCardsHTML = `
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;width:100%;">

  <!-- Section label -->
  <div style="font-size:10px;font-weight:600;color:#888;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:10px;">Slot Cards — on product page</div>

  <!-- Slot cards row -->
  <div style="display:flex;gap:10px;">

    <!-- Empty slot 1 -->
    <div class="bw-slot-card bw-slot-card--empty" style="flex:1;height:110px;min-width:0;">
      <div class="bw-slot-card__plus-icon" style="margin-bottom:6px;">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--bundle-empty-state-card-border,var(--bundle-global-primary-button,#1e3a8a))" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.55"><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M12 8v8M8 12h8"/></svg>
      </div>
      <span class="bw-slot-card__label" style="font-size:11px;">T-Shirts</span>
    </div>

    <!-- Empty slot 2 -->
    <div class="bw-slot-card bw-slot-card--empty" style="flex:1;height:110px;min-width:0;">
      <div class="bw-slot-card__plus-icon" style="margin-bottom:6px;">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--bundle-empty-state-card-border,var(--bundle-global-primary-button,#1e3a8a))" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.55"><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M12 8v8M8 12h8"/></svg>
      </div>
      <span class="bw-slot-card__label" style="font-size:11px;">Pants</span>
    </div>

    <!-- Filled slot -->
    <div class="bw-slot-card bw-slot-card--filled" style="flex:1;height:110px;min-width:0;position:relative;overflow:hidden;">
      <div style="width:100%;height:76px;background:linear-gradient(145deg,#ddd6fe,#a78bfa);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" stroke-width="1.5" opacity="0.6"><path d="M20.38 3.46L16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.57a1 1 0 0 0 .99.84H5v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V10h1.15a1 1 0 0 0 .99-.84l.58-3.57a2 2 0 0 0-1.34-2.23z"/></svg>
      </div>
      <div style="padding:4px 6px 6px;font-size:10px;font-weight:600;color:#111;text-align:center;line-height:1.3;">Classic Tee</div>
      <div style="position:absolute;top:6px;right:6px;width:18px;height:18px;background:var(--bundle-global-primary-button,#1e3a8a);border-radius:50%;display:flex;align-items:center;justify-content:center;">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
      </div>
    </div>

    <!-- Empty slot 3 -->
    <div class="bw-slot-card bw-slot-card--empty" style="flex:1;height:110px;min-width:0;">
      <div class="bw-slot-card__plus-icon" style="margin-bottom:6px;">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--bundle-empty-state-card-border,var(--bundle-global-primary-button,#1e3a8a))" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.55"><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M12 8v8M8 12h8"/></svg>
      </div>
      <span class="bw-slot-card__label" style="font-size:11px;">Shoes</span>
    </div>

  </div><!-- /slot cards row -->
</div>`.trim();

    const bottomSheetHTML = `
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;width:100%;">

  <!-- Section label -->
  <div style="font-size:10px;font-weight:600;color:#888;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:10px;">Bottom Sheet — opens when tapping an empty slot</div>

  <!-- Sheet panel -->
  <div style="background:var(--bundle-footer-bg-color,#fff);border-radius:14px;padding:14px 14px 16px;box-shadow:0 -4px 20px rgba(0,0,0,0.10);border:1px solid #eee;">

    <!-- Drag handle -->
    <div style="width:40px;height:4px;background:#ddd;border-radius:2px;margin:0 auto 12px;"></div>

    <!-- Sheet header -->
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
      <span style="font-size:13px;font-weight:700;color:#111;">Choose T-Shirts</span>
      <div style="width:22px;height:22px;border-radius:50%;background:#f0f0f0;display:flex;align-items:center;justify-content:center;cursor:pointer;">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#666" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </div>
    </div>

    <!-- Product grid inside sheet -->
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;">

      <!-- Product 1 — selected -->
      <div class="product-card selected" style="border-radius:8px;overflow:hidden;position:relative;padding:0;min-height:0;">
        <div style="height:70px;background:linear-gradient(135deg,#d1fae5,#6ee7b7);display:flex;align-items:center;justify-content:center;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="1.5" opacity="0.7"><path d="M20.38 3.46L16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.57a1 1 0 0 0 .99.84H5v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V10h1.15a1 1 0 0 0 .99-.84l.58-3.57a2 2 0 0 0-1.34-2.23z"/></svg>
        </div>
        <div style="padding:5px 6px;">
          <div style="font-size:9px;font-weight:600;color:#111;line-height:1.2;margin-bottom:2px;">Basic Tee</div>
          <div style="font-size:9px;color:#555;">$24.99</div>
        </div>
        <div style="position:absolute;top:5px;right:5px;width:16px;height:16px;background:var(--bundle-global-primary-button,#1e3a8a);border-radius:50%;display:flex;align-items:center;justify-content:center;">
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
      </div>

      <!-- Product 2 -->
      <div class="product-card" style="border-radius:8px;overflow:hidden;padding:0;min-height:0;">
        <div style="height:70px;background:linear-gradient(135deg,#fef3c7,#fcd34d);display:flex;align-items:center;justify-content:center;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#b45309" stroke-width="1.5" opacity="0.7"><path d="M20.38 3.46L16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.57a1 1 0 0 0 .99.84H5v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V10h1.15a1 1 0 0 0 .99-.84l.58-3.57a2 2 0 0 0-1.34-2.23z"/></svg>
        </div>
        <div style="padding:5px 6px;">
          <div style="font-size:9px;font-weight:600;color:#111;line-height:1.2;margin-bottom:2px;">Premium Tee</div>
          <div style="font-size:9px;color:#555;">$34.99</div>
        </div>
      </div>

      <!-- Product 3 -->
      <div class="product-card" style="border-radius:8px;overflow:hidden;padding:0;min-height:0;">
        <div style="height:70px;background:linear-gradient(135deg,#fce7f3,#f9a8d4);display:flex;align-items:center;justify-content:center;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#be185d" stroke-width="1.5" opacity="0.7"><path d="M20.38 3.46L16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.57a1 1 0 0 0 .99.84H5v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V10h1.15a1 1 0 0 0 .99-.84l.58-3.57a2 2 0 0 0-1.34-2.23z"/></svg>
        </div>
        <div style="padding:5px 6px;">
          <div style="font-size:9px;font-weight:600;color:#111;line-height:1.2;margin-bottom:2px;">Graphic Tee</div>
          <div style="font-size:9px;color:#555;">$29.99</div>
        </div>
      </div>

      <!-- Product 4 -->
      <div class="product-card" style="border-radius:8px;overflow:hidden;padding:0;min-height:0;">
        <div style="height:70px;background:linear-gradient(135deg,#e0f2fe,#7dd3fc);display:flex;align-items:center;justify-content:center;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0369a1" stroke-width="1.5" opacity="0.7"><path d="M20.38 3.46L16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.57a1 1 0 0 0 .99.84H5v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V10h1.15a1 1 0 0 0 .99-.84l.58-3.57a2 2 0 0 0-1.34-2.23z"/></svg>
        </div>
        <div style="padding:5px 6px;">
          <div style="font-size:9px;font-weight:600;color:#111;line-height:1.2;margin-bottom:2px;">Sport Tee</div>
          <div style="font-size:9px;color:#555;">$19.99</div>
        </div>
      </div>

    </div><!-- /product grid -->
  </div><!-- /sheet panel -->
</div>`.trim();

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "24px", width: "100%", padding: "4px 0" }}>
        <div>
          <Text as="h3" variant="headingLg" fontWeight="semibold">
            Widget Style
          </Text>
        </div>
        {/* eslint-disable-next-line react/no-danger */}
        <div dangerouslySetInnerHTML={{ __html: slotCardsHTML }} />
        {/* eslint-disable-next-line react/no-danger */}
        <div dangerouslySetInnerHTML={{ __html: bottomSheetHTML }} />
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
        <HighlightBox active={activeSubSection === "productCard" || activeSubSection === "productCardTypography"}>
          {/* eslint-disable-next-line react/no-danger */}
          <div dangerouslySetInnerHTML={{ __html: unselectedCardHTML }} />
        </HighlightBox>

        {/* Selected card */}
        <HighlightBox
          active={
            activeSubSection === "quantityVariantSelector" ||
            activeSubSection === "button" ||
            activeSubSection === "productCardTypography"
          }
        >
          {/* eslint-disable-next-line react/no-danger */}
          <div dangerouslySetInnerHTML={{ __html: selectedCardHTML }} />
        </HighlightBox>

        {/* Dimmed card — when step quota is full */}
        <HighlightBox active={activeSubSection === "productCardTypography"}>
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
