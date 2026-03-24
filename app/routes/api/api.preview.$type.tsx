/**
 * App-served bundle widget preview page
 *
 * Returns a full HTML document that renders mock widget HTML styled with the
 * merchant's current design settings. This page is loaded in an iframe inside
 * the DCP modal, replacing the dual-mode approach.
 *
 * Same-origin as the app → no X-Frame-Options issues + real-time CSS variable
 * injection via postMessage from the parent DCP frame.
 *
 * URL: /api/preview/pdp?shop=xxx.myshopify.com
 *      /api/preview/fpb?shop=xxx.myshopify.com
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
// Shows the bundle modal open over a mock product page. The merchant can see
// all PDP widget components: header tabs, product cards, modal footer, etc.

const pdpPageHtml = `
<!-- Mock product page background -->
<div class="preview-page-bg">
  <div class="preview-page-inner">
    <div class="preview-product-image-placeholder">
      <img src="${PLACEHOLDER_IMG}" alt="Product" style="width:100%;height:100%;object-fit:cover;border-radius:8px;">
    </div>
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

<!-- Bundle modal overlay (open by default) -->
<div class="bundle-modal-overlay" style="position:fixed;inset:0;background:rgba(0,0,0,0.55);display:flex;align-items:center;justify-content:center;z-index:100;padding:16px;">
  <div class="bundle-widget" style="width:100%;max-width:780px;max-height:90vh;display:flex;flex-direction:column;overflow:hidden;border-radius:12px;box-shadow:0 24px 64px rgba(0,0,0,0.25);">
    <div class="modal-content" style="position:relative;width:100%;height:100%;display:flex;flex-direction:column;overflow:hidden;">

      <!-- Modal header -->
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
      <div class="modal-body" style="flex:1;overflow-y:auto;padding:16px;">
        <div class="product-grid">
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
              <select class="variant-selector" data-product-id="p1">
                <option>Size: S</option><option>Size: M</option><option>Size: L</option>
              </select>
              <button class="product-add-btn" data-product-id="p1">Add to Bundle</button>
            </div>
          </div>

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
              <button class="product-add-btn" data-product-id="p3">Add to Bundle</button>
            </div>
          </div>

          <div class="product-card dimmed" data-product-id="p4">
            <div class="product-image">
              <img src="${PLACEHOLDER_IMG}" alt="Cap" loading="lazy">
            </div>
            <div class="product-content-wrapper">
              <div class="product-title">Sport Cap</div>
              <div class="product-price-row">
                <span class="product-price">$14.99</span>
              </div>
              <div class="product-spacer"></div>
              <button class="product-add-btn" disabled>Add to Bundle</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Modal footer -->
      <div class="modal-footer">
        <div class="modal-footer-grouped-content">
          <div class="modal-footer-total-pill">
            <span class="total-price-strike">$44.98</span>
            <span class="total-price-final">$34.99</span>
            <span class="price-cart-separator">|</span>
            <span class="cart-badge-wrapper">
              <span class="cart-badge-count">1</span>
              <svg class="cart-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
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
  </div>
</div>
`.trim();

// ─── FPB preview HTML ─────────────────────────────────────────────────────────
// Shows the full-page bundle widget layout: step sidebar + product grid + footer.

const fpbPageHtml = `
<div class="bundle-widget-full-page" style="min-height:100vh;display:flex;flex-direction:column;">
  <div class="full-page-layout" style="flex:1;display:flex;overflow:hidden;">

    <!-- Left: step timeline sidebar -->
    <div class="step-tabs-container" style="flex-shrink:0;">
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

    <!-- Center: product grid -->
    <div class="full-page-content-section" style="flex:1;overflow-y:auto;padding:16px;">
      <div class="full-page-product-grid">
        <div class="product-card" data-product-id="f1">
          <div class="product-image">
            <img src="${PLACEHOLDER_IMG}" alt="Classic Tee" loading="lazy">
          </div>
          <div class="product-content-wrapper">
            <div class="product-title">Classic Tee</div>
            <div class="product-price-row">
              <span class="product-price-strike">$24.99</span>
              <span class="product-price">$19.99</span>
            </div>
            <div class="product-spacer"></div>
            <button class="product-add-btn" data-product-id="f1">Add</button>
          </div>
        </div>

        <div class="product-card selected" data-product-id="f2">
          <div class="selected-overlay">✓</div>
          <div class="product-image">
            <img src="${PLACEHOLDER_IMG}" alt="Polo Shirt" loading="lazy">
          </div>
          <div class="product-content-wrapper">
            <div class="product-title">Polo Shirt</div>
            <div class="product-price-row">
              <span class="product-price-strike">$39.99</span>
              <span class="product-price">$32.99</span>
            </div>
            <div class="product-spacer"></div>
            <div class="inline-quantity-controls">
              <button class="inline-qty-btn qty-decrease">−</button>
              <span class="inline-qty-display">1</span>
              <button class="inline-qty-btn qty-increase">+</button>
            </div>
          </div>
        </div>

        <div class="product-card selected" data-product-id="f3">
          <div class="selected-overlay">✓</div>
          <div class="product-image">
            <img src="${PLACEHOLDER_IMG}" alt="Linen Shirt" loading="lazy">
          </div>
          <div class="product-content-wrapper">
            <div class="product-title">Linen Shirt</div>
            <div class="product-price-row">
              <span class="product-price">$29.99</span>
            </div>
            <div class="product-spacer"></div>
            <div class="inline-quantity-controls">
              <button class="inline-qty-btn qty-decrease">−</button>
              <span class="inline-qty-display">1</span>
              <button class="inline-qty-btn qty-increase">+</button>
            </div>
          </div>
        </div>

        <div class="product-card" data-product-id="f4">
          <div class="product-image">
            <img src="${PLACEHOLDER_IMG}" alt="Denim Jacket" loading="lazy">
          </div>
          <div class="product-content-wrapper">
            <div class="product-title">Denim Jacket</div>
            <div class="product-price-row">
              <span class="product-price">$59.99</span>
            </div>
            <div class="product-spacer"></div>
            <button class="product-add-btn" data-product-id="f4">Add</button>
          </div>
        </div>
      </div>
    </div>

  </div>

  <!-- Footer bar -->
  <div class="full-page-bottom-footer">
    <div class="footer-selected-products">
      <div style="font-size:13px;color:var(--bundle-full-page-footer-header-color,#1E1E1E);font-weight:600;margin-bottom:8px;">
        Selected (2/3)
      </div>
      <div style="display:flex;gap:8px;overflow-x:auto;">
        <div class="footer-product-pill">
          <img src="${PLACEHOLDER_IMG}" alt="Polo Shirt" style="width:28px;height:28px;object-fit:cover;border-radius:4px;">
          <span style="font-size:12px;">Polo Shirt</span>
        </div>
        <div class="footer-product-pill">
          <img src="${PLACEHOLDER_IMG}" alt="Linen Shirt" style="width:28px;height:28px;object-fit:cover;border-radius:4px;">
          <span style="font-size:12px;">Linen Shirt</span>
        </div>
      </div>
    </div>
    <div class="footer-total">
      <div class="footer-total-section">
        <span class="total-label">Bundle Total</span>
        <div class="total-prices">
          <span class="total-original">$69.98</span>
          <span class="total-final">$54.99</span>
        </div>
      </div>
      <div style="display:flex;gap:8px;margin-top:12px;">
        <button class="footer-back-btn">← Back</button>
        <button class="footer-next-btn">Next →</button>
      </div>
    </div>
  </div>
</div>
`.trim();

// ─── Page skeleton CSS ─────────────────────────────────────────────────────────

const pageLayoutCss = `
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; height: 100%; }

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
  overflow: hidden;
}

/* Footer pill for FPB preview */
.footer-product-pill {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  background: var(--bundle-full-page-footer-product-bg, #fff);
  border: 1px solid var(--bundle-full-page-footer-product-border, #e0e0e0);
  border-radius: var(--bundle-full-page-footer-product-border-radius, 8px);
  white-space: nowrap;
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
  const appUrl = (process.env.SHOPIFY_APP_URL ?? "").replace(/\/$/, "");

  const bundleType = type === "pdp" ? "product_page" : "full_page";
  const designSettingsCssUrl = shop
    ? `${appUrl}/api/design-settings/${shop}?bundleType=${bundleType}`
    : "";

  const { widgetCss, fullPageCss } = getWidgetCss();
  const bodyHtml = type === "pdp" ? pdpPageHtml : fpbPageHtml;

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
      // Allow embedding only from same origin (app origin)
      "X-Frame-Options": "SAMEORIGIN",
      // No caching — preview should always reflect latest CSS
      "Cache-Control": "no-store",
    },
  });
}
