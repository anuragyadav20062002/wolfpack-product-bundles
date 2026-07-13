/**
 * Shared product card renderer.
 *
 * The DOM contract reserves a stable action area so selected state swaps the
 * add button for quantity controls without changing the surrounding layout.
 */

'use strict';

import { renderQuantityControl } from './quantity-control.js';

const DEFAULT_PLACEHOLDER_IMAGE = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400"%3E%3Crect width="400" height="400" fill="%23f3f4f6"/%3E%3C/svg%3E';

export function renderSharedProductCard(product = {}, currentQuantity = 0, currencyInfo = {}, options = {}) {
  const selectionKey = product.variantId || product.id || '';
  const quantity = Math.max(0, Number(currentQuantity || 0));
  const isSelected = quantity > 0;
  const mode = options.mode || 'grid';
  const variantText = getVariantDisplayText(product);
  const isIndividualVariantCard = Boolean(product.parentProductId && product.variantId && variantText);
  const title = getDisplayTitle(product, variantText);
  const imageUrls = getProductImageUrls(product);
  const imageUrl = imageUrls[0] || DEFAULT_PLACEHOLDER_IMAGE;
  const hasMultipleImages = imageUrls.length > 1;
  const price = formatPrice(product.price, currencyInfo);
  const compareAtPrice = formatPrice(product.compareAtPrice, currencyInfo);
  const variantSelectorBeforePrice = options.variantSelectorPlacement === 'beforePrice';
  const rootClasses = [
    'bw-product-card',
    'product-card',
    `bw-product-card--mode-${escapeAttribute(mode)}`,
    variantText ? 'bw-product-card--has-variant product-card--has-variant' : '',
    isIndividualVariantCard ? 'bw-product-card--individual-variant product-card--individual-variant' : '',
    isSelected ? 'bw-product-card--selected' : '',
    options.className || '',
  ].filter(Boolean).join(' ');

  return `
    <div class="${rootClasses}" data-bw-product-card="true" data-product-id="${escapeAttribute(selectionKey)}" data-current-selected-variant-id="${escapeAttribute(selectionKey)}" data-bw-card-image-count="${imageUrls.length}" data-bw-card-image-index="0"${isIndividualVariantCard ? ' data-bw-card-individual-variant="true"' : ''}${hasMultipleImages ? ' data-bw-card-has-multiple-images="true"' : ''}>
      <div class="bw-product-card__media product-image" data-bw-product-media="true">
        <img class="bw-product-card__image" src="${escapeAttribute(imageUrl)}" alt="${escapeAttribute(title)}" loading="lazy">
        ${hasMultipleImages ? renderImageNavButton('prev') : ''}
        ${hasMultipleImages ? renderImageNavButton('next') : ''}
        <span class="bw-product-card__image-overlay product-image-overlay" aria-hidden="true">
          <span class="bw-product-card__magnifier"></span>
        </span>
        ${options.stockBadgeHtml || ''}
      </div>
      ${options.cardBadgeHtml || ''}
      <div class="bw-product-card__body product-content-wrapper">
          <div class="bw-product-card__text product-text-container ${variantText ? 'bw-product-card__text--has-variant product-text-container--has-variant' : ''}">
          <div class="bw-product-card__title product-title">${escapeHtml(title)}</div>
          ${variantText ? `<div class="bw-product-card__variant product-variant-row" data-bw-card-variant-row="true">${escapeHtml(variantText)}</div>` : ''}
        </div>
        <div class="product-card-price-action">
          ${variantSelectorBeforePrice ? options.variantSelectorHtml || '' : ''}
          ${price ? `
            <div class="bw-product-card__price product-price-row">
              ${compareAtPrice ? `<span class="bw-product-card__compare-price product-price-strike">${escapeHtml(compareAtPrice)}</span>` : ''}
              <span class="bw-product-card__current-price product-price">${escapeHtml(price)}</span>
            </div>
          ` : ''}
          ${variantSelectorBeforePrice ? '' : options.variantSelectorHtml || ''}
          <div class="bw-product-card__action product-card-action ${isSelected ? 'is-expanded' : ''}">
            ${isSelected && options.selectedAction === 'button'
              ? renderAddButton(selectionKey, {
                ...options,
                addButtonText: options.selectedButtonText || options.addButtonText,
              })
              : isSelected
              ? renderQuantityControl({
                variantId: selectionKey,
                quantity,
                decreaseDisabled: options.decreaseDisabled === true,
                increaseDisabled: options.increaseDisabled === true,
              })
              : renderAddButton(selectionKey, options)}
          </div>
        </div>
      </div>
    </div>
  `;
}

