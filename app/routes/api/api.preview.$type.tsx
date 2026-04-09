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

/**
 * Fetch font assets from the merchant's live storefront.
 *
 * Modern Shopify OS 2.0 themes (Dawn, Craft, Sense, etc.) output two things:
 *   1. Font stylesheet <link> tags (Google Fonts, Shopify CDN, Typekit) in <head>
 *   2. CSS custom properties (--font-body-family, --font-heading-family, etc.) in
 *      inline <style> blocks inside <head>
 *
 * We scrape both from the storefront homepage and inject them into the preview so
 * the DCP preview uses the same fonts the merchant's shoppers see.
 *
 * Falls back silently (returns empty strings) on password-protected storefronts,
 * network errors, or timeouts.
 */
async function fetchThemeFontAssets(
  shop: string
): Promise<{ links: string; inlineCss: string }> {
  if (!shop) return { links: "", inlineCss: "" };
  try {
    const res = await fetch(`https://${shop}/`, {
      headers: {
        Accept: "text/html",
        "User-Agent": "WolfpackBundleApp/1.0 (DCP Preview)",
      },
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return { links: "", inlineCss: "" };
    const html = await res.text();

    // Only scan the <head> — font declarations live there, not in <body>
    const headMatch = html.match(/<head[\s\S]*?<\/head>/i);
    const headHtml = headMatch ? headMatch[0] : html;

    // 1. Font stylesheet <link> tags from known font CDNs
    const linkRe = /<link\b[^>]*\bhref=["']([^"']*)["'][^>]*>/gi;
    const fontLinks: string[] = [];
    for (const m of headHtml.matchAll(linkRe)) {
      const href = m[1];
      const tag = m[0];
      const isFontCdn =
        href.includes("fonts.googleapis.com") ||
        href.includes("fonts.shopifycdn.com") ||
        href.includes("use.typekit.net") ||
        href.includes("fonts.gstatic.com");
      const isStylesheet =
        tag.includes('rel="stylesheet"') ||
        tag.includes("rel='stylesheet'") ||
        /\brel=stylesheet\b/.test(tag);
      if (isFontCdn && isStylesheet) fontLinks.push(tag);
    }

    // 2. CSS custom properties for font families from inline <style> blocks
    // Dawn and most OS 2.0 themes output: --font-body-family, --font-heading-family
    const styleRe = /<style\b[^>]*>([\s\S]*?)<\/style>/gi;
    const fontVarRe = /--font-[\w-]+\s*:\s*[^;\n}]+/g;
    const seen = new Set<string>();
    const fontVars: string[] = [];
    for (const sm of headHtml.matchAll(styleRe)) {
      for (const vm of sm[1].matchAll(fontVarRe)) {
        const decl = vm[0].trim().replace(/;$/, "");
        if (!seen.has(decl)) {
          seen.add(decl);
          fontVars.push(decl);
        }
      }
    }

    return {
      links: fontLinks.join("\n"),
      inlineCss: fontVars.length ? `:root{${fontVars.join(";")}}` : "",
    };
  } catch {
    // Storefront unavailable (password-protected, network error, timeout) — silent fallback
    return { links: "", inlineCss: "" };
  }
}

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
<!-- Pre-modal product page view — shown when DCP widgetStyle section is active.
     Displays the bundle slot cards as they appear on the storefront product page,
     BEFORE the modal opens. Uses actual widget classes (.bw-slot-card--empty) so
     CSS variable changes (bg, border, text colour, border style) are reflected live. -->
<div class="dcp-pdp-pre-modal-view" style="display:none;">
  <div class="dcp-pdp-page-layout">

    <div class="dcp-pdp-image-col">
      <div class="dcp-pdp-image-placeholder"></div>
    </div>

    <div class="dcp-pdp-info-col">
      <p class="dcp-pdp-vendor">WOLFPACK BUNDLES</p>
      <h2 class="dcp-pdp-product-title">Summer Bundle</h2>
      <p class="dcp-pdp-product-price">From $49.99</p>
      <div class="dcp-pdp-divider"></div>

      <!-- Bundle widget app block (as rendered on the product page) -->
      <div class="bundle-builder-app dcp-pdp-bundle-app">
        <div class="bundle-steps">

          <div class="step-box bw-slot-card bw-slot-card--empty" data-step-index="0">
            <div class="bw-slot-card__plus-icon">
              <svg width="28" height="28" viewBox="0 0 40 40" fill="none">
                <path d="M20.202 3.06152V37.0082M37.1753 20.0348H3.22864" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <p class="step-name bw-slot-card__label">Choose Tops</p>
          </div>

          <div class="step-box bw-slot-card bw-slot-card--empty" data-step-index="1">
            <div class="bw-slot-card__plus-icon">
              <svg width="28" height="28" viewBox="0 0 40 40" fill="none">
                <path d="M20.202 3.06152V37.0082M37.1753 20.0348H3.22864" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <p class="step-name bw-slot-card__label">Choose Bottoms</p>
          </div>

          <div class="step-box bw-slot-card bw-slot-card--empty" data-step-index="2">
            <div class="bw-slot-card__plus-icon">
              <svg width="28" height="28" viewBox="0 0 40 40" fill="none">
                <path d="M20.202 3.06152V37.0082M37.1753 20.0348H3.22864" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <p class="step-name bw-slot-card__label">Accessories</p>
          </div>

        </div>
        <button class="add-bundle-to-cart">Customize Bundle</button>
      </div>
    </div>

  </div>
</div>

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

      </div>

    </div>

    <!-- Discount messaging in header area -->
    <div class="modal-header-discount-messaging">
      <div class="footer-discount-text">Add 1 more item to unlock 20% off</div>
    </div>

    <!-- Modal footer: floating pill design -->
    <div class="modal-footer">
      <div class="modal-footer-cart-pill">
        <span class="cart-badge-count">1</span>
        <svg class="cart-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="9" cy="21" r="1" fill="currentColor" stroke="none"/>
          <circle cx="20" cy="21" r="1" fill="currentColor" stroke="none"/>
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
        </svg>
      </div>
      <div class="modal-footer-nav-pill">
        <button class="modal-nav-button prev-button">Back</button>
        <button class="modal-nav-button next-button">Next</button>
      </div>
    </div>

  </div>
</div>
`.trim();

// ─── FPB preview HTML — Sidebar layout (footer_side) ──────────────────────────
// Three-column layout: step-tabs (left) | product grid (center) | side panel (right).
// Structure matches live widget: tier-pills → header → bundle-steps → sidebar-layout-wrapper
//   with step-tabs-container as direct flex child (left column), sidebar-content (center),
//   and full-page-side-panel (right).

const fpbSidebarHtml = `
<div class="bundle-widget-full-page">

  <!-- Tier pills — live widget inserts these as container.firstChild (before header) -->
  <div class="bundle-tier-pill-bar" role="group" aria-label="Bundle pricing tiers">
    <button type="button" class="bundle-tier-pill bundle-tier-pill--active" data-tier-index="0" aria-pressed="true">Buy 2 — Save 10%</button>
    <button type="button" class="bundle-tier-pill" data-tier-index="1" aria-pressed="false">Buy 3 — Save 20%</button>
    <button type="button" class="bundle-tier-pill bundle-tier-pill--disabled" data-tier-index="2" aria-pressed="false">Buy 5 — Save 30%</button>
  </div>

  <!-- Bundle header -->
  <div class="bundle-header">
    <h1 class="bundle-title">Summer Bundle</h1>
    <p class="bundle-description">Build your perfect summer outfit and save 20%</p>
  </div>

  <!-- Steps container — sidebar layout -->
  <div class="bundle-steps full-page-layout layout-sidebar">

    <!-- Step timeline tabs — above the two-column area (horizontal bar, same as floating layout) -->
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

    <div class="sidebar-layout-wrapper">

      <!-- Center: promo banner (hidden by CSS in sidebar) + search + product grid -->
      <div class="full-page-content-section sidebar-content">

        <!-- Promo banner — inside sidebar-content, hidden via CSS in sidebar layout -->
        <div class="promo-banner has-discount">
          <div class="promo-banner-subtitle">Mix &amp; Match</div>
          <h2 class="promo-banner-title">Summer Bundle — Save 20%</h2>
          <div class="promo-banner-note">Buy any 3 items and save automatically at checkout</div>
        </div>

        <div class="step-search-container">
          <div class="step-search-input-wrapper">
            <svg class="step-search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"/>
              <path d="M21 21l-4.35-4.35"/>
            </svg>
            <input type="text" class="step-search-input" placeholder="Search products..." autocomplete="off" value="">
          </div>
        </div>

        <div class="full-page-product-grid-container">
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

        </div><!-- /.full-page-product-grid -->
        </div><!-- /.full-page-product-grid-container -->

      </div><!-- /.sidebar-content -->

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
    </div><!-- /.full-page-side-panel -->

  </div><!-- /.sidebar-layout-wrapper -->
  </div><!-- /.bundle-steps -->

</div><!-- /.bundle-widget-full-page -->

<!-- Mobile: backdrop overlay (position:fixed, shown when sheet is open) -->
<div class="fpb-mobile-backdrop"></div>

<!-- Mobile: slide-up summary sheet (mirrors side panel content, position:fixed bottom:56px) -->
<div class="fpb-mobile-bottom-sheet">
  <div class="side-panel-header">
    <span class="side-panel-title">Your Bundle</span>
    <button class="side-panel-clear-btn" type="button">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
      Clear
    </button>
  </div>
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

<!-- Mobile: sticky bottom bar (position:fixed bottom:0, visible at ≤767px via CSS) -->
<div class="fpb-mobile-bottom-bar">
  <button class="fpb-mobile-toggle-btn" type="button" aria-label="View bundle summary">
    <span class="fpb-caret">&#9650;</span>
    <span class="fpb-mobile-toggle-count">2</span>
  </button>
  <div class="fpb-mobile-total">$62.98</div>
  <button class="fpb-mobile-cta-btn" type="button">Next</button>
</div>
`.trim();

// ─── FPB preview HTML — Floating footer layout (footer_bottom) ─────────────────
// Structure matches live widget: tier-pills → header → bundle-steps.full-page-layout
//   → full-page-content-section (promo + step-tabs + search + product-grid)
//   → full-page-footer.floating-card (outside bundle-steps, at root level).

const fpbFloatingHtml = `
<div class="bundle-widget-full-page">

  <!-- Tier pills — live widget inserts these as container.firstChild (before header) -->
  <div class="bundle-tier-pill-bar" role="group" aria-label="Bundle pricing tiers">
    <button type="button" class="bundle-tier-pill bundle-tier-pill--active" data-tier-index="0" aria-pressed="true">Buy 2 — Save 10%</button>
    <button type="button" class="bundle-tier-pill" data-tier-index="1" aria-pressed="false">Buy 3 — Save 20%</button>
    <button type="button" class="bundle-tier-pill bundle-tier-pill--disabled" data-tier-index="2" aria-pressed="false">Buy 5 — Save 30%</button>
  </div>

  <!-- Bundle header -->
  <div class="bundle-header">
    <h1 class="bundle-title">Summer Bundle</h1>
    <p class="bundle-description">Build your perfect summer outfit and save 20%</p>
  </div>

  <!-- Steps container -->
  <div class="bundle-steps full-page-layout">

    <!-- Main content section (promo + step-tabs + search + grid) -->
    <div class="full-page-content-section">

      <!-- Promo banner -->
      <div class="promo-banner has-discount">
        <div class="promo-banner-subtitle">Mix &amp; Match</div>
        <h2 class="promo-banner-title">Summer Bundle — Save 20%</h2>
        <div class="promo-banner-note">Buy any 3 items and save automatically at checkout</div>
      </div>

      <!-- Step tabs (horizontal row in floating layout) -->
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

      <div class="step-search-container">
        <div class="step-search-input-wrapper">
          <svg class="step-search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/>
            <path d="M21 21l-4.35-4.35"/>
          </svg>
          <input type="text" class="step-search-input" placeholder="Search products..." autocomplete="off" value="">
        </div>
      </div>

      <div class="full-page-product-grid-container">
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

      </div><!-- /.full-page-product-grid -->
      </div><!-- /.full-page-product-grid-container -->

    </div><!-- /.full-page-content-section -->
  </div><!-- /.bundle-steps -->

  <!-- Floating footer bar (sticky at bottom) -->
  <div class="full-page-footer floating-card">
    <div class="footer-callout-banner">🎉 You unlocked 20% off!</div>
    <div class="footer-bar">
      <div class="footer-thumbstrip">
        <img src="${PLACEHOLDER_IMG}" alt="Polo Shirt" class="footer-thumbstrip-img">
        <img src="${PLACEHOLDER_IMG}" alt="Linen Shirt" class="footer-thumbstrip-img">
        <img src="${PLACEHOLDER_IMG}" alt="Denim Jacket" class="footer-thumbstrip-img">
      </div>
      <div class="footer-centre">
        <button class="footer-toggle" type="button">
          <span class="footer-toggle-text">3/3 Products</span>
          <svg class="footer-chevron" viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M5 8l5 5 5-5"/>
          </svg>
        </button>
        <div class="footer-total-area">
          <span class="footer-total-label">Total:</span>
          <div class="footer-total-prices">
            <span class="footer-total-original">$89.97</span>
            <span class="footer-total-final">$71.98</span>
            <span class="footer-discount-badge">20% OFF</span>
          </div>
        </div>
      </div>
      <button class="footer-cta-btn" type="button">Next</button>
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
html, body {
  margin: 0;
  padding: 0;
  height: 100%;
  /* Use the storefront theme's font family (injected from fetchThemeFontAssets).
     Falls back through common Shopify OS 2.0 theme variable names before the
     system font stack so any modern theme is covered automatically. */
  font-family: var(--font-body-family, var(--font-body, var(--body-font-family, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif)));
  overflow-y: auto;
}

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

/* FPB: do not enforce min-height in preview — content should be as tall as it is */
.bundle-widget-full-page {
  min-height: unset;
}

/* Preview: tier pills hidden by default — only shown when on the Pricing Tier Pills section */
.bundle-tier-pill-bar { display: none; }

/* Preview: show promo banner in sidebar layout so merchants can style it in DCP.
   Production CSS hides it in sidebar layout (too much vertical space), but in the
   design preview we always want it visible so color/text changes are reflected. */
.layout-sidebar .promo-banner { display: block !important; }

/* ── PDP: pre-modal product page view (Widget Style section) ───────────────────
   Shown instead of the bottom-drawer modal when widgetStyle is the active DCP
   section. Replicates how slot cards look on the live storefront product page. */
.dcp-pdp-pre-modal-view {
  position: fixed;
  inset: 0;
  background: #f9f9f9;
  overflow-y: auto;
  padding: 28px 24px;
}
.dcp-pdp-page-layout {
  display: flex;
  gap: 32px;
  max-width: 840px;
  margin: 0 auto;
}
.dcp-pdp-image-col { flex-shrink: 0; }
.dcp-pdp-image-placeholder {
  width: 260px;
  height: 320px;
  background: #e0e0e0;
  border-radius: 10px;
}
.dcp-pdp-info-col {
  flex: 1;
  min-width: 0;
  padding-top: 4px;
}
.dcp-pdp-vendor {
  margin: 0 0 6px;
  font-size: 11px;
  font-weight: 600;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}
.dcp-pdp-product-title {
  margin: 0 0 8px;
  font-size: 22px;
  font-weight: 700;
  color: #111;
}
.dcp-pdp-product-price {
  margin: 0 0 16px;
  font-size: 18px;
  font-weight: 600;
  color: #111;
}
.dcp-pdp-divider {
  height: 1px;
  background: #e5e7eb;
  margin-bottom: 20px;
}
/* Constrain slot card size so 3 cards fit comfortably in the info column */
.dcp-pdp-bundle-app .bundle-steps {
  --step-box-size: 140px;
}
`;

// ─── BroadcastChannel script ──────────────────────────────────────────────────
//
// Uses BroadcastChannel (same-origin) instead of window.postMessage because
// @shopify/app-bridge-react v4 renders DCP modals in separate modal-frame iframes
// (e.g. frame://wolfpack-product-bundles-sit/modal/...).  window.parent inside these
// preview iframes points to the modal frame — NOT the app-iframe where PreviewPanel
// listens — so window.parent.postMessage never reaches PreviewPanel.
// BroadcastChannel bypasses the frame hierarchy entirely.

function getPreviewScript(type: string): string {
  return `(function() {
  var bc = new BroadcastChannel('dcp-css-updates-${type}');

  bc.addEventListener('message', function(e) {
    if (!e.data) return;

    if (e.data.type === 'DCP_CSS_UPDATE') {
      var styleEl = document.getElementById('dcp-live-vars');
      if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = 'dcp-live-vars';
        document.head.appendChild(styleEl);
      }
      styleEl.textContent = ':root{' + e.data.vars + '}';
    }

    if (e.data.type === 'DCP_SECTION_CHANGE') {
      var section = e.data.section || '';
      var tierBar = document.querySelector('.bundle-tier-pill-bar');
      var stepTabs = document.querySelector('.step-tabs-container');
      // Tier pills visible only when editing their section; step tabs visible everywhere else.
      // Must use explicit 'flex'/'block' — '' (empty string) only clears the inline style and
      // the CSS .bundle-tier-pill-bar { display: none } rule would immediately take over again.
      if (tierBar) tierBar.style.display = section === 'tierPills' ? 'flex' : 'none';
      if (stepTabs) stepTabs.style.display = section === 'tierPills' ? 'none' : 'flex';

      // Skeleton preview: swap product cards ↔ skeleton cards when on skeletonLoading section.
      var grid = document.querySelector('.full-page-product-grid');
      if (grid) {
        if (section === 'skeletonLoading') {
          if (!grid.dataset.originalHtml) {
            grid.dataset.originalHtml = grid.innerHTML;
          }
          var skeletonHtml = '';
          for (var i = 0; i < 6; i++) {
            skeletonHtml += '<div class="product-card skeleton-loading"><div class="skeleton-card-content"></div></div>';
          }
          grid.innerHTML = skeletonHtml;
        } else if (grid.dataset.originalHtml) {
          grid.innerHTML = grid.dataset.originalHtml;
          delete grid.dataset.originalHtml;
        }
      }

      // PDP only: when widgetStyle is active, hide the bottom-drawer modal entirely
      // and show the pre-modal product page view instead. This correctly replicates
      // where empty slot cards actually appear — on the product page, not in the modal.
      // These elements only exist in the PDP preview HTML — querySelector returns null
      // for FPB, so the null-checks make this a no-op for the FPB preview script.
      var modal = document.querySelector('.bundle-builder-modal');
      var preModalView = document.querySelector('.dcp-pdp-pre-modal-view');
      if (modal && preModalView) {
        var showPreModal = section === 'widgetStyle';
        modal.style.display = showPreModal ? 'none' : '';
        preModalView.style.display = showPreModal ? 'block' : 'none';
      }
    }
  });

  // Notify PreviewPanel that this iframe is ready to receive CSS updates.
  // BroadcastChannel is used so the message reaches the app-iframe regardless
  // of which modal frame this preview iframe lives inside.
  window.addEventListener('load', function() {
    bc.postMessage({ type: 'DCP_PREVIEW_READY' });
  });
})();`;
}

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

  // Fetch storefront theme fonts — 3s timeout, silent fallback on failure.
  // Injects font <link> tags + CSS custom properties so the preview matches
  // the merchant's live storefront typography.
  const { links: themeFontLinks, inlineCss: themeFontCss } =
    await fetchThemeFontAssets(shop);

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Bundle Widget Preview</title>
  ${themeFontLinks}
  ${themeFontCss ? `<style id="theme-fonts">${themeFontCss}</style>` : ""}
  ${designSettingsCssUrl ? `<link id="design-settings-css" rel="stylesheet" href="${designSettingsCssUrl}">` : ""}
  <style id="widget-css">${widgetCss}</style>
  <style id="full-page-css">${fullPageCss}</style>
  <style id="page-layout-css">${pageLayoutCss}</style>
  <style id="dcp-live-vars">/* CSS variables injected via BroadcastChannel */</style>
  <script>${getPreviewScript(type)}</script>
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
