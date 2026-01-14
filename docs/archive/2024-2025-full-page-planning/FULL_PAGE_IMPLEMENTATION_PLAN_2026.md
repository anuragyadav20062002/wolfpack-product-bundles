# Full-Page Bundle Widget - Comprehensive Implementation Plan

**Date:** January 13, 2026
**Status:** 📋 Ready for Implementation
**Priority:** 🔴 High
**Reference:** Based on Dolphin & Dog storefront analysis

---

## 🎯 Overview

This document outlines the complete implementation plan to transform the full-page bundle widget to match the professional, cohesive design shown in the reference screenshots while maintaining merchant customizability through the Design Control Panel (DCP).

---

## 📋 Table of Contents

1. [Phase 1: Fixed Card Dimensions](#phase-1-fixed-card-dimensions)
2. [Phase 2: Configurable Spacing Controls](#phase-2-configurable-spacing-controls)
3. [Phase 3: Font Inheritance](#phase-3-font-inheritance)
4. [Phase 4: Product Variant Modal](#phase-4-product-variant-modal)
5. [Phase 5: Product Card Styling](#phase-5-product-card-styling)
6. [Phase 6: DCP Integration](#phase-6-dcp-integration)
7. [Testing Strategy](#testing-strategy)
8. [Rollout Plan](#rollout-plan)

---

## Phase 1: Fixed Card Dimensions

### 🎯 Objective
Ensure product cards maintain consistent width and height regardless of the "cards per row" setting. Only the **number** of cards should change, not their **size**.

### 📝 Current Problem
```css
/* Current implementation - cards resize */
.full-page-product-grid {
  display: grid;
  grid-template-columns: repeat(var(--bundle-product-cards-per-row, 3), 1fr);
  gap: 20px;
}
```
**Result:** Changing from 3 to 4 cards per row makes each card narrower ❌

### ✅ Solution

#### 1.1 Update CSS Grid Approach

**File:** `extensions/bundle-builder/assets/bundle-widget-full-page.css`

```css
/* REPLACE existing .full-page-product-grid */
.full-page-product-grid {
  display: grid;
  /* Fixed card width approach */
  grid-template-columns: repeat(
    var(--bundle-product-cards-per-row, 3),
    var(--bundle-product-card-width, 280px)
  );
  gap: var(--bundle-product-card-spacing, 20px);
  margin: 20px 0;
  width: 100%;
  justify-content: center; /* Center the grid if cards don't fill width */
  overflow-x: auto; /* Allow horizontal scroll if needed */
}

/* Product Card with fixed dimensions */
.product-card {
  width: var(--bundle-product-card-width, 280px);
  height: var(--bundle-product-card-height, 420px);
  max-width: var(--bundle-product-card-width, 280px);
  min-width: var(--bundle-product-card-width, 280px);
  /* Remove flexible height */
  min-height: var(--bundle-product-card-height, 420px);
  max-height: var(--bundle-product-card-height, 420px);
  background: var(--bundle-product-card-bg, #ECF4EC);
  border-radius: var(--bundle-product-card-border-radius, 0);
  padding: 8px 9px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  box-sizing: border-box;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: none;
  position: relative;
  overflow: hidden; /* Prevent content overflow */
}
```

#### 1.2 Add DCP Settings

**File:** `prisma/schema.prisma`

Add to `DesignSettings` model:
```prisma
model DesignSettings {
  // ... existing fields

  // Product Card Dimensions
  productCardWidth         Int?    @default(280)   // 200-400px
  productCardHeight        Int?    @default(420)   // 300-600px
  productCardSpacing       Int?    @default(20)    // 10-60px
  productCardBorderRadius  Int?    @default(0)     // 0-24px

  // ... rest of fields
}
```

#### 1.3 Update DCP UI

**File:** `app/routes/app.design-control-panel.tsx`

```typescript
// Add state variables
const [productCardWidth, setProductCardWidth] = useState(280);
const [productCardHeight, setProductCardHeight] = useState(420);
const [productCardSpacing, setProductCardSpacing] = useState(20);

// Add to Product Card section
<FormLayout>
  <RangeSlider
    label="Card Width (px)"
    value={productCardWidth}
    onChange={setProductCardWidth}
    min={200}
    max={400}
    step={10}
    output
  />
  <RangeSlider
    label="Card Height (px)"
    value={productCardHeight}
    onChange={setProductCardHeight}
    min={300}
    max={600}
    step={10}
    output
  />
  <RangeSlider
    label="Card Spacing (px)"
    value={productCardSpacing}
    onChange={setProductCardSpacing}
    min={10}
    max={60}
    step={5}
    output
  />
</FormLayout>
```

#### 1.4 Update CSS API

**File:** `app/routes/api.design-settings.$shopDomain.css.tsx`

```typescript
function generateCSSFromSettings(settings: DesignSettings): string {
  return `
    /* Product Card Dimensions */
    --bundle-product-card-width: ${settings.productCardWidth || 280}px;
    --bundle-product-card-height: ${settings.productCardHeight || 420}px;
    --bundle-product-card-spacing: ${settings.productCardSpacing || 20}px;
    --bundle-product-card-border-radius: ${settings.productCardBorderRadius || 0}px;

    /* ... existing CSS variables */
  `;
}
```

#### 1.5 Responsive Behavior

```css
/* Mobile: Stack cards or reduce to 2 per row */
@media (max-width: 768px) {
  .full-page-product-grid {
    grid-template-columns: repeat(
      2,
      var(--bundle-product-card-width-mobile, 160px)
    );
    gap: var(--bundle-product-card-spacing-mobile, 15px);
  }

  .product-card {
    width: var(--bundle-product-card-width-mobile, 160px);
    height: var(--bundle-product-card-height-mobile, 320px);
  }
}

/* Tablet: 3 per row */
@media (min-width: 769px) and (max-width: 1024px) {
  .full-page-product-grid {
    grid-template-columns: repeat(
      3,
      var(--bundle-product-card-width, 280px)
    );
  }
}
```

### ✅ Testing Checklist

- [ ] Change cards per row from 3→4: Cards maintain size ✅
- [ ] Change cards per row from 4→2: Cards maintain size ✅
- [ ] Adjust card width in DCP: All cards update uniformly ✅
- [ ] Adjust card height in DCP: All cards update uniformly ✅
- [ ] Test on mobile: Cards resize appropriately ✅
- [ ] Test with overflow: Horizontal scroll appears if needed ✅

---

## Phase 2: Configurable Spacing Controls

### 🎯 Objective
Allow merchants to control card spacing directly from the Theme Editor, separate from DCP.

### 📝 Implementation

#### 2.1 Add Theme Editor Settings

**File:** `extensions/bundle-builder/blocks/bundle-full-page.liquid`

Update schema:
```liquid
{% schema %}
{
  "settings": [
    // ... existing settings

    {
      "type": "header",
      "content": "Card Layout Settings"
    },
    {
      "type": "range",
      "id": "product_card_spacing",
      "label": "Product card spacing",
      "info": "Space between product cards",
      "min": 10,
      "max": 60,
      "step": 5,
      "default": 20,
      "unit": "px"
    },
    {
      "type": "range",
      "id": "product_cards_per_row",
      "label": "Cards per row",
      "info": "Number of product cards to display in each row (desktop only)",
      "min": 2,
      "max": 6,
      "step": 1,
      "default": 4
    }
  ]
}
{% endschema %}
```

#### 2.2 Pass to Widget

```liquid
<div
  id="bundle-builder-app"
  data-bundle-id="{{ bundle_id }}"
  data-product-card-spacing="{{ block.settings.product_card_spacing }}"
  data-product-cards-per-row="{{ block.settings.product_cards_per_row }}"
  class="bundle-widget-container bundle-widget-full-page"
>
```

#### 2.3 Read in JavaScript

**File:** `app/assets/bundle-widget-full-page.js`

```javascript
// In widget initialization
this.config = {
  // ... existing config
  productCardSpacing: parseInt(container.dataset.productCardSpacing) || 20,
  productCardsPerRow: parseInt(container.dataset.productCardsPerRow) || 4,
};

// Apply to CSS
document.documentElement.style.setProperty(
  '--bundle-product-card-spacing',
  `${this.config.productCardSpacing}px`
);
document.documentElement.style.setProperty(
  '--bundle-product-cards-per-row',
  this.config.productCardsPerRow
);
```

### ✅ Testing Checklist

- [ ] Adjust spacing in Theme Editor: Cards update immediately ✅
- [ ] Set spacing to minimum (10px): Cards appear tight ✅
- [ ] Set spacing to maximum (60px): Cards have generous space ✅
- [ ] Change cards per row: Spacing remains consistent ✅

---

## Phase 3: Font Inheritance

### 🎯 Objective
Remove all hardcoded font families and inherit typography from the store's theme.

### 📝 Implementation

#### 3.1 Remove Hardcoded Fonts

**File:** `extensions/bundle-builder/assets/bundle-widget-full-page.css`

**FIND AND REPLACE:**

```css
/* REMOVE all instances of: */
font-family: 'Quattrocento Sans', sans-serif;

/* REPLACE WITH: */
font-family: inherit;

/* OR remove font-family declaration entirely to cascade from parent */
```

**Specific changes:**

```css
/* BEFORE */
.bundle-title {
  font-family: 'Quattrocento Sans', sans-serif;
  font-weight: bold;
  font-size: var(--bundle-full-page-title-font-size, 20px);
}

/* AFTER */
.bundle-title {
  font-family: var(--bundle-font-family, inherit); /* Allow DCP override */
  font-weight: bold;
  font-size: var(--bundle-full-page-title-font-size, 20px);
}

/* Apply to all text elements: */
.bundle-title,
.bundle-instruction,
.product-title,
.product-price,
.product-price-strike,
.qty-display,
.product-add-btn,
.footer-product-title,
.total-label,
.total-price,
.timeline-step-name,
.category-tab .tab-label,
.variant-selector {
  font-family: inherit;
}
```

#### 3.2 Ensure Proper Cascade

**File:** `extensions/bundle-builder/blocks/bundle-full-page.liquid`

Ensure widget container doesn't set font:
```liquid
<div
  {{ block.shopify_attributes }}
  id="bundle-builder-app"
  class="bundle-widget-container bundle-widget-full-page"
  style="font-family: inherit;" <!-- Explicitly inherit -->
>
```

#### 3.3 Optional DCP Font Override

**File:** `app/routes/app.design-control-panel.tsx`

Add optional font family override:
```typescript
<TextField
  label="Custom Font Family (Optional)"
  value={customFontFamily}
  onChange={setCustomFontFamily}
  placeholder="Leave empty to inherit from theme"
  helpText="Example: 'Arial', 'Helvetica', sans-serif"
/>
```

### ✅ Testing Checklist

- [ ] Widget loads without font declarations: Uses theme font ✅
- [ ] Test with different themes: Font changes per theme ✅
- [ ] Verify all text elements: No hardcoded fonts remain ✅
- [ ] DCP font override: Works when specified ✅
- [ ] Fallback: System fonts load if theme font fails ✅

---

## Phase 4: Product Variant Modal

### 🎯 Objective
Create a professional product detail modal that opens when users click "Choose Options", matching the design from Screenshot 2.

### 📝 Current Status
❌ **Not Implemented** - This is a completely new feature

### 🏗️ Architecture

#### 4.1 Modal Component Structure

```
Product Variant Modal
├── Modal Overlay (dark semi-transparent)
├── Modal Container (white, rounded corners)
│   ├── Close Button (X icon, top-right)
│   ├── Modal Content (2-column layout)
│   │   ├── Left Section (60%)
│   │   │   ├── Main Image
│   │   │   └── Thumbnail Strip
│   │   └── Right Section (40%)
│   │       ├── Product Title
│   │       ├── Price Display
│   │       ├── Variant Selector (Dropdown)
│   │       ├── Quantity Selector (+/-)
│   │       └── "Add To Box" Button
```

#### 4.2 Create Modal HTML/CSS

**File:** `extensions/bundle-builder/assets/bundle-widget-full-page.css`

Add modal styles:
```css
/* ============================================================================
   PRODUCT VARIANT MODAL
   ============================================================================ */

/* Modal Overlay */
.bundle-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.3s ease, visibility 0.3s ease;
  padding: 20px;
  overflow-y: auto;
}

.bundle-modal-overlay.active {
  opacity: 1;
  visibility: visible;
}

/* Modal Container */
.bundle-modal-container {
  background: var(--bundle-modal-bg, #FFFFFF);
  border-radius: var(--bundle-modal-border-radius, 12px);
  max-width: 1000px;
  width: 100%;
  max-height: 90vh;
  overflow: hidden;
  position: relative;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  transform: scale(0.9);
  transition: transform 0.3s ease;
}

.bundle-modal-overlay.active .bundle-modal-container {
  transform: scale(1);
}

/* Close Button */
.bundle-modal-close {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--bundle-modal-close-bg, rgba(0, 0, 0, 0.1));
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  transition: background 0.2s;
}

.bundle-modal-close:hover {
  background: var(--bundle-modal-close-hover-bg, rgba(0, 0, 0, 0.2));
}

.bundle-modal-close svg {
  width: 20px;
  height: 20px;
  stroke: var(--bundle-modal-close-color, #000000);
  stroke-width: 2;
}

/* Modal Content - 2 Column Layout */
.bundle-modal-content {
  display: grid;
  grid-template-columns: 60% 40%;
  gap: 40px;
  padding: 40px;
  overflow-y: auto;
  max-height: 90vh;
}

/* Left Section - Image Gallery */
.bundle-modal-left {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.bundle-modal-main-image {
  width: 100%;
  aspect-ratio: 1;
  background: var(--bundle-modal-image-bg, #F5F5F5);
  border-radius: var(--bundle-modal-image-radius, 8px);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--bundle-modal-image-border, rgba(0, 0, 0, 0.06));
}

.bundle-modal-main-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* Thumbnail Strip */
.bundle-modal-thumbnails {
  display: flex;
  gap: 12px;
  overflow-x: auto;
  padding-bottom: 8px;
}

.bundle-modal-thumbnails::-webkit-scrollbar {
  height: 6px;
}

.bundle-modal-thumbnails::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 3px;
}

.bundle-modal-thumbnail {
  width: 80px;
  height: 80px;
  flex-shrink: 0;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  border: 2px solid transparent;
  transition: border-color 0.2s;
}

.bundle-modal-thumbnail.active {
  border-color: var(--bundle-modal-thumbnail-active-border, #000000);
}

.bundle-modal-thumbnail:hover {
  border-color: var(--bundle-modal-thumbnail-hover-border, #666666);
}

.bundle-modal-thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* Right Section - Product Details */
.bundle-modal-right {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* Product Title & Price */
.bundle-modal-header {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.bundle-modal-title {
  font-size: var(--bundle-modal-title-font-size, 28px);
  font-weight: var(--bundle-modal-title-font-weight, 700);
  color: var(--bundle-modal-title-color, #000000);
  line-height: 1.3;
  font-family: inherit;
}

.bundle-modal-price {
  font-size: var(--bundle-modal-price-font-size, 22px);
  font-weight: var(--bundle-modal-price-font-weight, 600);
  color: var(--bundle-modal-price-color, #000000);
  font-family: inherit;
}

/* Variant Selector */
.bundle-modal-variants {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.bundle-modal-variant-option {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.bundle-modal-variant-label {
  font-size: 14px;
  font-weight: 600;
  color: var(--bundle-modal-label-color, #333333);
  font-family: inherit;
}

.bundle-modal-variant-select {
  width: 100%;
  padding: 14px 16px;
  border-radius: var(--bundle-modal-variant-border-radius, 8px);
  border: 2px solid var(--bundle-modal-variant-border, #E5E7EB);
  background: var(--bundle-modal-variant-bg, #FFFFFF);
  color: var(--bundle-modal-variant-text, #000000);
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L6 6L11 1' stroke='%23303030' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 16px center;
  padding-right: 44px;
  transition: border-color 0.2s;
  font-family: inherit;
}

.bundle-modal-variant-select:focus {
  outline: none;
  border-color: var(--bundle-modal-variant-focus-border, #000000);
}

/* Quantity Selector in Modal */
.bundle-modal-quantity {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.bundle-modal-quantity-selector {
  display: flex;
  align-items: center;
  gap: 0;
  background: linear-gradient(135deg, var(--bundle-quantity-selector-bg, #000000) 0%, rgba(0, 0, 0, 0.9) 100%);
  color: var(--bundle-quantity-selector-text-color, #FFFFFF);
  border-radius: var(--bundle-quantity-selector-border-radius, 10px);
  overflow: hidden;
  border: 2px solid rgba(0, 0, 0, 0.1);
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.15);
  width: fit-content;
}

/* Add To Box Button */
.bundle-modal-add-btn {
  width: 100%;
  padding: 18px 32px;
  background: linear-gradient(135deg, var(--bundle-button-bg, #000000) 0%, rgba(0, 0, 0, 0.9) 100%);
  color: var(--bundle-button-text-color, #FFFFFF);
  border: none;
  border-radius: var(--bundle-button-border-radius, 10px);
  font-size: var(--bundle-button-font-size, 18px);
  font-weight: var(--bundle-button-font-weight, 700);
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  letter-spacing: 0.5px;
  text-transform: uppercase;
  font-family: inherit;
  margin-top: auto; /* Push to bottom */
}

.bundle-modal-add-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
}

.bundle-modal-add-btn:active {
  transform: translateY(0);
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .bundle-modal-content {
    grid-template-columns: 1fr;
    gap: 24px;
    padding: 20px;
  }

  .bundle-modal-close {
    top: 10px;
    right: 10px;
  }

  .bundle-modal-title {
    font-size: 22px;
  }

  .bundle-modal-price {
    font-size: 18px;
  }
}

/* Prevent body scroll when modal is open */
body.bundle-modal-open {
  overflow: hidden;
}
```

#### 4.3 Create Modal JavaScript

**File:** `app/assets/bundle-modal-component.js` (NEW FILE)

```javascript
/**
 * Bundle Product Variant Modal Component
 * Displays full product details with variant selection
 */

class BundleProductModal {
  constructor(widget) {
    this.widget = widget;
    this.overlay = null;
    this.currentProduct = null;
    this.selectedVariant = null;
    this.quantity = 1;
    this.init();
  }

  init() {
    this.createModalHTML();
    this.attachEventListeners();
  }

  createModalHTML() {
    const modalHTML = `
      <div class="bundle-modal-overlay" id="bundleProductModal">
        <div class="bundle-modal-container">
          <button class="bundle-modal-close" aria-label="Close modal">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18M6 6L18 18" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>

          <div class="bundle-modal-content">
            <!-- Left: Image Gallery -->
            <div class="bundle-modal-left">
              <div class="bundle-modal-main-image">
                <img src="" alt="" id="modalMainImage">
              </div>
              <div class="bundle-modal-thumbnails" id="modalThumbnails">
                <!-- Thumbnails will be injected here -->
              </div>
            </div>

            <!-- Right: Product Details -->
            <div class="bundle-modal-right">
              <div class="bundle-modal-header">
                <h2 class="bundle-modal-title" id="modalProductTitle"></h2>
                <p class="bundle-modal-price" id="modalProductPrice"></p>
              </div>

              <div class="bundle-modal-variants" id="modalVariants">
                <!-- Variant selectors will be injected here -->
              </div>

              <div class="bundle-modal-quantity">
                <label class="bundle-modal-variant-label">Quantity</label>
                <div class="bundle-modal-quantity-selector">
                  <button class="qty-btn" id="modalQtyDecrease">−</button>
                  <span class="qty-display" id="modalQtyDisplay">1</span>
                  <button class="qty-btn" id="modalQtyIncrease">+</button>
                </div>
              </div>

              <button class="bundle-modal-add-btn" id="modalAddToBox">
                Add To Box
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    this.overlay = document.getElementById('bundleProductModal');
  }

  attachEventListeners() {
    // Close modal
    const closeBtn = this.overlay.querySelector('.bundle-modal-close');
    closeBtn.addEventListener('click', () => this.close());

    // Close on overlay click
    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) {
        this.close();
      }
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.overlay.classList.contains('active')) {
        this.close();
      }
    });

    // Quantity controls
    document.getElementById('modalQtyDecrease').addEventListener('click', () => {
      if (this.quantity > 1) {
        this.quantity--;
        this.updateQuantityDisplay();
      }
    });

    document.getElementById('modalQtyIncrease').addEventListener('click', () => {
      this.quantity++;
      this.updateQuantityDisplay();
    });

    // Add to box
    document.getElementById('modalAddToBox').addEventListener('click', () => {
      this.addToBundle();
    });
  }

  open(product, step) {
    this.currentProduct = product;
    this.currentStep = step;
    this.quantity = 1;

    // Populate modal with product data
    this.populateModal();

    // Show modal
    this.overlay.classList.add('active');
    document.body.classList.add('bundle-modal-open');
  }

  close() {
    this.overlay.classList.remove('active');
    document.body.classList.remove('bundle-modal-open');
    this.currentProduct = null;
    this.selectedVariant = null;
    this.quantity = 1;
  }

  populateModal() {
    const product = this.currentProduct;

    // Set title
    document.getElementById('modalProductTitle').textContent = product.title;

    // Set default price (first variant or product price)
    const firstVariant = product.variants[0];
    this.selectedVariant = firstVariant;
    this.updatePrice();

    // Load images
    this.loadImages(product.images || [product.image]);

    // Create variant selectors
    this.createVariantSelectors();

    // Reset quantity
    this.quantity = 1;
    this.updateQuantityDisplay();
  }

  loadImages(images) {
    const mainImage = document.getElementById('modalMainImage');
    const thumbnailsContainer = document.getElementById('modalThumbnails');

    if (!images || images.length === 0) {
      mainImage.src = 'https://via.placeholder.com/500';
      return;
    }

    // Set main image
    mainImage.src = images[0];
    mainImage.alt = this.currentProduct.title;

    // Clear thumbnails
    thumbnailsContainer.innerHTML = '';

    // Create thumbnails
    images.forEach((image, index) => {
      const thumb = document.createElement('div');
      thumb.className = `bundle-modal-thumbnail ${index === 0 ? 'active' : ''}`;
      thumb.innerHTML = `<img src="${image}" alt="Thumbnail ${index + 1}">`;

      thumb.addEventListener('click', () => {
        mainImage.src = image;
        // Update active thumbnail
        thumbnailsContainer.querySelectorAll('.bundle-modal-thumbnail').forEach(t => {
          t.classList.remove('active');
        });
        thumb.classList.add('active');
      });

      thumbnailsContainer.appendChild(thumb);
    });
  }

  createVariantSelectors() {
    const variantsContainer = document.getElementById('modalVariants');
    variantsContainer.innerHTML = '';

    const product = this.currentProduct;

    // If no variants or single variant, hide selector
    if (!product.variants || product.variants.length <= 1) {
      return;
    }

    // Create dropdown for each variant option
    // For Shopify products, variants have option1, option2, option3
    const options = this.extractVariantOptions(product.variants);

    options.forEach((option, index) => {
      const optionDiv = document.createElement('div');
      optionDiv.className = 'bundle-modal-variant-option';

      const label = document.createElement('label');
      label.className = 'bundle-modal-variant-label';
      label.textContent = option.name;

      const select = document.createElement('select');
      select.className = 'bundle-modal-variant-select';
      select.dataset.optionIndex = index;

      option.values.forEach(value => {
        const optionEl = document.createElement('option');
        optionEl.value = value;
        optionEl.textContent = value;
        select.appendChild(optionEl);
      });

      select.addEventListener('change', () => {
        this.updateSelectedVariant();
      });

      optionDiv.appendChild(label);
      optionDiv.appendChild(select);
      variantsContainer.appendChild(optionDiv);
    });
  }

  extractVariantOptions(variants) {
    // Extract unique options from variants
    const optionsMap = {};

    variants.forEach(variant => {
      ['option1', 'option2', 'option3'].forEach((optionKey, index) => {
        if (variant[optionKey]) {
          if (!optionsMap[index]) {
            optionsMap[index] = {
              name: variant[`option${index + 1}_name`] || `Option ${index + 1}`,
              values: new Set()
            };
          }
          optionsMap[index].values.add(variant[optionKey]);
        }
      });
    });

    return Object.values(optionsMap).map(opt => ({
      name: opt.name,
      values: Array.from(opt.values)
    }));
  }

  updateSelectedVariant() {
    // Get selected options from dropdowns
    const selects = this.overlay.querySelectorAll('.bundle-modal-variant-select');
    const selectedOptions = Array.from(selects).map(s => s.value);

    // Find matching variant
    const variant = this.currentProduct.variants.find(v => {
      return selectedOptions.every((option, index) => {
        return v[`option${index + 1}`] === option;
      });
    });

    if (variant) {
      this.selectedVariant = variant;
      this.updatePrice();
    }
  }

  updatePrice() {
    const priceEl = document.getElementById('modalProductPrice');
    const variant = this.selectedVariant;

    if (variant && variant.price) {
      priceEl.textContent = this.widget.formatMoney(variant.price);
    } else if (this.currentProduct.price) {
      priceEl.textContent = this.widget.formatMoney(this.currentProduct.price);
    }
  }

  updateQuantityDisplay() {
    document.getElementById('modalQtyDisplay').textContent = this.quantity;
  }

  addToBundle() {
    if (!this.currentProduct || !this.selectedVariant) {
      alert('Please select a product variant');
      return;
    }

    // Add product to bundle via widget
    this.widget.addProductToStep(
      this.currentStep.id,
      this.currentProduct,
      this.selectedVariant,
      this.quantity
    );

    // Show success feedback
    const btn = document.getElementById('modalAddToBox');
    const originalText = btn.textContent;
    btn.textContent = '✓ Added!';
    btn.style.background = 'linear-gradient(135deg, #10B981 0%, #059669 100%)';

    setTimeout(() => {
      btn.textContent = originalText;
      btn.style.background = '';
      this.close();
    }, 1000);
  }
}

// Export for use in main widget
window.BundleProductModal = BundleProductModal;
```

#### 4.4 Integrate Modal into Widget

**File:** `app/assets/bundle-widget-full-page.js`

```javascript
class BundleBuilderFullPage {
  constructor(container) {
    // ... existing initialization

    // Initialize modal
    this.productModal = new BundleProductModal(this);
  }

  createProductCard(product, step) {
    // ... existing product card creation

    // CHANGE BUTTON TEXT to "Choose Options"
    const button = card.querySelector('.product-add-btn');
    button.textContent = 'Choose Options';

    // REPLACE button click handler
    button.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();

      // Open modal instead of adding directly
      this.productModal.open(product, step);
    });

    return card;
  }

  // New method called from modal
  addProductToStep(stepId, product, variant, quantity) {
    // Existing logic to add product to bundle
    const step = this.bundleData.steps.find(s => s.id === stepId);

    // Add to selected products
    this.selectedProducts[stepId] = this.selectedProducts[stepId] || [];

    const existingIndex = this.selectedProducts[stepId].findIndex(
      p => p.productId === product.id && p.variantId === variant.id
    );

    if (existingIndex !== -1) {
      // Update quantity
      this.selectedProducts[stepId][existingIndex].quantity = quantity;
    } else {
      // Add new
      this.selectedProducts[stepId].push({
        productId: product.id,
        variantId: variant.id,
        quantity: quantity,
        product: product,
        variant: variant
      });
    }

    // Update UI
    this.updateFooter();
    this.updateProductCardUI(product.id, variant.id);
    this.checkStepCompletion(stepId);
  }
}
```

#### 4.5 Load Modal Script

**File:** `extensions/bundle-builder/blocks/bundle-full-page.liquid`

```liquid
<!-- Load modal component before main widget -->
<script>
  (function() {
    var modalScript = document.createElement('script');
    modalScript.src = '{{ 'bundle-modal-component.js' | asset_url }}';
    modalScript.async = false;
    document.head.appendChild(modalScript);

    modalScript.onload = function() {
      // Then load main widget
      var widgetScript = document.createElement('script');
      widgetScript.src = '{{ 'bundle-widget-full-page-bundled.js' | asset_url }}';
      widgetScript.async = false;
      document.head.appendChild(widgetScript);
    };
  })();
