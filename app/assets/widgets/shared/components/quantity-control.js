/**
 * Shared quantity control renderer.
 *
 * Keeps legacy class names for event-handler compatibility while adding a
 * stable `bw-quantity-control` contract for migrated templates.
 */

'use strict';

export function renderQuantityControl({
  variantId,
  quantity = 0,
  decreaseDisabled = false,
  increaseDisabled = false,
  className = '',
} = {}) {
  const key = escapeHtml(variantId || '');
  const normalizedQuantity = Math.max(0, Number(quantity || 0));
  const classes = ['bw-quantity-control', 'inline-quantity-controls', className]
    .filter(Boolean)
    .join(' ');

  return `
    <div class="${classes}" data-product-id="${key}">
      <button type="button" class="bw-quantity-control__button inline-qty-btn qty-decrease" data-product-id="${key}" ${decreaseDisabled ? 'disabled aria-disabled="true"' : ''}>−</button>
      <span class="bw-quantity-control__value inline-qty-display">${normalizedQuantity}</span>
      <button type="button" class="bw-quantity-control__button inline-qty-btn qty-increase" data-product-id="${key}" ${increaseDisabled ? 'disabled aria-disabled="true"' : ''}>+</button>
    </div>
  `;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
