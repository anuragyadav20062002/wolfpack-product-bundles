/**
 * App-served bundle widget preview page
 *
 * Returns a full HTML document that renders mock widget HTML styled with the
 * merchant's current design settings. Loaded in an iframe inside the DCP modal.
 *
 * Same-origin as the app — uses CSP frame-ancestors (not X-Frame-Options) so it can
 * receive postMessage from the parent DCP frame.
 *
 * URL: /api/preview/pdp?shop=xxx.myshopify.com
 *      /api/preview/fpb?shop=xxx.myshopify.com&footerLayout=sidebar|floating
 *
 * auth: public — renders a preview page that loads CSS from the design-settings
 * endpoint (also public). No sensitive data exposed.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { type LoaderFunctionArgs } from "@remix-run/node";

const PLACEHOLDER_IMG =
  "https://cdn.shopify.com/s/files/1/0533/2089/files/placeholder-images-image_large.png";

function getWidgetCss(): { widgetCss: string; fullPageCss: string } {
  try {
    const assetsDir = join(process.cwd(), "extensions/bundle-builder/assets");
    const widgetCss = readFileSync(join(assetsDir, "bundle-widget.css"), "utf8");
    const fullPageCss = readFileSync(
      join(assetsDir, "bundle-widget-full-page.css"),
      "utf8"
    );
    return { widgetCss, fullPageCss };
  } catch {
    return { widgetCss: "", fullPageCss: "" };
  }
}

// ─── PDP preview HTML ─────────────────────────────────────────────────────────
// The PDP bundle widget is a BOTTOM DRAWER (not a centered modal).
// Structure: .bundle-builder-modal.active wraps .modal-overlay + .modal-content.
// .bundle-builder-modal is display:none by default; .active makes it display:flex.
// .modal-content is position:fixed; bottom:0; left:0; right:0; height:90vh.

const pdpPageHtml = `
<!-- Mock product page background (partially visible behind overlay) -->
<div class="preview-page-bg">
  <div class="preview-page-inner">
    <div class="preview-product-image-placeholder"></div>
    <div class="preview-product-info">
      <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111;">Summer Bundle</h2>
      <p style="margin:0 0 6px;font-size:16px;color:#555;">Build your perfect summer outfit</p>
      <p style="margin:0;font-size:20px;font-weight:600;color:#111;">From $49.99</p>
      <div style="margin-top:16px;">
        <button style="padding:12px 28px;background:#111;color:#fff;border:none;border-radius:8px;font-size:15px;cursor:pointer;">
          Customize Bundle
        </button>
      </div>
    </div>
  </div>
</div>

<!-- Bundle builder modal — bottom drawer, shown via .active class -->
<div class="bundle-builder-modal active">
  <div class="modal-overlay"></div>

  <div class="modal-content">

    <!-- Modal header: drag handle (CSS ::before) + tabs + close -->
    <div class="modal-header">
      <div class="modal-step-title">Choose your products</div>
      <div class="modal-tabs-wrapper">
        <button class="tab-arrow tab-arrow-left" aria-label="Scroll left">&#x2039;</button>
        <div class="modal-tabs">
          <button class="bundle-header-tab active" data-step-index="0">Step 1</button>
          <button class="bundle-header-tab" data-step-index="1">Step 2</button>
          <button class="bundle-header-tab" data-step-index="2">Step 3</button>
        </div>
        <button class="tab-arrow tab-arrow-right" aria-label="Scroll right">&#x203a;</button>
      </div>
      <span class="close-button">&times;</span>
    </div>

    <!-- Modal body: product grid -->
    <div class="modal-body">
      <div class="product-grid">

        <!-- Unselected card -->
        <div class="product-card" data-product-id="p1">
          <div class="product-image">
            <img src="${PLACEHOLDER_IMG}" alt="Classic T-Shirt" loading="lazy">
          </div>
          <div class="product-content-wrapper">
            <div class="product-title">Classic T-Shirt</div>
            <div class="product-price-row">
              <span class="product-price-strike">$24.99</span>
              <span class="product-price">$19.99</span>
            </div>
            <div class="product-spacer"></div>
            <select class="variant-selector"><option>Size: S</option><option>Size: M</option><option>Size: L</option></select>
            <button class="product-add-btn">Add to Bundle</button>
          </div>
        </div>

        <!-- Selected card — inline quantity controls -->
        <div class="product-card selected" data-product-id="p2">
          <div class="selected-overlay">✓</div>
          <div class="product-image">
            <img src="${PLACEHOLDER_IMG}" alt="Running Shorts" loading="lazy">
          </div>
          <div class="product-content-wrapper">
            <div class="product-title">Running Shorts</div>
            <div class="product-price-row">
              <span class="product-price-strike">$34.99</span>
              <span class="product-price">$28.99</span>
            </div>
            <div class="product-spacer"></div>
            <div class="inline-quantity-controls">
              <button class="inline-qty-btn qty-decrease">−</button>
              <span class="inline-qty-display">1</span>
              <button class="inline-qty-btn qty-increase">+</button>
            </div>
          </div>
        </div>

        <!-- Unselected card -->
        <div class="product-card" data-product-id="p3">
          <div class="product-image">
            <img src="${PLACEHOLDER_IMG}" alt="Sport Socks" loading="lazy">
          </div>
          <div class="product-content-wrapper">
            <div class="product-title">Sport Socks</div>
            <div class="product-price-row">
              <span class="product-price">$9.99</span>
            </div>
            <div class="product-spacer"></div>
            <button class="product-add-btn">Add to Bundle</button>
          </div>
        </div>

        <!-- Empty state card -->
        <div class="empty-state-card">
          <svg class="empty-state-card-icon" width="69" height="69" viewBox="0 0 69 69" fill="none">
            <line x1="34.5" y1="15" x2="34.5" y2="54" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
            <line x1="15" y1="34.5" x2="54" y2="34.5" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
          </svg>
          <p class="empty-state-card-text">Select Item</p>
        </div>

      </div>
    </div>

    <!-- Modal footer: price pill + nav buttons + discount messaging -->
    <div class="modal-footer">
      <div class="modal-footer-grouped-content">
        <div class="modal-footer-total-pill">
          <span class="total-price-strike">$59.98</span>
          <span class="total-price-final">$48.98</span>
          <span class="price-cart-separator">|</span>
          <span class="cart-badge-wrapper">
            <span class="cart-badge-count">1</span>
            <svg class="cart-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="9" cy="21" r="1" fill="currentColor" stroke="none"/>
              <circle cx="20" cy="21" r="1" fill="currentColor" stroke="none"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
            </svg>
          </span>
        </div>
        <div class="modal-footer-buttons-row">
          <button class="modal-nav-button prev-button">BACK</button>
          <button class="modal-nav-button next-button">NEXT</button>
        </div>
        <div class="modal-footer-discount-messaging">
          <div class="footer-discount-text">Add 1 more item to unlock 20% off</div>
        </div>
      </div>
    </div>

  </div>
</div>
`.trim();

// ─── FPB preview HTML — Sidebar layout (footer_side) ──────────────────────────
// Uses .layout-sidebar + .sidebar-layout-wrapper for the real 3-column layout:
// step-tabs (left) | product grid (center) | side panel (right).
// Promo banner is hidden in this layout via CSS (.layout-sidebar .promo-banner).

const fpbSidebarHtml = `
<div class="bundle-widget-full-page layout-sidebar" style="min-height:100vh;">

  <!-- Promo banner hidden by CSS in sidebar layout -->
  <div class="promo-banner has-discount" style="padding:16px 20px;text-align:center;">
    <div class="promo-banner-subtitle">Mix &amp; Match</div>
    <h2 class="promo-banner-title" style="margin:4px 0;">Summer Bundle — Save 20%</h2>
    <div class="promo-banner-note">Buy any 3 items and save automatically at checkout</div>
  </div>

  <!-- Tier pills -->
  <div class="bundle-tier-pill-bar" role="group" aria-label="Bundle pricing tiers">
    <button type="button" class="bundle-tier-pill bundle-tier-pill--active" data-tier-index="0" aria-pressed="true">Buy 2 — Save 10%</button>
    <button type="button" class="bundle-tier-pill" data-tier-index="1" aria-pressed="false">Buy 3 — Save 20%</button>
    <button type="button" class="bundle-tier-pill bundle-tier-pill--disabled" data-tier-index="2" aria-pressed="false">Buy 5 — Save 30%</button>
  </div>

  <!-- Sidebar layout wrapper: step-tabs | content | side-panel -->
  <div class="sidebar-layout-wrapper">

    <!-- Left: step timeline tabs -->
    <div class="step-tabs-container">
      <div class="step-tab active completed" data-step-index="0">
        <div class="tab-images">
          <img src="${PLACEHOLDER_IMG}" alt="Polo" class="tab-product-image">
          <img src="${PLACEHOLDER_IMG}" alt="Linen" class="tab-product-image">
        </div>
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
          <span class="tab-count">0 selected</span>
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
        <div class="tab-locked-tooltip">Complete "Choose Bottoms" first</div>
      </div>
    </div>

    <!-- Center: search + product grid -->
    <div class="full-page-content-section sidebar-content">

      <div class="step-search-container">
        <div class="step-search-input-wrapper">
          <svg class="step-search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/>
            <path d="M21 21l-4.35-4.35"/>
          </svg>
          <input type="text" class="step-search-input" placeholder="Search products..." autocomplete="off" value="">
        </div>
      </div>

      <div class="full-page-product-grid">

        <div class="product-card selected" data-product-id="s1">
          <div class="selected-overlay">✓</div>
          <div class="product-image"><img src="${PLACEHOLDER_IMG}" alt="Polo Shirt" loading="lazy"></div>
          <div class="product-content-wrapper">
            <div class="product-title">Polo Shirt</div>
            <div class="product-price-row">
              <span class="product-price-strike">$39.99</span>
              <span class="product-price">$32.99</span>
            </div>
            <div class="product-spacer"></div>
            <div class="product-quantity-wrapper">
              <div class="product-quantity-selector">
                <button class="qty-btn qty-decrease">−</button>
                <span class="qty-display">1</span>
                <button class="qty-btn qty-increase">+</button>
              </div>
            </div>
            <button class="product-add-btn added">✓ Added</button>
          </div>
        </div>

        <div class="product-card selected" data-product-id="s2">
          <div class="selected-overlay">✓</div>
          <div class="product-image"><img src="${PLACEHOLDER_IMG}" alt="Linen Shirt" loading="lazy"></div>
          <div class="product-content-wrapper">
            <div class="product-title">Linen Shirt</div>
            <div class="product-price-row">
              <span class="product-price">$29.99</span>
            </div>
            <div class="product-spacer"></div>
            <div class="product-quantity-wrapper">
              <div class="product-quantity-selector">
                <button class="qty-btn qty-decrease">−</button>
                <span class="qty-display">1</span>
                <button class="qty-btn qty-increase">+</button>
              </div>
            </div>
            <button class="product-add-btn added">✓ Added</button>
          </div>
        </div>

        <div class="product-card" data-product-id="s3">
          <div class="product-image"><img src="${PLACEHOLDER_IMG}" alt="Denim Jacket" loading="lazy"></div>
          <div class="product-content-wrapper">
            <div class="product-title">Denim Jacket</div>
            <div class="product-price-row">
              <span class="product-price-strike">$79.99</span>
              <span class="product-price">$59.99</span>
            </div>
            <div class="product-spacer"></div>
            <select class="variant-selector"><option>Size: S</option><option>Size: M</option><option>Size: L</option></select>
            <button class="product-add-btn">Add to Bundle</button>
          </div>
        </div>

        <div class="empty-state-card">
          <svg class="empty-state-card-icon" width="69" height="69" viewBox="0 0 69 69" fill="none">
            <line x1="34.5" y1="15" x2="34.5" y2="54" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
            <line x1="15" y1="34.5" x2="54" y2="34.5" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
          </svg>
          <p class="empty-state-card-text">Select Item</p>
        </div>

      </div>
    </div>

    <!-- Right: side panel -->
    <div class="full-page-side-panel">
      <div class="side-panel-header">
        <span class="side-panel-title">Your Bundle</span>
        <button class="side-panel-clear-btn" type="button">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          Clear
        </button>
      </div>
      <p class="side-panel-subtitle">Review your bundle</p>
      <div class="side-panel-discount-message">Add 1 more to save 20%</div>
      <div class="side-panel-item-count">2 of 3 items</div>
      <div class="side-panel-products">
        <div class="side-panel-product-row">
          <div class="side-panel-product-img-wrap">
            <img src="${PLACEHOLDER_IMG}" alt="Polo Shirt" class="side-panel-product-img">
          </div>
          <div class="side-panel-product-info">
            <span class="side-panel-product-title">Polo Shirt</span>
            <span class="side-panel-product-variant">Size: M</span>
          </div>
          <span class="side-panel-product-price">$32.99</span>
          <button class="side-panel-product-remove" type="button" aria-label="Remove">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
        <div class="side-panel-product-row">
          <div class="side-panel-product-img-wrap">
            <img src="${PLACEHOLDER_IMG}" alt="Linen Shirt" class="side-panel-product-img">
            <span class="side-panel-qty-badge">1</span>
          </div>
          <div class="side-panel-product-info">
            <span class="side-panel-product-title">Linen Shirt</span>
            <span class="side-panel-product-variant">Size: L</span>
          </div>
          <span class="side-panel-product-price">$29.99</span>
          <button class="side-panel-product-remove" type="button" aria-label="Remove">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
      </div>
      <div class="side-panel-divider"></div>
      <div class="side-panel-total">
        <span class="side-panel-total-label">Total</span>
        <div class="side-panel-total-prices">
          <span class="side-panel-total-original">$69.98</span>
          <span class="side-panel-total-final">$62.98</span>
        </div>
      </div>
      <div class="side-panel-nav">
        <button class="side-panel-btn side-panel-btn-next" type="button">Next Step</button>
        <button class="side-panel-btn side-panel-btn-back" type="button">Back</button>
      </div>
    </div>

  </div>
</div>
`.trim();

// ─── FPB preview HTML — Floating footer layout (footer_bottom) ─────────────────
// Uses standard single-column layout with .full-page-footer.floating-card
// stuck at the bottom. Step tabs appear as horizontal pills across the top.
// Promo banner is visible in this layout.

const fpbFloatingHtml = `
<div class="bundle-widget-full-page" style="min-height:100vh;display:flex;flex-direction:column;">

  <!-- Promo banner -->
  <div class="promo-banner has-discount" style="padding:16px 20px;text-align:center;">
    <div class="promo-banner-subtitle">Mix &amp; Match</div>
    <h2 class="promo-banner-title" style="margin:4px 0;">Summer Bundle — Save 20%</h2>
    <div class="promo-banner-note">Buy any 3 items and save automatically at checkout</div>
  </div>

  <!-- Tier pills -->
  <div class="bundle-tier-pill-bar" role="group" aria-label="Bundle pricing tiers">
    <button type="button" class="bundle-tier-pill bundle-tier-pill--active" data-tier-index="0" aria-pressed="true">Buy 2 — Save 10%</button>
    <button type="button" class="bundle-tier-pill" data-tier-index="1" aria-pressed="false">Buy 3 — Save 20%</button>
    <button type="button" class="bundle-tier-pill bundle-tier-pill--disabled" data-tier-index="2" aria-pressed="false">Buy 5 — Save 30%</button>
  </div>

  <!-- Step tabs (horizontal row) -->
  <div class="step-tabs-container" style="padding:0 20px;">
    <div class="step-tab active completed" data-step-index="0">
      <div class="tab-images">
        <img src="${PLACEHOLDER_IMG}" alt="Polo" class="tab-product-image">
        <img src="${PLACEHOLDER_IMG}" alt="Linen" class="tab-product-image">
      </div>
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
        <span class="tab-count">0 selected</span>
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
      <div class="tab-locked-tooltip">Complete "Choose Bottoms" first</div>
    </div>
  </div>

  <!-- Main content section -->
  <div class="full-page-content-section" style="flex:1;">

    <div class="step-search-container">
      <div class="step-search-input-wrapper">
        <svg class="step-search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/>
          <path d="M21 21l-4.35-4.35"/>
        </svg>
        <input type="text" class="step-search-input" placeholder="Search products..." autocomplete="off" value="">
      </div>
    </div>

    <div class="full-page-product-grid">

      <div class="product-card selected" data-product-id="f1">
        <div class="selected-overlay">✓</div>
        <div class="product-image"><img src="${PLACEHOLDER_IMG}" alt="Polo Shirt" loading="lazy"></div>
        <div class="product-content-wrapper">
          <div class="product-title">Polo Shirt</div>
          <div class="product-price-row">
            <span class="product-price-strike">$39.99</span>
            <span class="product-price">$32.99</span>
          </div>
          <div class="product-spacer"></div>
          <div class="product-quantity-wrapper">
            <div class="product-quantity-selector">
              <button class="qty-btn qty-decrease">−</button>
              <span class="qty-display">1</span>
              <button class="qty-btn qty-increase">+</button>
            </div>
          </div>
          <button class="product-add-btn added">✓ Added</button>
        </div>
      </div>

      <div class="product-card selected" data-product-id="f2">
        <div class="selected-overlay">✓</div>
        <div class="product-image"><img src="${PLACEHOLDER_IMG}" alt="Linen Shirt" loading="lazy"></div>
        <div class="product-content-wrapper">
          <div class="product-title">Linen Shirt</div>
          <div class="product-price-row">
            <span class="product-price">$29.99</span>
          </div>
          <div class="product-spacer"></div>
          <div class="product-quantity-wrapper">
            <div class="product-quantity-selector">
              <button class="qty-btn qty-decrease">−</button>
              <span class="qty-display">1</span>
              <button class="qty-btn qty-increase">+</button>
            </div>
          </div>
          <button class="product-add-btn added">✓ Added</button>
        </div>
      </div>

      <div class="product-card" data-product-id="f3">
        <div class="product-image"><img src="${PLACEHOLDER_IMG}" alt="Denim Jacket" loading="lazy"></div>
        <div class="product-content-wrapper">
          <div class="product-title">Denim Jacket</div>
          <div class="product-price-row">
            <span class="product-price-strike">$79.99</span>
            <span class="product-price">$59.99</span>
          </div>
          <div class="product-spacer"></div>
          <select class="variant-selector"><option>Size: S</option><option>Size: M</option><option>Size: L</option></select>
          <button class="product-add-btn">Add to Bundle</button>
        </div>
      </div>

      <div class="empty-state-card">
        <svg class="empty-state-card-icon" width="69" height="69" viewBox="0 0 69 69" fill="none">
          <line x1="34.5" y1="15" x2="34.5" y2="54" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
          <line x1="15" y1="34.5" x2="54" y2="34.5" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
        </svg>
        <p class="empty-state-card-text">Select Item</p>
      </div>

    </div>
  </div>

  <!-- Floating footer bar (sticky at bottom) -->
  <div class="full-page-footer floating-card is-open">
    <div class="footer-callout-banner">Add 1 more item to unlock 20% off your bundle</div>
    <div class="footer-bar">
      <div class="footer-thumbstrip">
        <img src="${PLACEHOLDER_IMG}" alt="Polo Shirt" class="footer-thumbstrip-img">
        <img src="${PLACEHOLDER_IMG}" alt="Linen Shirt" class="footer-thumbstrip-img">
        <span class="footer-thumbstrip-overflow">+1</span>
      </div>
      <div class="footer-centre">
        <button class="footer-toggle" type="button">
          <span class="footer-toggle-text">2/3 Products</span>
          <svg class="footer-chevron" viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M5 8l5 5 5-5"/>
          </svg>
        </button>
        <div class="footer-total-area">
          <span class="footer-total-label">Total:</span>
          <div class="footer-total-prices">
            <span class="footer-total-original">$69.98</span>
            <span class="footer-total-final">$62.98</span>
            <span class="footer-discount-badge">10% OFF</span>
          </div>
        </div>
      </div>
      <button class="footer-cta-btn" type="button">Next Step</button>
    </div>
  </div>

</div>
`.trim();

function getFpbHtml(footerLayout: string): string {
  return footerLayout === "floating" ? fpbFloatingHtml : fpbSidebarHtml;
}

// ─── Page skeleton CSS ─────────────────────────────────────────────────────────

const pageLayoutCss = `
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; height: 100%; overflow: hidden; }

/* PDP: background page */
.preview-page-bg {
  position: fixed;
  inset: 0;
  background: #f9f9f9;
  overflow: hidden;
}
.preview-page-inner {
  display: flex;
  gap: 24px;
  padding: 24px;
  max-width: 900px;
  margin: 0 auto;
}
.preview-product-image-placeholder {
  width: 220px;
  height: 280px;
  flex-shrink: 0;
  border-radius: 8px;
  overflow: hidden;
  background: #e8e8e8;
}
.preview-product-info {
  flex: 1;
  padding-top: 8px;
}