</script>
```

### ✅ Testing Checklist

- [ ] Click "Choose Options": Modal opens ✅
- [ ] Modal displays product images: Gallery works ✅
- [ ] Thumbnail clicks: Changes main image ✅
- [ ] Variant selector: Dropdown shows options ✅
- [ ] Quantity controls: +/- buttons work ✅
- [ ] Price updates: Changes based on variant ✅
- [ ] "Add To Box": Adds to bundle, modal closes ✅
- [ ] Close button: Modal closes ✅
- [ ] Escape key: Modal closes ✅
- [ ] Outside click: Modal closes ✅
- [ ] Mobile responsive: Stack layout works ✅
- [ ] Body scroll: Prevented when modal open ✅

---

## Phase 5: Product Card Styling

### 🎯 Objective
Improve product card visual styling to match professional, minimalist design from screenshots.

### 📝 Implementation

#### 5.1 Update Card Layout

**File:** `extensions/bundle-builder/assets/bundle-widget-full-page.css`

```css
/* Enhanced Product Card */
.product-card {
  /* Fixed dimensions from Phase 1 */
  width: var(--bundle-product-card-width, 280px);
  height: var(--bundle-product-card-height, 420px);

  /* Visual styling */
  background: var(--bundle-product-card-bg, #FFFFFF);
  border-radius: var(--bundle-product-card-border-radius, 8px);
  border: var(--bundle-product-card-border-width, 1px) solid var(--bundle-product-card-border-color, rgba(0, 0, 0, 0.08));
  padding: var(--bundle-product-card-padding, 12px);

  display: flex;
  flex-direction: column;
  gap: var(--bundle-product-card-inner-gap, 12px);

  box-sizing: border-box;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;

  /* Professional shadow */
  box-shadow: var(--bundle-product-card-shadow, 0 2px 8px rgba(0, 0, 0, 0.04));
}

.product-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--bundle-product-card-hover-shadow, 0 8px 24px rgba(0, 0, 0, 0.12));
  border-color: var(--bundle-product-card-hover-border, rgba(0, 0, 0, 0.12));
}

