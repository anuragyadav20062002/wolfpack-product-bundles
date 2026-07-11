/**
 * Shared selected product row renderer.
 *
 * Renders prepared display data only; selection rules, default-product rules,
 * and free-gift lock state stay in the caller until templates migrate.
 */

'use strict';

const SELECTED_ROW_PLACEHOLDER_IMAGE = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96"%3E%3Crect width="96" height="96" fill="%23f3f4f6"/%3E%3C/svg%3E';

export function renderSelectedProductRow(product = null, options = {}) {
  if (!product) return renderEmptyRow(options);

  const selectionKey = product.variantId || product.id || product.productId || '';
  const title = product.title || product.parentTitle || '';
  const variantTitle = product.variantTitle || product.variant || '';
  const quantity = Math.max(1, Number(product.quantity || 1));
  const quantityLabel = product.quantityLabel || options.quantityLabel || `x${quantity}`;
  const imageUrl = product.imageUrl || product.image?.src || SELECTED_ROW_PLACEHOLDER_IMAGE;
  const removable = product.isDefault !== true && product.isLocked !== true && options.removable !== false;
  const classes = [
    'bw-selected-row',
    'bw-selected-row--filled',
    product.isDefault ? 'bw-selected-row--default' : '',
    product.isFreeGift ? 'bw-selected-row--free-gift' : '',
    product.isLocked ? 'bw-selected-row--locked' : '',
    options.className || '',
  ].filter(Boolean).join(' ');

  return `
    <div class="${classes}" data-bw-selected-row="true" data-variant-id="${escapeAttribute(selectionKey)}">
      <div class="bw-selected-row__media">
        <img class="bw-selected-row__image" src="${escapeAttribute(imageUrl)}" alt="${escapeAttribute(title)}" loading="lazy">
      </div>
      <div class="bw-selected-row__body">
        <div class="bw-selected-row__title">${escapeHtml(title)}</div>
        ${variantTitle ? `<div class="bw-selected-row__variant">${escapeHtml(variantTitle)}</div>` : ''}
        ${product.priceText ? `<div class="bw-selected-row__price">${escapeHtml(product.priceText)}</div>` : ''}
        ${renderBadges(product)}
      </div>
      <div class="bw-selected-row__action">
        <span class="bw-selected-row__quantity" aria-label="Quantity ${quantity}">${escapeHtml(quantityLabel)}</span>
        ${removable ? `
          <button type="button" class="bw-selected-row__remove" data-action="remove-selected-product" data-variant-id="${escapeAttribute(selectionKey)}" aria-label="Delete ${escapeAttribute(title)}">
            ${renderTrashIcon()}
          </button>
        ` : ''}
      </div>
    </div>
  `;
}

function renderEmptyRow(options) {
  const label = options.emptyLabel || 'Empty slot';

  return `
    <div class="bw-selected-row bw-selected-row--empty ${options.className || ''}" data-bw-selected-row="true">
      <div class="bw-selected-row__media bw-selected-row__media--empty"></div>
      <div class="bw-selected-row__body">
        <div class="bw-selected-row__title bw-selected-row__title--empty">${escapeHtml(label)}</div>
        <div class="bw-selected-row__skeleton-line"></div>
      </div>
      <div class="bw-selected-row__action bw-selected-row__action--empty"></div>
    </div>
  `;
}

function renderTrashIcon() {
  return `
    <svg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" aria-hidden="true" focusable="false">
      <path d="M6 2h8a1 1 0 0 1 1 1v1H5V3a1 1 0 0 1 1-1Zm-2 3h12l-1 13H5L4 5Zm4 2v9m4-9v9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" fill="none"/>
    </svg>
  `;
}

function renderBadges(product) {
  const badges = [];
  if (product.isDefault) badges.push('Included');
  if (product.isFreeGift) badges.push(product.isLocked ? 'Locked gift' : 'Free gift');
  if (badges.length === 0) return '';

  return `
    <div class="bw-selected-row__badges">
      ${badges.map((badge) => `<span class="bw-selected-row__badge">${escapeHtml(badge)}</span>`).join('')}
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

function escapeAttribute(value) {
  return escapeHtml(value).replace(/`/g, '&#96;');
}
