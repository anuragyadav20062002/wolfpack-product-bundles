/**
 * Button CSS Generator
 *
 * Generates CSS rules for buttons in the bundle widget.
 */

/**
 * Generate button CSS rules
 */
export function generateButtonCSS(): string {
  return `
/* BUTTON STYLING */
#bundle-builder-app .add-bundle-to-cart,
.bundle-builder-modal .quantity-control-button {
  background-color: var(--bundle-button-bg);
  color: var(--bundle-button-text-color);
  font-size: var(--bundle-button-font-size);
  font-weight: var(--bundle-button-font-weight);
  border-radius: var(--bundle-button-border-radius);
  border: none;
}

#bundle-builder-app .add-bundle-to-cart:hover {
  background-color: var(--bundle-button-hover-bg);
}

#bundle-builder-app .add-bundle-to-cart.disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

#bundle-builder-app .button-price-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
}

#bundle-builder-app .button-price-strike {
  text-decoration: line-through;
  font-size: 0.8em;
  opacity: 0.7;
}

#bundle-builder-app .button-price-final {
  font-size: 1em;
}`;
}