.product-card.selected {
  border: var(--bundle-product-card-selected-border-width, 2px) solid var(--bundle-product-card-selected-border-color, #4CAF50);
  box-shadow: var(--bundle-product-card-selected-shadow, 0 4px 16px rgba(76, 175, 80, 0.3));
}

/* Product Image - Larger, more prominent */
.product-image {
  width: 100%;
  height: var(--bundle-product-card-image-height, 280px);
  flex-shrink: 0;
  background: var(--bundle-product-image-bg, #F8F8F8);
  border-radius: var(--bundle-product-image-border-radius, 6px);
  overflow: hidden;
  position: relative;
  border: var(--bundle-product-image-border-width, 1px) solid var(--bundle-product-image-border-color, rgba(0, 0, 0, 0.04));
}

.product-image img {
  width: 100%;
  height: 100%;
  object-fit: var(--bundle-product-card-image-fit, cover);
  transition: transform 0.3s ease;
}

.product-card:hover .product-image img {
  transform: scale(1.05);
}

/* Product Title - Clean and readable */
.product-title {
  font-family: inherit;
  font-size: var(--bundle-product-card-title-font-size, 16px);
  font-weight: var(--bundle-product-card-title-font-weight, 600);
  color: var(--bundle-product-card-font-color, #1A1A1A);
  line-height: 1.4;
  text-align: center;
  margin: 0;

  /* Multi-line ellipsis */
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Price Row - Simplified */
.product-price-row {
  display: var(--bundle-product-price-display, flex);
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: var(--bundle-product-price-padding, 8px 12px);
  background: var(--bundle-product-price-bg-color, transparent);
  border-radius: var(--bundle-product-price-border-radius, 6px);
  flex-shrink: 0;
}

.product-price-strike {
  font-family: inherit;
  font-size: var(--bundle-product-strike-price-font-size, 14px);
  font-weight: var(--bundle-product-strike-price-font-weight, 400);
  color: var(--bundle-product-strike-price-color, #999999);
  text-decoration: line-through;
}

.product-price {
  font-family: inherit;
  font-size: var(--bundle-product-final-price-font-size, 18px);
  font-weight: var(--bundle-product-final-price-font-weight, 700);
  color: var(--bundle-product-final-price-color, #000000);
}

/* Spacer pushes button to bottom */
.product-spacer {
  flex: 1;
}

/* "Choose Options" Button - Prominent and inviting */
.product-add-btn {
  width: 100%;
  padding: var(--bundle-button-padding, 14px 20px);
  background: var(--bundle-button-bg, #000000);
  color: var(--bundle-button-text-color, #FFFFFF);
  border: none;
  border-radius: var(--bundle-button-border-radius, 8px);
  font-family: inherit;
  font-size: var(--bundle-button-font-size, 15px);
  font-weight: var(--bundle-button-font-weight, 600);
  cursor: pointer;
  transition: all 0.2s ease;
  letter-spacing: 0.3px;
  flex-shrink: 0;

  /* Subtle shadow */
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.product-add-btn:hover {
  background: var(--bundle-button-hover-bg, #333333);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
}

.product-add-btn:active {
  transform: translateY(0);
}

/* Remove quantity selector from card - it's now in modal */
.product-quantity-wrapper {
  display: none; /* Hide on card, show only in modal */
}

/* Variant selector on card - for quick selection */
.variant-selector {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid var(--bundle-variant-selector-border, #E0E0E0);
  border-radius: var(--bundle-variant-selector-border-radius, 6px);
  background: var(--bundle-variant-selector-bg, #FFFFFF);
  font-family: inherit;
  font-size: 14px;
  color: var(--bundle-variant-selector-text-color, #333333);
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%23333333' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 14px center;
  padding-right: 40px;
  transition: border-color 0.2s;
}

.variant-selector:hover {
  border-color: var(--bundle-variant-selector-hover-border, #999999);
}

.variant-selector:focus {
  outline: none;
  border-color: var(--bundle-variant-selector-focus-border, #000000);
}

/* Remove this if not using on-card variant selection */
.variant-selector {
  display: none; /* Variants selected in modal */
}
```

### ✅ Testing Checklist

- [ ] Cards have professional appearance ✅
- [ ] Images are large and prominent ✅
- [ ] Titles are readable and well-spaced ✅
- [ ] Prices are clear and styled ✅
- [ ] Buttons are inviting and accessible ✅
- [ ] Hover effects work smoothly ✅
- [ ] Selected state is clear ✅
- [ ] No quantity selector on card ✅

---

## Phase 6: DCP Integration

### 🎯 Objective
Add all new settings to the Design Control Panel for merchant customization.

### 📝 Implementation

#### 6.1 Update Database Schema

**File:** `prisma/schema.prisma`

```prisma
model DesignSettings {
  // ... existing fields

  // ===== PRODUCT CARD DIMENSIONS (Phase 1) =====
  productCardWidth            Int?    @default(280)   // 200-400px
  productCardHeight           Int?    @default(420)   // 300-600px
  productCardSpacing          Int?    @default(20)    // 10-60px
  productCardBorderRadius     Int?    @default(8)     // 0-24px
  productCardPadding          Int?    @default(12)    // 4-24px
  productCardInnerGap         Int?    @default(12)    // 4-24px

  // Product Card Border & Shadow
  productCardBorderWidth      Int?    @default(1)     // 0-4px
  productCardBorderColor      String? @default("#E0E0E0")
  productCardShadow           String? @default("0 2px 8px rgba(0,0,0,0.04)")
  productCardHoverShadow      String? @default("0 8px 24px rgba(0,0,0,0.12)")

  // Product Card Selected State
  productCardSelectedBorderWidth  Int?    @default(2)
  productCardSelectedBorderColor  String? @default("#4CAF50")
  productCardSelectedShadow       String? @default("0 4px 16px rgba(76,175,80,0.3)")

  // ===== PRODUCT IMAGE =====
  productCardImageHeight      Int?    @default(280)   // 200-400px
  productImageBorderRadius    Int?    @default(6)     // 0-24px
  productImageBgColor         String? @default("#F8F8F8")
  productImageBorderWidth     Int?    @default(1)     // 0-4px
  productImageBorderColor     String? @default("rgba(0,0,0,0.04)")

  // ===== PRODUCT TITLE =====
  productCardTitleFontSize    Int?    @default(16)    // 12-24px
  productCardTitleFontWeight  Int?    @default(600)   // 400-900
  productCardTitleLineHeight  Float?  @default(1.4)   // 1.0-2.0
  productCardTitleLetterSpacing String? @default("normal")

  // ===== PRICE STYLING =====
  productPricePadding         String? @default("8px 12px")
  productPriceBorderRadius    Int?    @default(6)     // 0-24px

  // ===== BUTTON STYLING =====
  buttonPadding               String? @default("14px 20px")
  buttonLetterSpacing         Float?  @default(0.3)   // 0-2px

  // ===== MODAL STYLING (Phase 4) =====
  modalBgColor                String? @default("#FFFFFF")
  modalBorderRadius           Int?    @default(12)    // 0-24px
  modalTitleFontSize          Int?    @default(28)    // 20-40px
  modalTitleFontWeight        Int?    @default(700)   // 400-900
  modalTitleColor             String? @default("#000000")
  modalPriceFontSize          Int?    @default(22)    // 16-32px
  modalPriceFontWeight        Int?    @default(600)   // 400-900
  modalPriceColor             String? @default("#000000")
  modalVariantBorderRadius    Int?    @default(8)     // 0-24px
  modalVariantBorder          String? @default("#E5E7EB")
  modalVariantBg              String? @default("#FFFFFF")
  modalVariantFocusBorder     String? @default("#000000")
  modalImageBorderRadius      Int?    @default(8)     // 0-24px
  modalThumbnailActiveBorder  String? @default("#000000")
  modalThumbnailHoverBorder   String? @default("#666666")
  modalCloseBg                String? @default("rgba(0,0,0,0.1)")
  modalCloseHoverBg           String? @default("rgba(0,0,0,0.2)")
  modalCloseColor             String? @default("#000000")

  // ... existing fields
}
```

Run migrations:
```bash
npx prisma generate
npx prisma migrate dev --name add_full_page_enhancements
```

#### 6.2 Update DCP UI

**File:** `app/routes/app.design-control-panel.tsx`

Add new collapsible sections:

```typescript
// ===== PRODUCT CARD DIMENSIONS SECTION =====
<CollapsibleSection title="Product Card Dimensions" sectionKey="cardDimensions">
  <FormLayout>
    <RangeSlider
      label="Card Width (px)"
      value={productCardWidth}
      onChange={setProductCardWidth}
      min={200}
      max={400}
      step={10}
      output
    />
    <RangeSlider
      label="Card Height (px)"
      value={productCardHeight}
      onChange={setProductCardHeight}
      min={300}
      max={600}
      step={10}
      output
    />
    <RangeSlider
      label="Card Spacing (px)"
      value={productCardSpacing}
      onChange={setProductCardSpacing}
      min={10}
      max={60}
      step={5}
      output
    />
    <RangeSlider
      label="Card Padding (px)"
      value={productCardPadding}
      onChange={setProductCardPadding}
      min={4}
      max={24}
      step={2}
      output
    />
    <RangeSlider
      label="Inner Gap (px)"
      value={productCardInnerGap}
      onChange={setProductCardInnerGap}
      min={4}
      max={24}
      step={2}
      output
    />
  </FormLayout>
</CollapsibleSection>

// ===== PRODUCT CARD STYLING SECTION =====
<CollapsibleSection title="Product Card Styling" sectionKey="cardStyling">
  <FormLayout>
    <TextField
      label="Background Color"
      type="color"
      value={productCardBgColor}
      onChange={setProductCardBgColor}
    />
    <RangeSlider
      label="Border Radius (px)"
      value={productCardBorderRadius}
      onChange={setProductCardBorderRadius}
      min={0}
      max={24}
      step={2}
      output
    />
    <RangeSlider
      label="Border Width (px)"
      value={productCardBorderWidth}
      onChange={setProductCardBorderWidth}
      min={0}
      max={4}
      step={1}
      output
    />
    <TextField
      label="Border Color"
      type="color"
      value={productCardBorderColor}
      onChange={setProductCardBorderColor}
    />
    <TextField
      label="Shadow (CSS)"
      value={productCardShadow}
      onChange={setProductCardShadow}
      placeholder="0 2px 8px rgba(0,0,0,0.04)"
    />
    <TextField
      label="Hover Shadow (CSS)"
      value={productCardHoverShadow}
      onChange={setProductCardHoverShadow}
      placeholder="0 8px 24px rgba(0,0,0,0.12)"
    />
  </FormLayout>
</CollapsibleSection>

// ===== PRODUCT IMAGE SECTION =====
<CollapsibleSection title="Product Image" sectionKey="productImage">
  <FormLayout>
    <RangeSlider
      label="Image Height (px)"
      value={productCardImageHeight}
      onChange={setProductCardImageHeight}
      min={200}
      max={400}
      step={10}
      output
    />
    <TextField
      label="Image Background Color"
      type="color"
      value={productImageBgColor}
      onChange={setProductImageBgColor}
    />
    <RangeSlider
      label="Image Border Radius (px)"
      value={productImageBorderRadius}
      onChange={setProductImageBorderRadius}
      min={0}
      max={24}
      step={2}
      output
    />
  </FormLayout>
</CollapsibleSection>

// ===== MODAL STYLING SECTION =====
<CollapsibleSection title="Product Variant Modal" sectionKey="variantModal">
  <FormLayout>
    <TextField
      label="Modal Background"
      type="color"
      value={modalBgColor}
      onChange={setModalBgColor}
    />
    <RangeSlider
      label="Modal Border Radius (px)"
      value={modalBorderRadius}
      onChange={setModalBorderRadius}
      min={0}
      max={24}
      step={2}
      output
    />
    <RangeSlider
      label="Title Font Size (px)"
      value={modalTitleFontSize}
      onChange={setModalTitleFontSize}
      min={20}
      max={40}
      step={2}
      output
    />
    <TextField
      label="Title Color"
      type="color"
      value={modalTitleColor}
      onChange={setModalTitleColor}
    />
    <RangeSlider
      label="Price Font Size (px)"
      value={modalPriceFontSize}
      onChange={setModalPriceFontSize}
      min={16}
      max={32}
      step={2}
      output
    />
  </FormLayout>
</CollapsibleSection>
```

#### 6.3 Update CSS API Generator

**File:** `app/routes/api.design-settings.$shopDomain.css.tsx`

```typescript
function generateCSSFromSettings(settings: DesignSettings): string {
  return `
    /* ===== PRODUCT CARD DIMENSIONS ===== */
    --bundle-product-card-width: ${settings.productCardWidth || 280}px;
    --bundle-product-card-height: ${settings.productCardHeight || 420}px;
    --bundle-product-card-spacing: ${settings.productCardSpacing || 20}px;
    --bundle-product-card-border-radius: ${settings.productCardBorderRadius || 8}px;
    --bundle-product-card-padding: ${settings.productCardPadding || 12}px;
    --bundle-product-card-inner-gap: ${settings.productCardInnerGap || 12}px;

    /* Product Card Border & Shadow */
    --bundle-product-card-border-width: ${settings.productCardBorderWidth || 1}px;
    --bundle-product-card-border-color: ${settings.productCardBorderColor || '#E0E0E0'};
    --bundle-product-card-shadow: ${settings.productCardShadow || '0 2px 8px rgba(0,0,0,0.04)'};
    --bundle-product-card-hover-shadow: ${settings.productCardHoverShadow || '0 8px 24px rgba(0,0,0,0.12)'};

    /* Product Card Selected State */
    --bundle-product-card-selected-border-width: ${settings.productCardSelectedBorderWidth || 2}px;
    --bundle-product-card-selected-border-color: ${settings.productCardSelectedBorderColor || '#4CAF50'};
    --bundle-product-card-selected-shadow: ${settings.productCardSelectedShadow || '0 4px 16px rgba(76,175,80,0.3)'};

    /* ===== PRODUCT IMAGE ===== */
    --bundle-product-card-image-height: ${settings.productCardImageHeight || 280}px;
    --bundle-product-image-border-radius: ${settings.productImageBorderRadius || 6}px;
    --bundle-product-image-bg: ${settings.productImageBgColor || '#F8F8F8'};
    --bundle-product-image-border-width: ${settings.productImageBorderWidth || 1}px;
    --bundle-product-image-border-color: ${settings.productImageBorderColor || 'rgba(0,0,0,0.04)'};

    /* ===== PRODUCT TITLE ===== */
    --bundle-product-card-title-font-size: ${settings.productCardTitleFontSize || 16}px;
    --bundle-product-card-title-font-weight: ${settings.productCardTitleFontWeight || 600};
    --bundle-product-card-title-line-height: ${settings.productCardTitleLineHeight || 1.4};
    --bundle-product-card-title-letter-spacing: ${settings.productCardTitleLetterSpacing || 'normal'};

    /* ===== PRICE STYLING ===== */
    --bundle-product-price-padding: ${settings.productPricePadding || '8px 12px'};
    --bundle-product-price-border-radius: ${settings.productPriceBorderRadius || 6}px;

    /* ===== BUTTON STYLING ===== */
    --bundle-button-padding: ${settings.buttonPadding || '14px 20px'};
    --bundle-button-letter-spacing: ${settings.buttonLetterSpacing || 0.3}px;

    /* ===== MODAL STYLING ===== */
    --bundle-modal-bg: ${settings.modalBgColor || '#FFFFFF'};
    --bundle-modal-border-radius: ${settings.modalBorderRadius || 12}px;
    --bundle-modal-title-font-size: ${settings.modalTitleFontSize || 28}px;
    --bundle-modal-title-font-weight: ${settings.modalTitleFontWeight || 700};
    --bundle-modal-title-color: ${settings.modalTitleColor || '#000000'};
    --bundle-modal-price-font-size: ${settings.modalPriceFontSize || 22}px;
    --bundle-modal-price-font-weight: ${settings.modalPriceFontWeight || 600};
    --bundle-modal-price-color: ${settings.modalPriceColor || '#000000'};
    --bundle-modal-variant-border-radius: ${settings.modalVariantBorderRadius || 8}px;
    --bundle-modal-variant-border: ${settings.modalVariantBorder || '#E5E7EB'};
    --bundle-modal-variant-bg: ${settings.modalVariantBg || '#FFFFFF'};
    --bundle-modal-variant-focus-border: ${settings.modalVariantFocusBorder || '#000000'};
    --bundle-modal-image-radius: ${settings.modalImageBorderRadius || 8}px;
    --bundle-modal-thumbnail-active-border: ${settings.modalThumbnailActiveBorder || '#000000'};
    --bundle-modal-thumbnail-hover-border: ${settings.modalThumbnailHoverBorder || '#666666'};
    --bundle-modal-close-bg: ${settings.modalCloseBg || 'rgba(0,0,0,0.1)'};
    --bundle-modal-close-hover-bg: ${settings.modalCloseHoverBg || 'rgba(0,0,0,0.2)'};
    --bundle-modal-close-color: ${settings.modalCloseColor || '#000000'};

    /* ... existing CSS variables */
  `;
}
```

### ✅ Testing Checklist

- [ ] All new DCP settings save correctly ✅
- [ ] CSS API generates proper variables ✅
- [ ] Widget applies DCP styles on load ✅
- [ ] Changes in DCP reflect on storefront ✅
- [ ] Default values work when no DCP settings ✅

---

## Testing Strategy

### Unit Testing
- [ ] CSS grid layout with fixed dimensions
- [ ] Modal open/close functionality
- [ ] Image gallery thumbnail switching
- [ ] Variant selection logic
- [ ] Quantity increment/decrement
- [ ] Add to bundle functionality

### Integration Testing
- [ ] DCP → CSS API → Widget flow
- [ ] Theme Editor settings → Widget
- [ ] Font inheritance from theme
- [ ] Modal interaction with main widget
- [ ] Responsive behavior on mobile/tablet/desktop

### Visual Regression Testing
- [ ] Compare with Dolphin & Dog reference
- [ ] Test across different themes
- [ ] Test with various product counts
- [ ] Test with long product titles
- [ ] Test with missing images
- [ ] Test with single variant products
- [ ] Test with multi-option variants

### Accessibility Testing
- [ ] Keyboard navigation in modal
- [ ] Screen reader announcements
- [ ] Focus trapping in modal
- [ ] Color contrast ratios
- [ ] Touch target sizes (min 44x44px)

### Performance Testing
- [ ] Modal load time < 200ms
- [ ] Image gallery smooth scrolling
- [ ] CSS variable application time
- [ ] Widget initialization time
- [ ] Bundle size optimization

---

## Rollout Plan

### Phase 1: Development (Week 1-2)
- [ ] Implement fixed card dimensions
- [ ] Add spacing controls
- [ ] Remove hardcoded fonts
- [ ] Update DCP with new settings

### Phase 2: Modal Development (Week 3-4)
- [ ] Build modal component
- [ ] Create image gallery
- [ ] Implement variant selection
- [ ] Style and polish

### Phase 3: Testing (Week 5)
- [ ] Internal QA testing
- [ ] Beta merchant testing
- [ ] Bug fixes and refinements
- [ ] Performance optimization

### Phase 4: Staging (Week 6)
- [ ] Deploy to staging environment
- [ ] Full regression testing
- [ ] Documentation updates
- [ ] Merchant training materials

### Phase 5: Production (Week 7)
- [ ] Gradual rollout (10% → 50% → 100%)
- [ ] Monitor error rates
- [ ] Gather merchant feedback
- [ ] Quick iteration on issues

---

## Success Metrics

### Quantitative
- Widget load time < 1s
- Modal open time < 200ms
- Zero JavaScript errors in console
- 100% accessibility score
- Bundle size < 150KB

### Qualitative
- Matches reference design 95%+
- Merchant satisfaction: "Easy to customize"
- Customer feedback: "Smooth experience"
- No font inheritance issues reported
- Modal interactions feel natural

---

## Related Documentation

- [FULL_PAGE_DESIGN_GAP_ANALYSIS.md](./FULL_PAGE_DESIGN_GAP_ANALYSIS.md)
- [DCP_IMPLEMENTATION_SUMMARY.md](./DCP_IMPLEMENTATION_SUMMARY.md)
- [FULL_PAGE_CUSTOMIZATION.md](./FULL_PAGE_CUSTOMIZATION.md)
- [FULL_PAGE_BUNDLE_IMPLEMENTATION_PLAN.md](./FULL_PAGE_BUNDLE_IMPLEMENTATION_PLAN.md)

---

**Status:** 📋 Ready for Implementation
**Last Updated:** January 13, 2026
**Estimated Completion:** 7 weeks
**Reviewers:** Aditya Awasthi
