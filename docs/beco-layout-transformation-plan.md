# Beco BYOB Layout Transformation Plan

**Goal:** Transform our current full-page bundle widget to match Beco's BYOB layout and design language, while:
1. Keeping neutral/subtle default colors (not lime green)
2. Preserving all DCP customization hooks
3. Preserving all existing functionality (multi-step, variant selection, pricing, cart)

**Reference:** `docs/beco-bundle-design-analysis.md` + `docs/beco-bundle-reference.png`

---

## Transformation Overview

### What Changes

| Component | Current | Beco Target |
|---|---|---|
| Page wrapper | Full viewport, left-aligned | Content centered at `max-width: 1080px` |
| Tier/Step selector | Step timeline with circles + numbers | Horizontal pill buttons row (one per step) |
| Hero banner | Rectangular colored box with text | Wide `aspect-ratio: 4.8/1` image/video banner |
| Product grid | 3-col CSS grid, plain white cards | 4-col CSS grid, tinted cards with rounded corners |
| Product card | White bg, 8px radius, orange ATC btn | Tinted bg, 24px radius, colored border, pill ATC btn |
| Rating row | Not present | Rating badge pill + star + review count |
| Bottom cart | Full-width footer with back/next buttons | Floating centered card (800px), offset from bottom |
| Cart callout | Progress text in footer | Thin banner strip at top of cart card |
| Cart line items | Horizontal tile strip in footer | Vertical list with image + title + price + remove |
| Stacked thumbs | Not present | Overlapping circular thumbnails in footer |
| CTA button | "Next" or "Add to Cart" | "BUY BUNDLE" (or "NEXT") — black rounded button |

### What Stays the Same
- All DCP CSS variables and their DB mappings
- Multi-step logic, step locking, step completion
- `updateProductSelection()` state flow
- Cart add flow (`addBundleToCart()`)
- Product variant modal (`BundleProductModal`)
- Search input
- Category tabs
- Toast notifications
- All shared modules

---

## New Default Color Tokens (Neutral Palette)

These replace Beco's lime-green defaults. All are overridable via DCP.

| Token | Value | Replaces Beco | Usage |
|---|---|---|---|
| `--bundle-card-bg` | `#F5F5F5` | `#E6FAE2` | Product card background |
| `--bundle-card-border` | `rgba(0,0,0,0.10)` | `#00FF00` | Product card border |
| `--bundle-card-radius` | `16px` | `24px` | Product card border radius |
| `--bundle-atc-bg` | `var(--bundle-button-bg, #111)` | `#00FF00` | ATC button background |
| `--bundle-atc-text` | `var(--bundle-button-text-color, #FFF)` | `#000` | ATC button text |
| `--bundle-rating-badge-bg` | `#F0F0F0` | `#E6FAE2` | Rating pill background |
| `--bundle-rating-badge-border` | `rgba(0,0,0,0.15)` | `#00FF00` | Rating pill border |
| `--bundle-tier-active-bg` | `var(--bundle-global-primary-button, #111)` | `#00FF00` | Active tier button bg |
| `--bundle-tier-active-text` | `var(--bundle-global-button-text, #FFF)` | `#000` | Active tier button text |
| `--bundle-tier-inactive-bg` | `#F5F5F5` | `#F2FAEE` | Inactive tier button bg |
| `--bundle-tier-inactive-text` | `#111` | `#000` | Inactive tier button text |
| `--bundle-callout-bg` | `#F0F4FF` | `#C2FBBE` | Callout bar background |
| `--bundle-callout-text` | `#333` | `#000` | Callout bar text |
| `--bundle-cart-footer-bg` | `#F8F8F8` | `#F1F9EC` | Cart footer row bg |
| `--bundle-buy-btn-bg` | `#111111` | `#000` | BUY BUNDLE button |
| `--bundle-buy-btn-text` | `#FFFFFF` | `#FFF` | BUY BUNDLE button text |
| `--bundle-cart-shadow` | `rgba(0,0,0,0.15) 0px 8px 24px 0px` | `rgba(0,0,0,0.2) 0px 10px 24px 0px` | Cart card shadow |

---

## Component-by-Component Changes

---

### 1. Page Wrapper & Content Centering

**File:** `extensions/bundle-builder/assets/bundle-widget-full-page.css`

