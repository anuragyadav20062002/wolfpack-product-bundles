/**
 * Responsive CSS Generator
 *
 * Generates responsive media query CSS rules for the bundle widget.
 */

/**
 * Generate responsive CSS rules
 */
export function generateResponsiveCSS(): string {
  return `
/* RESPONSIVE */
@media (max-width: 768px) {
  #bundle-builder-app .product-grid,
  .bundle-builder-modal .modal-body .product-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 480px) {
  #bundle-builder-app .product-grid,
  .bundle-builder-modal .modal-body .product-grid {
    grid-template-columns: 1fr;
  }
}`;
}
