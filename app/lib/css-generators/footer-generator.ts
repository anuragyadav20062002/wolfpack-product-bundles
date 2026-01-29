/**
 * Footer CSS Generator
 *
 * Generates CSS rules for the bundle footer.
 */

/**
 * Generate footer CSS rules
 */
export function generateFooterCSS(): string {
  return `
/* FOOTER STYLING */
.bundle-builder-modal .bundle-footer-messaging,
.bundle-builder-modal .modal-footer-discount-messaging {
  background-color: var(--bundle-footer-bg);
  border-radius: var(--bundle-footer-border-radius);
  padding: var(--bundle-footer-padding);
}

.bundle-builder-modal .modal-footer {
  background-color: var(--bundle-footer-bg);
  border-radius: var(--bundle-footer-border-radius);
  padding: var(--bundle-footer-padding);
  display: flex;
  align-items: center;
  justify-content: center;
}

.bundle-builder-modal .modal-footer-grouped-content {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
}

.bundle-builder-modal .modal-footer-total-pill {
  background-color: var(--bundle-footer-total-bg);
  display: var(--bundle-footer-price-display);
  padding: 6px 16px;
  border-radius: 6px;
  align-items: center;
  gap: 8px;
}

.bundle-builder-modal .modal-footer-buttons-row {
  display: flex;
  gap: 15px;
  align-items: center;
}

.bundle-builder-modal .modal-footer .total-price-strike {
  color: var(--bundle-footer-strike-price-color);
  font-size: var(--bundle-footer-strike-font-size);
  font-weight: var(--bundle-footer-strike-font-weight);
  text-decoration: line-through;
}

.bundle-builder-modal .modal-footer .total-price-final {
  color: var(--bundle-footer-final-price-color);
  font-size: var(--bundle-footer-final-price-font-size);
  font-weight: var(--bundle-footer-final-price-font-weight);
}

.bundle-builder-modal .modal-footer .cart-badge-wrapper {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.bundle-builder-modal .modal-footer .cart-icon {
  display: inline-block;
  vertical-align: middle;
}

.bundle-builder-modal .modal-footer .modal-nav-button.prev-button {
  background-color: var(--bundle-footer-back-button-bg);
  color: var(--bundle-footer-back-button-text);
  border: 1px solid var(--bundle-footer-back-button-border);
  border-radius: var(--bundle-footer-back-button-radius);
  padding: 12px 56px;
  font-size: 14px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.bundle-builder-modal .modal-footer .modal-nav-button.next-button {
  background-color: var(--bundle-footer-next-button-bg);
  color: var(--bundle-footer-next-button-text);
  border: 1px solid var(--bundle-footer-next-button-border);
  border-radius: var(--bundle-footer-next-button-radius);
  padding: 12px 56px;
  font-size: 14px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.bundle-builder-modal .modal-footer-progress-fill,
.bundle-builder-modal .progress-fill,
#bundle-builder-app .progress-fill {
  background-color: var(--bundle-footer-progress-filled);
}

.bundle-builder-modal .modal-footer-progress-bar,
.bundle-builder-modal .progress-bar,
#bundle-builder-app .progress-bar {
  background-color: var(--bundle-footer-progress-empty);
}`;
}