**Current:** `.bundle-widget-full-page` is full viewport width, no centering. The inner `.full-page-content-section` is also full-width.

**Beco layout:** Content is `max-width: 1080px`, centered with `margin: 0 auto`. The sticky cart is `max-width: 800px`, also centered.

**CSS change:**
```css
/* Add to .full-page-content-section */
.full-page-content-section {
  max-width: 1080px;
  margin: 0 auto;
  padding: 0 16px;
  width: 100%;
  box-sizing: border-box;
}

/* The bundle-steps wrapper should allow full-width footer */
.bundle-steps.full-page-layout {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;   /* centers the 1080px content block */
}
```

---

### 2. Step Tabs → Tier Selector Row

**File:** `app/assets/bundle-widget-full-page.js` — `createStepTimeline()` method
**File:** `extensions/bundle-builder/assets/bundle-widget-full-page.css`

**Current:** Step tabs render as a row of blocks with a circle number, step name, and connected timeline line. Each tab shows step completion status.

**Beco target:**
```
┌──────────────────────────────────────────────────────────────────┐
│   [● Step 1: Kitchen  >]   [Step 2: Bathroom  >]   [Step 3: ...] │
└──────────────────────────────────────────────────────────────────┘
```
- Horizontal row of equal-width buttons
- Active step = primary button color, solid
- Completed step = lighter shade with a checkmark icon
- Locked step = muted/disabled
- Chevron right `>` icon on the right of each button label
- Height: `52px`, border-radius: `8px`, 1px border
- Row padding: `16px 0 0` (no horizontal padding — the `full-page-content-section` provides that)
- Gap between buttons: `8px`

**HTML output change** (in `createStepTimeline()`):
```html
<!-- CURRENT generates: -->
<div class="step-tabs-container">
  <div class="step-tab active" data-step="0">
    <span class="tab-number">1</span>
    <div class="tab-info">...</div>
  </div>
  ...
</div>

<!-- NEW generates: -->
<div class="tier-selector-row">
  <button class="tier-btn tier-btn--active" data-step="0" type="button">
    <span class="tier-btn-label">Step 1: Kitchen</span>
    <svg class="tier-btn-chevron"><!-- chevron-right --></svg>
  </button>
  <button class="tier-btn" data-step="1" type="button">
    <svg class="tier-btn-check"><!-- checkmark if completed --></svg>
    <span class="tier-btn-label">Step 2: Bathroom</span>
    <svg class="tier-btn-chevron"><!-- chevron-right --></svg>
  </button>
  ...
</div>
```

**New CSS for tier selector:**
```css
.tier-selector-row {
  display: flex;
  flex-direction: row;
  gap: 8px;
  width: 100%;
  padding: 16px 0 0;
  box-sizing: border-box;
}

.tier-btn {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px 0 14px;
  height: 52px;
  flex: 1;
  border-radius: 8px;
  border: 1px solid rgba(0,0,0,0.15);
  background: var(--bundle-tier-inactive-bg, #F5F5F5);
  color: var(--bundle-tier-inactive-text, #111);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background 200ms, border-color 200ms;
  text-align: left;
}

.tier-btn--active {
  background: var(--bundle-tier-active-bg, #111);
  color: var(--bundle-tier-active-text, #FFF);
  border-color: var(--bundle-tier-active-bg, #111);
}

.tier-btn--completed {
  background: var(--bundle-tier-inactive-bg, #F5F5F5);
  border-color: var(--bundle-tier-active-bg, #111);
  color: var(--bundle-tier-active-bg, #111);
}

.tier-btn--locked {
  opacity: 0.4;
  cursor: not-allowed;
}

.tier-btn-label {
  flex: 1;
  font-size: 14px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tier-btn-sublabel {
  font-size: 11px;
  font-weight: 400;
  opacity: 0.75;
  margin-top: 1px;
  display: block;
}

.tier-btn-left {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
}

.tier-btn-chevron {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  opacity: 0.6;
}

.tier-btn-check {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  margin-right: 4px;
  color: var(--bundle-tier-active-bg, #111);
}
```