/* FPB: fill viewport */
.bundle-widget-full-page {
  height: 100vh;
}
`;

// ─── postMessage listener script ──────────────────────────────────────────────

const postMessageScript = `
(function() {
  window.addEventListener('message', function(e) {
    if (!e.data || e.data.type !== 'DCP_CSS_UPDATE') return;
    var styleEl = document.getElementById('dcp-live-vars');
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'dcp-live-vars';
      document.head.appendChild(styleEl);
    }
    styleEl.textContent = ':root{' + e.data.vars + '}';
  });

  // Notify parent that iframe is ready to receive CSS updates
  window.addEventListener('load', function() {
    if (window.parent !== window) {
      window.parent.postMessage({ type: 'DCP_PREVIEW_READY' }, '*');
    }
  });
})();
`;

// ─── Loader ───────────────────────────────────────────────────────────────────

export async function loader({ request, params }: LoaderFunctionArgs) {
  const { type } = params;
  if (type !== "pdp" && type !== "fpb") {
    return new Response("Invalid preview type. Use 'pdp' or 'fpb'.", {
      status: 400,
    });
  }

  const url = new URL(request.url);
  const shop = url.searchParams.get("shop") ?? "";
  const footerLayout = url.searchParams.get("footerLayout") ?? "sidebar";
  const appUrl = (process.env.SHOPIFY_APP_URL ?? "").replace(/\/$/, "");

  const bundleType = type === "pdp" ? "product_page" : "full_page";
  const designSettingsCssUrl = shop
    ? `${appUrl}/api/design-settings/${shop}?bundleType=${bundleType}`
    : "";

  const { widgetCss, fullPageCss } = getWidgetCss();
  const bodyHtml = type === "pdp" ? pdpPageHtml : getFpbHtml(footerLayout);

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Bundle Widget Preview</title>
  ${designSettingsCssUrl ? `<link id="design-settings-css" rel="stylesheet" href="${designSettingsCssUrl}">` : ""}
  <style id="widget-css">${widgetCss}</style>
  <style id="full-page-css">${fullPageCss}</style>
  <style id="page-layout-css">${pageLayoutCss}</style>
  <style id="dcp-live-vars">/* CSS variables injected via postMessage */</style>
  <script>${postMessageScript}</script>
</head>
<body>
  ${bodyHtml}
</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Security-Policy": "frame-ancestors 'self' https://admin.shopify.com",
      "Cache-Control": "no-store",
    },
  });
}
