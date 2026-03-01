# Architecture Decision Record: Loading GIF Overlay

## Context

Add a merchant-configurable loading GIF overlay to both bundle widgets. Three trigger moments: initial load, step transitions, Add to Cart. GIF URL stored per-bundle in DB → synced to metafield → returned by API → read by widget JS.

## Constraints

- Must not break existing widget behaviour (init, navigation, add-to-cart)
- Both widgets share `bundle-widget.css` — overlay CSS goes there
- Widget JS files must be rebuilt after changes (`npm run build:widgets`)
- Product-page widget reads bundle from `data-bundle-config` dataset (synchronous)
- Full-page widget fetches bundle from API (async) — GIF URL unavailable before fetch completes
- No new DB migration command needed (will use `prisma db push` pattern like previous image fields)

## Options Considered

### Option A: Overlay on `this.container` for all 3 moments
`position: absolute; inset: 0` on the widget root container for initial load, step transitions, and add-to-cart.
- Pros: One method pair (`showLoadingOverlay` / `hideLoadingOverlay`), minimal complexity, covers entire widget area consistently.
- Cons: During full-page step transitions, the footer is also covered (but that's acceptable — prevents double-clicks during transition).
- **Verdict: ✅ Recommended**

### Option B: Scoped overlay (container for init/cart, modal content for step transitions)
Show overlay on product grid container for step transitions, container for the others.
- Pros: More precise visual targeting.
- Cons: Full-page widget doesn't use a modal — step transition just re-renders inline content. Requires different element references per moment. More complex.
- **Verdict: ❌ Rejected** — unnecessary complexity for marginal UX gain.

### Option C: Pure CSS animation without JS overlay
Use CSS animations on skeleton cards.
- Pros: No JS changes.
- Cons: Cannot show merchant GIF; does not satisfy FR-04.
- **Verdict: ❌ Rejected**

## Decision: Option A — single `showLoadingOverlay(gifUrl?)` / `hideLoadingOverlay()` pair on `this.container`

## Data Model

```typescript
// prisma/schema.prisma — Bundle model
loadingGif  String?   // Nullable GIF URL

// app/services/bundles/metafield-sync/types.ts — BundleUiConfig
loadingGif?: string | null;

// API response (api.bundle.$bundleId[.]json.tsx) — formattedBundle
loadingGif: bundle.loadingGif ?? null,
```

## CSS Design (bundle-widget.css)

```css
/* Loading overlay — covers widget container */
.bundle-loading-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s ease;
  border-radius: inherit;
}
.bundle-loading-overlay.is-visible {
  opacity: 1;
  pointer-events: all;
}
.bundle-loading-overlay__gif {
  max-width: 120px;
  max-height: 120px;
  width: auto;
  height: auto;
  display: block;
}
.bundle-loading-overlay__spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(255, 255, 255, 0.25);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: bundle-spin 0.75s linear infinite;
}
@keyframes bundle-spin {
  to { transform: rotate(360deg); }
}
```

## JS Overlay Methods (both widgets)

```javascript
showLoadingOverlay(gifUrl) {
  // Ensure container is positioned
  if (!['relative','absolute','fixed','sticky'].includes(
    getComputedStyle(this.container).position
  )) {
    this.container.style.position = 'relative';
  }
  // Remove any existing overlay (idempotent)
  this.container.querySelector('.bundle-loading-overlay')?.remove();

  const overlay = document.createElement('div');
  overlay.className = 'bundle-loading-overlay';

  if (gifUrl) {
    const img = document.createElement('img');
    img.className = 'bundle-loading-overlay__gif';
    img.src = gifUrl;
    img.alt = '';
    overlay.appendChild(img);
  } else {
    const spinner = document.createElement('div');
    spinner.className = 'bundle-loading-overlay__spinner';
    overlay.appendChild(spinner);
  }

  this.container.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('is-visible'));
}

hideLoadingOverlay() {
  const overlay = this.container?.querySelector('.bundle-loading-overlay');
  if (!overlay) return;
  overlay.classList.remove('is-visible');
  overlay.addEventListener('transitionend', () => overlay.remove(), { once: true });
}
```

## Call Sites

### Product-page widget (`bundle-widget-product-page.js`)

**`init()` — initial load:**
```javascript
// Before loadBundleData(): read gif from dataset (synchronous)
let initialGif = null;
try { initialGif = JSON.parse(this.container.dataset.bundleConfig || '{}')?.loadingGif || null; } catch {}
this.showLoadingOverlay(initialGif);
await this.loadBundleData();
// ... selectBundle, initializeDataStructures, setupDOMElements
this.renderUI();
this.hideLoadingOverlay();  // after renderUI
```

**`renderModalTabs()` tab click — step transition:**
```javascript
this.showLoadingOverlay(this.selectedBundle?.loadingGif || null);
await this.loadStepProducts(index);
this.renderModalTabs(); this.renderModalProducts(index); /* ... */
this.hideLoadingOverlay();
```

**`addToCart()` — cart fetch:**
```javascript
this.showLoadingOverlay(this.selectedBundle?.loadingGif || null);
// ... existing button disable + fetch ...
// in finally:
this.hideLoadingOverlay();
this.updateAddToCartButton();
```

### Full-page widget (`bundle-widget-full-page.js`)

**`init()` — initial load:**
```javascript
this.showLoadingOverlay(null);  // no gif url yet (API not called yet)
await this.loadBundleData();
this.selectBundle();
// ...
await this.renderUI();
this.hideLoadingOverlay();
```

**`renderFullPageLayout()` — step transition + initial product grid load:**
```javascript
// After creating productGridContainer with skeleton:
this.showLoadingOverlay(this.selectedBundle?.loadingGif || null);
try {
  await this.loadStepProducts(this.currentStepIndex);
  // ... replace skeleton with real products ...
  this.hideLoadingOverlay();
} catch (error) {
  this.hideLoadingOverlay();
  productGridContainer.innerHTML = '<p class="error-message">...</p>';
}
```

**`addBundleToCart()` — cart fetch:**
```javascript
const nextBtn = this.container.querySelector('.footer-btn-next');
if (nextBtn) nextBtn.disabled = true;
this.showLoadingOverlay(this.selectedBundle?.loadingGif || null);
try {
  // ... existing fetch ...
} catch {
  ToastManager.show(...);
} finally {
  this.hideLoadingOverlay();
  if (nextBtn) nextBtn.disabled = false;
}
```

Note: Full-page's `renderFullPageLayout()` is called both during init AND step transitions. Since the init overlay is shown in `init()` before `renderUI()`, and `renderFullPageLayout()` runs inside `renderUI()`, the overlay from `renderFullPageLayout()` will overlap with the init overlay. This is harmless — calling `showLoadingOverlay()` when overlay already exists removes the old one and creates a fresh one (idempotent).

## Files to Modify

| File | Change |
|------|--------|
| `prisma/schema.prisma` | Add `loadingGif String?` to Bundle model |
| `app/services/bundles/metafield-sync/types.ts` | Add `loadingGif?: string \| null` to BundleUiConfig |
| `app/services/bundles/metafield-sync/operations/bundle-product.server.ts` | Add `loadingGif` to bundleUiConfig builder |
| `app/routes/api/api.bundle.$bundleId[.]json.tsx` | Add `loadingGif` to formattedBundle response |
| `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/handlers/handlers.server.ts` | Parse `loadingGif` from FormData, save to DB |
| `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/route.tsx` | Add `loadingGif` state + ref + FilePicker card + formData + deps + discard |
| `app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/handlers/handlers.server.ts` | Parse `loadingGif` from FormData, save to DB |
| `app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/route.tsx` | Add `images_gifs` nav tab + section + state + FilePicker + formData + deps |
| `extensions/bundle-builder/assets/bundle-widget.css` | Add overlay CSS + spinner keyframe |
| `app/assets/bundle-widget-product-page.js` | Add `showLoadingOverlay` / `hideLoadingOverlay` + call sites |
| `app/assets/bundle-widget-full-page.js` | Add `showLoadingOverlay` / `hideLoadingOverlay` + call sites |
| `extensions/bundle-builder/assets/bundle-widget-product-page-bundled.js` | Auto-generated by build |
| `extensions/bundle-builder/assets/bundle-widget-full-page-bundled.js` | Auto-generated by build |

## Migration / Backward Compatibility

- `loadingGif String?` — nullable, no default needed. All existing bundles will have `null` → CSS spinner shown.
- DB sync: `npx prisma db push` (same pattern as `promoBannerBgImage`)
- Metafield: field is optional in BundleUiConfig — existing metafields without `loadingGif` gracefully handled by `?? null` in widget

## Testing Approach

- Manual: upload a GIF, save, view storefront → confirm overlay appears and fades out at all 3 moments
- Manual: clear GIF, save, view storefront → confirm CSS spinner appears instead
- Unit: no new pure functions to test (overlay methods are DOM-side effects)