**DCP variables to add to `css-variables-generator.ts`:**
- `--bundle-tier-active-bg` ← `tierActiveBgColor` (default: `globalPrimaryButton`)
- `--bundle-tier-active-text` ← `tierActiveTextColor` (default: `globalButtonText`)
- `--bundle-tier-inactive-bg` ← `tierInactiveBgColor` (default: `#F5F5F5`)
- `--bundle-tier-inactive-text` ← `tierInactiveTextColor` (default: `#111111`)
- `--bundle-tier-btn-radius` ← `tierBtnBorderRadius` (default: `8px`)

---

### 3. Hero Banner (Promo Banner → Wide Aspect-Ratio Banner)

**File:** `app/assets/bundle-widget-full-page.js` — `createPromoBanner()` method
**File:** `extensions/bundle-builder/assets/bundle-widget-full-page.css`
**File:** `extensions/bundle-builder/blocks/bundle-full-page.liquid` (Liquid block settings schema)

**Current:** `.promo-banner` is a text-based box with a title, subtitle, and note. When a background image is set via DCP, it renders as a background-image with text overlay.

**Beco target:**
- The banner becomes a **full-width image or video** container
- `aspect-ratio: 4.8 / 1` (wide cinematic proportions — ~1080×225px at standard width)
- No text overlaid by default (the image/video IS the content)
- Text elements (title, note, subtitle) become optional overlays
- A `<video autoplay loop playsinline muted>` tag renders when a video URL is set via DCP

**New banner HTML:**
```html
<div class="bundle-hero-banner" style="aspect-ratio: var(--bundle-banner-aspect-ratio, 4.8/1);">
  <!-- When video URL is set: -->
  <video class="bundle-hero-banner__video" autoplay loop playsinline muted>
    <source type="video/mp4" src="{videoBannerUrl}">
  </video>
  <!-- OR when image is set: -->
  <img class="bundle-hero-banner__image" src="{imageBannerUrl}" alt="{title}">
  <!-- Text overlay (optional, behind DCP show/hide): -->
  <div class="bundle-hero-banner__overlay">
    <div class="promo-banner-subtitle">{subtitle}</div>
    <h2 class="promo-banner-title">{title}</h2>
    <div class="promo-banner-note">{note}</div>
  </div>
</div>
```

**New CSS:**
```css
.bundle-hero-banner {
  width: 100%;
  aspect-ratio: var(--bundle-banner-aspect-ratio, 4.8 / 1);
  border-radius: var(--bundle-promo-banner-radius, 12px);
  overflow: hidden;
  position: relative;
  background: var(--bundle-promo-banner-bg, #F3F4F6);
  margin: 12px 0 0;
}

.bundle-hero-banner__video,
.bundle-hero-banner__image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.bundle-hero-banner__overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 16px;
  text-align: center;
  /* Only shows text if variables are non-empty */
}
```

**New DCP variables to add:**
- `--bundle-banner-aspect-ratio` ← `bannerAspectRatio` (default: `4.8 / 1`)
- `--bundle-banner-video-url` ← `bannerVideoUrl` (new DB field — rendered as `<video src>`)
- `--bundle-banner-show-text-overlay` ← `bannerShowTextOverlay` (default: `1`, set to `0` to hide)

**Liquid block schema addition:**
```json
{
  "type": "text",
  "id": "banner_video_url",
  "label": "Banner Video URL (mp4)",
  "info": "If set, displays an autoplay looping video instead of background image"
},
{
  "type": "text",
  "id": "banner_aspect_ratio",
  "label": "Banner Aspect Ratio",
  "default": "4.8",
  "info": "Width/height ratio. 4.8 = wide cinematic, 3 = standard, 2 = compact"
}
```

---

### 4. Product Card — Full Redesign

**File:** `app/assets/widgets/shared/component-generator.js` — `renderProductCard()`
**File:** `extensions/bundle-builder/assets/bundle-widget-full-page.css`

This is the largest change. The card goes from a plain white box to the Beco-style tinted, rounded card with a rating row.

#### 4a. Grid Layout

**Current CSS:**
```css
.full-page-product-grid {
  display: grid;
  grid-template-columns: repeat(var(--bundle-product-cards-per-row, 3), var(--bundle-product-card-width, 280px));
  gap: var(--bundle-product-card-spacing, 12px);
}
```

