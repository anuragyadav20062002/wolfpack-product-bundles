/**
 * Shared selected product slot renderer.
 *
 * Slots can be used by sidebars, modal summaries, and mobile trays. The caller
 * supplies prepared slot/product state and owns all business rules.
 */

'use strict';

import { renderSelectedProductRow } from './selected-product-row.js';

export function renderSelectedProductSlots(slots = [], options = {}) {
  const mode = options.mode || 'grid';
  const classes = [
    'bw-selected-slots',
    `bw-selected-slots--mode-${escapeAttribute(mode)}`,
    options.className || '',
  ].filter(Boolean).join(' ');

  return `
    <div class="${classes}" data-bw-selected-slots="true">
      ${slots.map((slot, index) => renderSlot(slot, index, options)).join('')}
    </div>
  `;
}

function renderSlot(slot = {}, index, options) {
  const product = slot.product || null;
  const slotId = slot.id || `slot-${index}`;
  const label = slot.label || `Slot ${index + 1}`;
  const statusClasses = getStatusClasses(product);
  const classes = [
    'bw-selected-slot',
    product ? 'bw-selected-slot--filled' : 'bw-selected-slot--empty',
    ...statusClasses,
  ].join(' ');

  if (!product) {
    const iconUrl = slot.iconUrl || options.emptySlotIconUrl || '';
    const emptyVisual = iconUrl
      ? `<img class="bw-selected-slot__icon" src="${escapeAttribute(iconUrl)}" alt="" loading="lazy">`
      : '<span class="bw-selected-slot__placeholder"></span>';

    return `
      <button type="button" class="${classes}" data-bw-selected-slot="true" data-slot-id="${escapeAttribute(slotId)}" data-action="select-slot">
        ${emptyVisual}
        <span class="bw-selected-slot__label">${escapeHtml(label)}</span>
      </button>
    `;
  }

  return `
    <div class="${classes}" data-bw-selected-slot="true" data-slot-id="${escapeAttribute(slotId)}">
      ${slot.label ? `<div class="bw-selected-slot__label">${escapeHtml(slot.label)}</div>` : ''}
      ${renderSelectedProductRow(product, {
        className: 'bw-selected-slot__row',
        removable: product.isDefault !== true && product.isLocked !== true && options.removable !== false,
      })}
    </div>
  `;
}

function getStatusClasses(product) {
  if (!product) return [];

  return [
    product.isDefault ? 'bw-selected-slot--default' : '',
    product.isFreeGift ? 'bw-selected-slot--free-gift' : '',
    product.isLocked ? 'bw-selected-slot--locked' : '',
  ].filter(Boolean);
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
