/**
 * Product Card CSS Generator
 *
 * Generates CSS rules for product cards in the bundle widget.
 */

/**
 * Generate product card CSS rules
 */
export function generateProductCardCSS(): string {
  return `
/* PRODUCT CARD STYLING */
#bundle-builder-app .product-card,
.bundle-builder-modal .modal-body .product-card {
  background-color: var(--bundle-product-card-bg);
}

#bundle-builder-app .product-card .product-title,
.bundle-builder-modal .modal-body .product-card .product-title {
  color: var(--bundle-product-card-font-color);
  font-size: var(--bundle-product-card-font-size);
  font-weight: var(--bundle-product-card-font-weight);
}

#bundle-builder-app .product-card .product-image img,
.bundle-builder-modal .modal-body .product-card .product-image img {
  object-fit: var(--bundle-product-card-image-fit);
}

#bundle-builder-app .product-card .product-price,
.bundle-builder-modal .modal-body .product-card .product-price {
  display: var(--bundle-product-price-display);
  color: var(--bundle-product-final-price-color);
  font-size: var(--bundle-product-final-price-font-size);
  font-weight: var(--bundle-product-final-price-font-weight);
}

#bundle-builder-app .product-grid,
.bundle-builder-modal .modal-body .product-grid {
  display: grid;
  grid-template-columns: repeat(var(--bundle-product-cards-per-row), 1fr);
  gap: 16px;
}

/* PRODUCT CARD SUB-ELEMENTS IN MODAL */
.bundle-builder-modal .modal-body .product-card .product-quantity-selector {
  background-color: var(--bundle-quantity-selector-bg);
  color: var(--bundle-quantity-selector-text-color);
  border-radius: var(--bundle-quantity-selector-border-radius);
}

.bundle-builder-modal .modal-body .product-card .variant-selector {
  background-color: var(--bundle-variant-selector-bg);
  color: var(--bundle-variant-selector-text-color);
  border-radius: var(--bundle-variant-selector-border-radius);
}

.bundle-builder-modal .modal-body .product-card .product-add-btn {
  background-color: var(--bundle-button-bg);
  color: var(--bundle-button-text-color);
  font-size: var(--bundle-button-font-size);
  font-weight: var(--bundle-button-font-weight);
  border-radius: var(--bundle-button-border-radius);
}`;
}