**Beco target:** 4 columns (but remain DCP-configurable), `258px` each, `16px` gap. Cards have a fixed aspect that makes them auto-height driven by content.

**CSS update:**
```css
.full-page-product-grid {
  display: grid;
  grid-template-columns: repeat(var(--bundle-product-cards-per-row, 4), 1fr);
  gap: var(--bundle-product-card-spacing, 16px);
  width: 100%;
}
```
(Use `1fr` not `px` so it's responsive within the 1080px container.)

#### 4b. Card HTML Structure (new)

The card needs a **rating row** which we don't currently render. Product rating data (if available from Shopify Metafields) would need to be passed. Initially, we can show ratings only when the product has review data in its metafields (`product.metafields.reviews.rating` / `product.metafields.reviews.rating_count`).

```html
<!-- NEW card structure from renderProductCard() -->
<div class="product-card [selected]" data-product-id="{variantId}">

  <!-- Selected check overlay -->
  <div class="selected-overlay">✓</div>

  <!-- Image (top section — square, white bg) -->
  <button class="product-card__image-btn" type="button" data-product-id="{variantId}" aria-label="View {title}">
    <img
      class="product-card__image"
      src="{imageUrl}"
      alt="{title}"
      loading="lazy"
      onerror="this.src='{placeholder}'"
    />
  </button>

  <!-- Content (bottom section) -->
  <div class="product-card__content">

    <!-- Title -->
    <p class="product-card__title">{title}</p>

    <!-- Rating row (only if reviews data available) -->
    {#if hasRating}
    <div class="product-card__rating-row">
      <div class="product-card__rating-badge">
        <span class="product-card__rating-score">{rating}</span>
        <svg class="product-card__star-icon" viewBox="0 0 24 24"><!-- star --></svg>
      </div>
      <span class="product-card__review-count">({reviewCount} reviews)</span>
    </div>
    {/if}

    <!-- Price row -->
    <div class="product-card__price-row">
      <span class="product-price-strike">{compareAtPrice}</span>
      <span class="product-price">{price}</span>
    </div>

    <!-- Spacer -->
    <div class="product-card__spacer"></div>

    <!-- Variant selector (multi-variant, non-expanded) -->
    <select class="variant-selector" data-product-id="{id}">...</select>

    <!-- Add button OR inline qty controls -->
    <div class="product-card__atc-wrapper">
      <button class="product-add-btn" data-product-id="{variantId}">Add To Box</button>
      <!-- OR when selected: -->
      <div class="inline-quantity-controls">
        <button class="inline-qty-btn qty-decrease">−</button>
        <span class="inline-qty-display">{qty}</span>
        <button class="inline-qty-btn qty-increase">+</button>
      </div>
    </div>

  </div>
</div>
```

#### 4c. Card CSS (new)

```css
/* Card outer */
.product-card {
  display: flex;
  flex-direction: column;
  background: var(--bundle-product-card-bg, #F5F5F5);
  border: 1px solid var(--bundle-product-card-border-color, rgba(0,0,0,0.10));
  border-radius: var(--bundle-product-card-border-radius, 16px);
  overflow: hidden;
  transition: transform var(--bundle-card-transition-duration, 200ms),
              box-shadow var(--bundle-card-transition-duration, 200ms);
  cursor: pointer;
  height: 100%;
  /* Remove fixed width/height — let grid control it */
}

.product-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0,0,0,0.10);
}

/* Image button — square, white bg */
.product-card__image-btn {
  display: block;
  width: 100%;
  aspect-ratio: 1;                         /* square */
  background: #FFFFFF;
  border-radius: calc(var(--bundle-product-card-border-radius, 16px) - 2px)
                calc(var(--bundle-product-card-border-radius, 16px) - 2px)
                4px 4px;                    /* matches card radius at top, flat at image bottom */
  overflow: hidden;
  border: none;
  padding: 0;
  cursor: pointer;
  flex-shrink: 0;
}

.product-card__image {
  width: 100%;
  height: 100%;
  object-fit: var(--bundle-product-card-image-fit, cover);
  display: block;
}

/* Content section */
.product-card__content {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px 10px 10px;
  flex: 1;
}

/* Title */
.product-card__title {
  font-size: 13px;
  font-weight: 500;
  color: var(--bundle-product-card-font-color, #111);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.35;
  margin: 0;
}

/* Rating row */
.product-card__rating-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 6px;
}

.product-card__rating-badge {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 3px;
  background: var(--bundle-rating-badge-bg, #F0F0F0);
  border: 1px solid var(--bundle-rating-badge-border, rgba(0,0,0,0.15));
  border-radius: 20px;
  padding: 3px 8px;
  height: 26px;
}

.product-card__rating-score {
  font-size: 12px;
  color: #666;
  font-weight: 400;
}

.product-card__star-icon {
  width: 13px;
  height: 13px;
  color: #F5A623;   /* orange star */
}

.product-card__review-count {
  font-size: 12px;
  color: #888;
}

/* Price row */
.product-card__price-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
}

/* Spacer */
.product-card__spacer {
  flex: 1;
  min-height: 4px;
}

/* ATC wrapper */
.product-card__atc-wrapper {
  padding: 0;
}

/* ATC Button — full-width pill */
.product-add-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 38px;
  background: var(--bundle-button-bg, #111);
  color: var(--bundle-button-text-color, #FFF);
  border: 1px solid rgba(0,0,0,0.15);
  border-radius: 50px;                      /* full pill */
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: opacity 150ms, transform 100ms;
  padding: 0 12px;
}

.product-add-btn:hover {
  opacity: 0.85;
  transform: translateY(-1px);
}

.product-add-btn:active {
  transform: translateY(0);
}

/* Inline quantity controls */
.inline-quantity-controls {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  height: 38px;
  background: var(--bundle-button-bg, #111);
  border-radius: 50px;
  overflow: hidden;
  border: 1px solid rgba(0,0,0,0.15);
}

.inline-qty-btn {
  width: 38px;
  height: 38px;
  background: transparent;
  border: none;
  color: var(--bundle-button-text-color, #FFF);
  font-size: 18px;
  font-weight: 400;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.inline-qty-display {
  flex: 1;
  text-align: center;
  font-size: 14px;
  font-weight: 600;
  color: var(--bundle-button-text-color, #FFF);
}

/* Selected state */
.product-card.selected {
  border-color: var(--bundle-global-primary-button, #111);
  border-width: 2px;
}

.selected-overlay {
  display: none;   /* hidden by default — Beco doesn't show it */
}
.product-card.selected .selected-overlay {
  /* Keep hidden or show a subtle indicator */
}
```

#### 4d. DCP variables to update/add

Currently `--bundle-product-card-border-radius` defaults to `8px`. Update default to `16px` for new Beco look (remains merchant-overridable).

**No new DCP variables needed for card** — all existing variables (`--bundle-product-card-bg`, `--bundle-product-card-border-color`, `--bundle-product-card-border-radius`, `--bundle-button-bg`, etc.) map directly.

**New variables to add:**
- `--bundle-rating-badge-bg` ← `ratingBadgeBgColor` (default: `#F0F0F0`)
- `--bundle-rating-badge-border` ← `ratingBadgeBorderColor` (default: `rgba(0,0,0,0.15)`)
- `--bundle-star-color` ← `starIconColor` (default: `#F5A623`)

---

### 5. Sticky Bottom Cart — Full Redesign

**File:** `app/assets/bundle-widget-full-page.js` — `renderFullPageFooter()` method
**File:** `extensions/bundle-builder/assets/bundle-widget-full-page.css`

This is the second largest change. The current footer is full-width and fixed to the bottom edge. Beco's cart is a **floating card** offset from the bottom.

#### 5a. Current vs. Target Structure

**Current `.full-page-footer.redesigned`:**
```
[full-width fixed footer]
  .footer-progress-section         ← discount message text
  .footer-products-tiles-container ← horizontal tile strip
  .footer-nav-section              ← Back | Total | Next/Add to Cart
```

**Target `.bundle-bottom-cart`:**
```
[floating card — 800px centered, bottom: 48px, shadow, 16px radius]
  .cart-callout-bar                ← "Add N more to get bundle at ₹X" strip
  .cart-expanded-lines             ← vertical list (shows when expanded)
    .cart-line-item × N            ← image + title + price + trash btn
  .cart-footer-row                 ← stacked thumbs + "N/M Products" + Total + BUY BUNDLE btn
```

#### 5b. New HTML Structure

```html
<div class="bundle-bottom-cart" id="bundle-bottom-cart">

  <!-- 1. Callout bar (progress message) -->
  <div class="cart-callout-bar">
    <p class="cart-callout-text">{progressMessage}</p>
    <!-- e.g. "Add 2 more products to unlock your discount" -->
  </div>

  <!-- 2. Expanded line items (shown/hidden via .cart-expanded class on parent) -->
  <div class="cart-expanded-lines">
    <ul class="cart-lines-list">
      <!-- per selected item: -->
      <li class="cart-line-item" data-product-id="{variantId}">
        <img class="cart-line-img" src="{imageUrl}" alt="{title}">
        <div class="cart-line-info">
          <p class="cart-line-title">{title}</p>
          <div class="cart-line-price-row">
            <span class="cart-line-price">{price}</span>
            <span class="cart-line-qty">x{qty}</span>
          </div>
        </div>
        <button class="cart-line-remove" type="button" data-product-id="{variantId}"
          aria-label="Remove {title}">
          <!-- trash SVG icon -->
        </button>
      </li>
    </ul>
  </div>

  <!-- 3. Footer row (always visible) -->
  <div class="cart-footer-row">

    <!-- Left: stacked thumbnails + toggle -->
    <div class="cart-footer-left">
      <div class="cart-thumb-stack">
        <!-- filled slots: circular product image -->
        <div class="cart-thumb cart-thumb--filled">
          <img src="{imageUrl}" alt="{title}">
        </div>
        <!-- empty slots: "+" placeholder -->
        <div class="cart-thumb cart-thumb--empty">
          <svg><!-- plus icon --></svg>
        </div>
      </div>
      <button class="cart-products-toggle" type="button">
        <span class="cart-products-count">{selected}/{total} Products</span>
        <svg class="cart-toggle-chevron"><!-- chevron up/down --></svg>
      </button>
    </div>

    <!-- Middle: total -->
    <div class="cart-total-section">
      <span class="cart-total-label">Total:</span>
      <div class="cart-total-prices">
        <span class="cart-total-original">{originalTotal}</span>  <!-- strike if discount -->
        <span class="cart-total-final">{finalTotal}</span>
      </div>
    </div>

    <!-- Right: CTA button -->
    <button class="cart-cta-btn" type="button" id="footer-add-to-cart">
      {isLastStep ? 'BUY BUNDLE' : 'NEXT →'}
    </button>

  </div>

</div>

<!-- Transparent backdrop to close expanded drawer -->
<button class="cart-backdrop" type="button" aria-hidden="true"></button>
```

#### 5c. New Footer CSS

```css
/* ============================================================
   BUNDLE BOTTOM CART
   ============================================================ */

.bundle-bottom-cart {
  position: fixed;
  bottom: 48px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 100;
  width: min(800px, calc(100vw - 32px));
  background: #FFFFFF;
  border-radius: 16px;
  box-shadow: var(--bundle-cart-shadow, rgba(0,0,0,0.15) 0px 8px 24px 0px);
  overflow: hidden;
  transition: bottom 300ms ease;
}

/* ---- Callout bar ---- */
.cart-callout-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bundle-callout-bg, #F0F4FF);
  padding: 5px 16px;
  min-height: 28px;
}

.cart-callout-text {
  font-size: 12px;
  font-weight: 500;
  color: var(--bundle-callout-text, #333);
  text-align: center;
  margin: 0;
}

/* ---- Expanded lines ---- */
.cart-expanded-lines {
  max-height: 0;
  overflow: hidden;
  transition: max-height 300ms ease;
}

.bundle-bottom-cart.cart-expanded .cart-expanded-lines {
  max-height: 280px;
  overflow-y: auto;
}

.cart-lines-list {
  list-style: none;
  margin: 0;
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 0;
}

.cart-line-item {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 10px;
  padding: 8px 0;
  border-bottom: 1px solid rgba(0,0,0,0.06);
}

.cart-line-item:last-child {
  border-bottom: none;
}

.cart-line-img {
  width: 44px;
  height: 44px;
  border-radius: 8px;
  border: 1px solid rgba(0,0,0,0.10);
  object-fit: cover;
  flex-shrink: 0;
}

.cart-line-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  min-width: 0;
}

.cart-line-title {
  font-size: 12px;
  font-weight: 400;
  color: #111;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin: 0;
}

.cart-line-price-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 6px;
}

.cart-line-price {
  font-size: 13px;
  font-weight: 600;
  color: #111;
}

.cart-line-qty {
  font-size: 12px;
  color: #888;
}

.cart-line-remove {
  width: 28px;
  height: 28px;
  background: transparent;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
  border-radius: 50%;
  transition: background 150ms;
  flex-shrink: 0;
}

.cart-line-remove:hover {
  background: #FEE2E2;
  color: #EF4444;
}

/* ---- Footer row (always visible) ---- */
.cart-footer-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  background: var(--bundle-cart-footer-bg, #F8F8F8);
  padding: 10px 16px 14px;
  min-height: 62px;
}

/* Stacked thumbnails */
.cart-thumb-stack {
  display: flex;
  flex-direction: row;
  padding-left: 10px;
}

.cart-thumb {
  width: 36px;
  height: 36px;
  border-radius: 9999px;
  background: #E5E5E5;
  border: 2px solid #FFFFFF;
  margin-left: -10px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.cart-thumb--filled img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cart-thumb--empty {
  background: #EBEBEB;
  color: #AAA;
}

.cart-thumb--empty svg {
  width: 14px;
  height: 14px;
}

.cart-footer-left {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.cart-products-toggle {
  display: flex;
  align-items: center;
  gap: 4px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  margin-top: 4px;
}

.cart-products-count {
  font-size: 12px;
  font-weight: 600;
  color: #111;
}

.cart-toggle-chevron {
  width: 14px;
  height: 14px;
  color: #555;
  transition: transform 200ms;
}

.bundle-bottom-cart.cart-expanded .cart-toggle-chevron {
  transform: rotate(180deg);
}

/* Total */
.cart-total-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
}

.cart-total-label {
  font-size: 11px;
  font-weight: 500;
  color: #888;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.cart-total-prices {
  display: flex;
  flex-direction: row;
  align-items: baseline;
  gap: 6px;
}

.cart-total-original {
  text-decoration: line-through;
  color: #AAA;
  font-size: 13px;
}

.cart-total-final {
  font-size: 18px;
  font-weight: 700;
  color: var(--bundle-full-page-footer-total-final, #111);
}

/* CTA Button */
.cart-cta-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bundle-buy-btn-bg, #111);
  color: var(--bundle-buy-btn-text, #FFF);
  border: none;
  border-radius: var(--bundle-full-page-footer-nav-btn-radius, 8px);
  padding: 12px 28px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  height: 40px;
  white-space: nowrap;
  min-width: 140px;
  letter-spacing: 0.03em;
  transition: opacity 150ms, transform 100ms;
  flex-shrink: 0;
}

.cart-cta-btn:hover {
  opacity: 0.88;
  transform: translateY(-1px);
}

.cart-cta-btn:active {
  transform: translateY(0);
}

/* Cart backdrop */
.cart-backdrop {
  display: none;
  position: fixed;
  inset: 0;
  z-index: 99;
  background: transparent;
  border: none;
  cursor: default;
}

.bundle-bottom-cart.cart-expanded ~ .cart-backdrop {
  display: block;
}

/* ---- Mobile overrides ---- */
@media (max-width: 767px) {
  .bundle-bottom-cart {
    bottom: 0;
    border-radius: 16px 16px 0 0;
    width: 100vw;
    left: 0;
    transform: none;
  }
  .cart-footer-row {
    padding-bottom: max(14px, env(safe-area-inset-bottom));
  }
}
```

#### 5d. DCP variables to add

- `--bundle-callout-bg` ← `cartCalloutBgColor` (default: `#F0F4FF`)
- `--bundle-callout-text` ← `cartCalloutTextColor` (default: `#333333`)
- `--bundle-cart-footer-bg` ← `cartFooterBgColor` (default: `#F8F8F8`)
- `--bundle-buy-btn-bg` ← `cartBuyBtnBgColor` (default: `#111111`)
- `--bundle-buy-btn-text` ← `cartBuyBtnTextColor` (default: `#FFFFFF`)
- `--bundle-cart-shadow` ← computed (not editable; design constant)

---

## DCP (Design Settings) Changes Summary

### New DB fields to add to `DesignSettings` Prisma model

```prisma
// Full-page specific — new
tierActiveBgColor         String?   // default: use globalPrimaryButtonColor
tierActiveTextColor       String?   // default: use globalButtonTextColor
tierInactiveBgColor       String?   // default: #F5F5F5
tierInactiveTextColor     String?   // default: #111111
tierBtnBorderRadius       String?   // default: 8px
ratingBadgeBgColor        String?   // default: #F0F0F0
ratingBadgeBorderColor    String?   // default: rgba(0,0,0,0.15)
starIconColor             String?   // default: #F5A623
bannerVideoUrl            String?   // no default (optional video)
bannerAspectRatio         String?   // default: 4.8
bannerShowTextOverlay     Boolean?  // default: true
cartCalloutBgColor        String?   // default: #F0F4FF
cartCalloutTextColor      String?   // default: #333333
cartFooterBgColor         String?   // default: #F8F8F8
cartBuyBtnBgColor         String?   // default: #111111
cartBuyBtnTextColor       String?   // default: #FFFFFF
```

### Updated `css-variables-generator.ts` additions

All 16 new fields above need entries in the generator. Existing defaults that change:
- `productCardBorderRadius` default: `8px` → `16px`
- `productCardsPerRow` default: `3` → `4`
- `productCardSpacing` default: `12px` → `16px`

---

## Files to Change

| File | Type of Change |
|---|---|
| `app/assets/bundle-widget-full-page.js` | JS — rewrite `createStepTimeline()`, `renderFullPageFooter()`, `createPromoBanner()`, add expand/collapse cart toggle logic |
| `app/assets/widgets/shared/component-generator.js` | JS — rewrite `renderProductCard()` with new HTML structure + rating row |
| `extensions/bundle-builder/assets/bundle-widget-full-page.css` | CSS — replace card styles, add tier selector, add floating cart, add hero banner |
| `extensions/bundle-builder/blocks/bundle-full-page.liquid` | Liquid — add `banner_video_url`, `banner_aspect_ratio` settings |
| `app/lib/css-generators/css-variables-generator.ts` | TS — add 16 new variables, update 3 defaults |
| `app/routes/api/api.design-settings.$shopDomain.tsx` | TS — add new field reads and defaults |
| `prisma/schema.prisma` | Prisma — add 16 new `DesignSettings` fields |
| `scripts/build-widget-bundles.js` | JS — bump `WIDGET_VERSION` |

---

## Layout Interaction: Step Navigation vs. Tier Selection

**Important architectural note:**

Beco uses "tier buttons" as a way to switch between completely different product count bundles (Buy 2 / Buy 3 / Buy 4). Our system uses "step tabs" as navigation between different selection steps within one bundle (e.g., Step 1: Pick Proteins, Step 2: Pick Sides).

**These are the same UX component used for different purposes — and our implementation can handle both:**

1. **Multi-step bundle** (current standard use case): The tier selector row shows `Step 1`, `Step 2`, `Step 3`, etc. Each button navigates to that step's product grid.
2. **Single-step bundle with pricing tiers** (Beco-style): A single step with all products shown. The "tier buttons" could show the pricing rules: "Pick 2 for ₹499", "Pick 3 for ₹699". Clicking changes the `requiredCount` target for the current step and updates the callout message.

For Phase 1 of this implementation, we implement option 1 (use tier buttons as step navigation). Option 2 (dynamic tier switching) can be a follow-up feature.

---

## Implementation Order (Recommended)

1. **CSS first** — write all new CSS in `bundle-widget-full-page.css`. This is pure styling, no logic changes.
2. **Product card** — update `component-generator.js` `renderProductCard()` with new HTML structure. Easiest component, fully self-contained.
3. **Tier selector** — rewrite `createStepTimeline()` in `bundle-widget-full-page.js` to emit new HTML.
4. **Hero banner** — update `createPromoBanner()` to support video + new aspect-ratio structure.
5. **Floating bottom cart** — rewrite `renderFullPageFooter()` with new structure, add expand/collapse toggle logic.
6. **DCP** — add new variables to schema, generator, and defaults.
7. **Build + test** — `npm run build:widgets`, verify in storefront.