export function getProductImageUrls(product = {}) {
  const urls = [];
  const addUrl = (value) => {
    const url = normalizeImageUrl(value);
    if (url && !urls.includes(url)) urls.push(url);
  };

  addUrl(product.imageUrl);
  addUrl(product.image);
  addUrl(product.featuredImage);
  (Array.isArray(product.images) ? product.images : []).forEach(addUrl);

  return urls.length > 0 ? urls : [DEFAULT_PLACEHOLDER_IMAGE];
}

function getDisplayTitle(product, variantText) {
  const parentTitle = typeof product.parentTitle === 'string' ? product.parentTitle.trim() : '';
  const rawTitle = typeof product.title === 'string' ? product.title.trim() : '';

  if (variantText && parentTitle) return parentTitle;

  const separatorIndex = rawTitle.indexOf(' - ');
  if (variantText && separatorIndex > 0) {
    return rawTitle.slice(0, separatorIndex).trim();
  }

  return parentTitle || rawTitle;
}

function getVariantDisplayText(product) {
  const explicitVariantTitle = typeof product.variantTitle === 'string' ? product.variantTitle.trim() : '';
  if (explicitVariantTitle && explicitVariantTitle !== 'Default Title') {
    return explicitVariantTitle;
  }

  const parentTitle = typeof product.parentTitle === 'string' ? product.parentTitle.trim() : '';
  const rawTitle = typeof product.title === 'string' ? product.title.trim() : '';
  const canInferExpandedVariant = Boolean(product.parentProductId || parentTitle);
  if (!rawTitle) return '';

  if (parentTitle) {
    const parentPrefix = `${parentTitle} - `;
    if (rawTitle.startsWith(parentPrefix)) {
      return rawTitle.slice(parentPrefix.length).trim();
    }
  }

  const separatorIndex = rawTitle.indexOf(' - ');
  if (canInferExpandedVariant && separatorIndex > 0) {
    return rawTitle.slice(separatorIndex + 3).trim();
  }

  return '';
}

function renderAddButton(selectionKey, options) {
  const disabled = options.addDisabled === true;
  const text = options.addButtonText || '+';
  const accessibleLabel = text.trim() === '+'
    ? 'aria-label="Add"'
    : '';

  return `
    <button type="button" class="bw-product-card__add-button product-add-btn" data-product-id="${escapeAttribute(selectionKey)}" ${accessibleLabel} ${disabled ? 'disabled aria-disabled="true"' : ''}>
      ${escapeHtml(text)}
    </button>
  `;
}

function renderImageNavButton(direction) {
  const label = direction === 'prev' ? 'Previous image' : 'Next image';
  const symbol = direction === 'prev' ? '&#10094;' : '&#10095;';
  return `
    <button type="button" class="bw-product-card__image-nav bw-product-card__image-nav--${direction}" data-bw-image-nav="${direction}" aria-label="${label}">
      ${symbol}
    </button>
  `;
}

function normalizeImageUrl(value) {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return value.url || value.src || value.originalSrc || value.transformedSrc || '';
}

function formatPrice(value, currencyInfo) {
  if (value == null || value === '') return '';

  const amount = Number(value || 0) / 100;
  const format = currencyInfo?.display?.format || '${{amount}}';
  return format.replace('{{amount}}', amount.toFixed(2));
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
