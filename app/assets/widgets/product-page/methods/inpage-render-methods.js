import { BUNDLE_WIDGET, CurrencyManager, ComponentGenerator, ToastManager } from '../../../bundle-widget-components.js';
import { ConditionValidator } from '../../shared/condition-validator.js';
import { getDiscountProgressData } from '../../shared/engine/bundle-selectors.js';
import { renderDiscountProgress } from '../../shared/components/discount-progress.js';
import { renderSharedProductCard } from '../../shared/components/product-card.js';
import { shouldRenderInlineVariantSelector } from '../../shared/variant-selector-policy.js';
import { resolveProductPageCardButtonText, resolveProductPageInlineAddText } from './modal-methods.js';

function bsIsDefaultStep(step) { return !!step?.isDefault; }

function bsGetDiscountBadgeLabel(step) { return step?.discountBadgeLabel || null; }

function makeSlotCardKeyboardAccessible(card, activate) {
  card.setAttribute('role', 'button');
  card.tabIndex = 0;
  card.addEventListener('click', activate);
  card.addEventListener('keydown', (event) => {
    if (event.target && event.target !== card) return;
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    activate();
  });
}

export function resolveSelectedSlotTitle(title, isVertical) {
  const normalizedTitle = String(title || '');
  if (isVertical || normalizedTitle.length <= 25) return normalizedTitle;
  return `${normalizedTitle.substring(0, 25)}...`;
}

function renderInpageProductLoadingRows(rowCount = 3) {
  const rows = Array.from({ length: rowCount }, (_, index) => `
    <div class="bw-ppb-inpage-loading-row" aria-hidden="true" data-loading-row="${index + 1}">
      <span class="bw-ppb-inpage-loading-media"></span>
      <span class="bw-ppb-inpage-loading-body">
        <span class="bw-ppb-inpage-loading-line bw-ppb-inpage-loading-line--title"></span>
        <span class="bw-ppb-inpage-loading-line bw-ppb-inpage-loading-line--price"></span>
      </span>
      <span class="bw-ppb-inpage-loading-action"></span>
    </div>
  `).join('');

  return `
    <div class="bw-ppb-inpage-loading" role="status" aria-label="Loading products">
      ${rows}
    </div>
  `;
}

export function shouldDisplayVariantsAsIndividualForInpageCategory(step, stepIndex, activeCategoryIndexes = {}) {
  const categories = Array.isArray(step?.categories) ? step.categories : [];
  if (categories.length > 0) {
    const activeIndex = typeof activeCategoryIndexes?.[stepIndex] === 'number'
      ? activeCategoryIndexes[stepIndex]
      : 0;
    const category = categories[activeIndex] || categories[0];
    return category?.displayVariantsAsIndividualProducts === true
      || category?.displayVariantsAsIndividual === true;
  }

  return step?.displayVariantsAsIndividualProducts === true
    || step?.displayVariantsAsIndividual === true;
}

export function getCascadeSoleVariantDisplayProduct(product = {}) {
  const variants = Array.isArray(product.variants) ? product.variants : [];
  const soleVariantTitle = typeof variants[0]?.title === 'string' ? variants[0].title.trim() : '';
  const hadMultipleSourceVariants = Number(product.sourceVariantCount || 0) > 1;

  if (product.parentProductId || !hadMultipleSourceVariants || variants.length !== 1) return product;
  if (!soleVariantTitle || soleVariantTitle === 'Default Title') return product;

  return { ...product, variantTitle: soleVariantTitle };
}

export function resolveInpageProductSelection(
  product = {},
  stepSelections = {},
  normalizeSelectionKey = (value) => String(value || ''),
  selectedProductCategoryIndexes = {},
  activeCategoryIndex = null,
) {
  const defaultSelectionKey = product.variantId || product.id || '';
  const candidateIds = [defaultSelectionKey, product.id, product.productId];
  if (Array.isArray(product.variants)) {
    candidateIds.push(...product.variants.map((variant) => variant.id));
  }

  const normalizedCandidates = new Set(
    candidateIds.map(normalizeSelectionKey).filter(Boolean),
  );
  const restoredEntry = Object.entries(stepSelections || {}).find(
    ([selectionKey, rawQuantity]) => (
      Number(rawQuantity) > 0
      && normalizedCandidates.has(normalizeSelectionKey(selectionKey))
    ),
  );

  if (restoredEntry) {
    const normalizedSelectionKey = normalizeSelectionKey(restoredEntry[0]);
    const categoryOwnerEntry = Object.entries(selectedProductCategoryIndexes || {}).find(
      ([selectionKey]) => normalizeSelectionKey(selectionKey) === normalizedSelectionKey,
    );
    const categoryOwner = categoryOwnerEntry ? Number(categoryOwnerEntry[1]) : null;
    const belongsToActiveCategory = (
      activeCategoryIndex === null
      || categoryOwner === null
      || categoryOwner === activeCategoryIndex
    );
    return {
      selectionKey: restoredEntry[0],
      quantity: belongsToActiveCategory ? Number(restoredEntry[1]) || 0 : 0,
    };
  }

  return {
    selectionKey: defaultSelectionKey,
    quantity: 0,
  };
}

export const ProductPageInpageRenderMethods = {
_renderInpageStepProducts(stepIndex, target) {
  const rawProducts = this.stepProductData[stepIndex] || [];
  if (!this._inpageStepProductsLoaded) this._inpageStepProductsLoaded = {};
  target.classList.toggle('bw-ppb-cascade-product-list', this._isProductPageCascadeTemplate());
  target.classList.toggle('bw-ppb-cognive-product-grid', this._isProductPageGridTemplate());
  const currentStep = this.selectedBundle?.steps?.[stepIndex];
  const prependStepBanner = () => {
    const banner = this._createStepBannerImage?.(currentStep);
    if (banner) target.prepend(banner);
  };

  const stepProductsLoaded = this._inpageStepProductsLoaded[stepIndex] === true;
  if (rawProducts.length === 0 && !stepProductsLoaded && !(this._stepFetchFailed && this._stepFetchFailed[stepIndex])) {
    target.setAttribute?.('aria-busy', 'true');
    target.innerHTML = renderInpageProductLoadingRows();
    prependStepBanner();
    this.loadStepProducts(stepIndex).then(() => {
      this._inpageStepProductsLoaded[stepIndex] = true;
      if (target.isConnected) this._renderInpageStepProducts(stepIndex, target);
    }).catch(() => {
      if (!this._stepFetchFailed) this._stepFetchFailed = {};
      this._stepFetchFailed[stepIndex] = true;
      if (target.isConnected) this._renderInpageStepProducts(stepIndex, target);
    });
    return;
  }

  const categoryDisplaysVariantsAsIndividual = shouldDisplayVariantsAsIndividualForInpageCategory(
    currentStep,
    stepIndex,
    this.activeInpageCategoryIndexes,
  );
  const products = this._filterProductsForInpageCategory(
    currentStep,
    categoryDisplaysVariantsAsIndividual
      ? this.expandProductsByVariant(rawProducts)
      : rawProducts,
    stepIndex
  );
  target.setAttribute?.('aria-busy', 'false');
  if (products.length === 0) {
    target.innerHTML = this._stepFetchFailed?.[stepIndex]
      ? '<p class="modal-fetch-error">Could not load products. Please check your connection and try again.</p>'
      : '<p class="no-products-message">No products are configured for this step.</p>';
    prependStepBanner();
    return;
  }

  const usesCascadeCards = this._isProductPageCascadeTemplate();
  const usesGridCards = this._isProductPageGridTemplate();
  const widgetConfig = this.config || {};
  const productQuantityLimit = ConditionValidator.getAllowedQuantityPerProduct(
    this.selectedBundle?.validateQuantityPerProduct
  );
  const currencyInfo = CurrencyManager.getCurrencyInfo();
  const inlineAddText = resolveProductPageInlineAddText(this._resolveText?.bind(this));

  target.innerHTML = products.map(product => {
    const directSelectionKey = product.variantId || product.id;
    const restoredGridSelection = usesGridCards
      ? resolveInpageProductSelection(
        product,
        this.selectedProducts?.[stepIndex],
        (value) => this.normalizeSelectionKey(value),
        this.selectedProductCategoryIndexes?.[stepIndex],
        this.activeInpageCategoryIndexes?.[stepIndex] ?? 0,
      )
      : null;
    const selectionKey = restoredGridSelection?.selectionKey || directSelectionKey;
    const currentQuantity = restoredGridSelection?.quantity
      ?? this.getSelectedQuantity(stepIndex, selectionKey);
    const { available, outOfStock } = this.getVariantAvailable(stepIndex, selectionKey);
    const atMaxStock = available !== null && currentQuantity >= available;
    const atMaxProductQuantity = productQuantityLimit !== null && currentQuantity >= productQuantityLimit;
    const increaseDisabled = outOfStock || atMaxStock || atMaxProductQuantity;
    const stockBadge = outOfStock
      ? '<div class="product-stock-badge product-stock-badge--out">Out of stock</div>'
      : '';
    const variantSelectorHtml = this.renderInlineCardVariantSelector(product, currentStep);

    if (usesCascadeCards) {
      const cascadeProduct = getCascadeSoleVariantDisplayProduct(product);
      return renderSharedProductCard(
        cascadeProduct,
        currentQuantity,
        currencyInfo,
        {
          mode: 'row',
          className: [
            'bw-ppb-cascade-product-row',
            'wpbMixCascadeProductWrapper',
            variantSelectorHtml ? 'bw-ppb-cascade-product-row--has-variant-selector' : '',
            currentQuantity > 0 ? 'selected' : '',
            outOfStock ? 'is-out-of-stock' : '',
          ].filter(Boolean).join(' '),
          description: '',
          displaySeeMoreLink: false,
          expandProductCardOnHover: false,
          showCompareAtPrice: this._shouldShowProductComparedAtPrice(),
          variantSelectorHtml,
          addButtonText: resolveProductPageCardButtonText({ currentQuantity, currentStep, outOfStock, defaultAddText: inlineAddText }),
          addDisabled: outOfStock,
          increaseDisabled,
          stockBadgeHtml: stockBadge,
        }
      );
    }

    if (usesGridCards) {
      return renderSharedProductCard(
        selectionKey === directSelectionKey ? product : { ...product, variantId: selectionKey },
        currentQuantity,
        currencyInfo,
        {
          variantSelectorHtml,
          description: '',
          displaySeeMoreLink: false,
          expandProductCardOnHover: false,
          showCompareAtPrice: this._shouldShowProductComparedAtPrice(),
          mode: 'grid',
          className: `bw-ppb-cognive-product-card ${outOfStock ? 'is-out-of-stock' : ''}`.trim(),
          addButtonText: resolveProductPageCardButtonText({ currentQuantity, currentStep, outOfStock, defaultAddText: inlineAddText }),
          selectedAction: 'button',
          selectedButtonText: resolveProductPageCardButtonText({ currentQuantity, currentStep, outOfStock, defaultAddText: inlineAddText }),
          addDisabled: false,
          increaseDisabled,
          stockBadgeHtml: stockBadge,
        }
      );
    }

    const addUnavailableAttribute = outOfStock ? 'aria-disabled="true"' : '';
    const showQuantitySelector = !this._usesCompactInpageProductCards()
      && widgetConfig.showQuantitySelectorOnCard;
    const productContent = `
      <div class="product-title">${ComponentGenerator.escapeHtml(product.title)}</div>
      ${product.price ? `
        <div class="product-price-row">
          ${this._shouldShowProductComparedAtPrice() && product.compareAtPrice ? `<span class="product-price-strike">${CurrencyManager.convertAndFormat(product.compareAtPrice, currencyInfo)}</span>` : ''}
          <span class="product-price">${CurrencyManager.convertAndFormat(product.price, currencyInfo)}</span>
        </div>
      ` : ''}
      ${this.renderInlineCardVariantSelector(product, currentStep)}
      ${showQuantitySelector ? `
        <div class="product-quantity-wrapper">
          <div class="product-quantity-selector">
            <button class="qty-btn qty-decrease" data-product-id="${selectionKey}">−</button>
            <span class="qty-display">${currentQuantity}</span>
            <button class="qty-btn qty-increase" data-product-id="${selectionKey}" ${increaseDisabled ? 'disabled aria-disabled="true"' : ''}>+</button>
          </div>
        </div>
      ` : ''}
    `;
    const addButton = `
      <button class="product-add-btn ${currentQuantity > 0 ? 'added' : ''}" data-product-id="${selectionKey}" ${addUnavailableAttribute}>
        ${resolveProductPageCardButtonText({ currentQuantity, currentStep, outOfStock, defaultAddText: inlineAddText })}
      </button>
    `;

    return `
      <div class="product-card ${usesGridCards ? 'bw-ppb-cognive-product-card' : ''} ${currentQuantity > 0 ? 'bw-product-card--selected' : ''} ${outOfStock ? 'is-out-of-stock' : ''}" data-product-id="${selectionKey}">
        <div class="product-image">
          <img src="${product.imageUrl}" alt="${ComponentGenerator.escapeHtml(product.title)}" loading="lazy">
          ${stockBadge}
        </div>
        <div class="product-content-wrapper">
          ${productContent}
          ${addButton}
        </div>
      </div>
    `;
  }).join('');

  prependStepBanner();
  this.attachProductEventHandlers(target, stepIndex);
},

renderInlineCardVariantSelector(product, step) {
  if (!shouldRenderInlineVariantSelector({
    bundleVariantSelectorEnabled: this.selectedBundle?.variantSelectorEnabled !== false,
    product,
    displayVariantsAsIndividualProducts: step?.displayVariantsAsIndividual === true || step?.displayVariantsAsIndividualProducts === true,
  })) {
    return '';
  }

  return this.renderVariantSelector(product);
},

// Create an "add more" card for incomplete steps
createAddMoreCard(step, stepIndex, currentCount) {
  const stepBox = document.createElement('div');
  stepBox.className = 'step-box add-more-card';
  stepBox.dataset.stepIndex = stepIndex;

  // Plus icon
  const plusIcon = document.createElement('span');
  plusIcon.className = 'plus-icon';
  plusIcon.textContent = '+';
  stepBox.appendChild(plusIcon);

  // Add step name
  const stepName = document.createElement('p');
  stepName.className = 'step-name';
  stepName.textContent = step.name || `Step ${stepIndex + 1}`;
  stepBox.appendChild(stepName);

  // Add remaining count text
  const selectionCount = document.createElement('div');
  selectionCount.className = 'step-selection-count';
  const operator = step.conditionOperator;
  const rawRequired = step.conditionValue || 1;
  const requiredCount = operator === BUNDLE_WIDGET.CONDITION_OPERATORS.GREATER_THAN
    ? rawRequired + 1
    : rawRequired;
  const remaining = requiredCount - currentCount;
  if (remaining > 0) {
    selectionCount.textContent = `Add ${remaining} more`;
  }
  stepBox.appendChild(selectionCount);

  // Add click handler to open modal
  stepBox.addEventListener('click', () => this.openModal(stepIndex));

  return stepBox;
},

// Create a state card for a selected product
createSelectedProductCard(item, cardIndex) {
  const { product, stepIndex, step, variantId, instanceIndex } = item;

  const isDefault = bsIsDefaultStep(step);
  const badgeLabel = bsGetDiscountBadgeLabel(step);

  const stepBox = document.createElement('div');
  stepBox.className = 'step-box step-completed product-card-state bw-slot-card bw-slot-card--filled';
  stepBox.dataset.stepIndex = stepIndex;
  stepBox.dataset.variantId = variantId;
  stepBox.dataset.cardIndex = cardIndex;

  // Remove button — hidden for default (non-removable) steps
  if (!isDefault) {
    const clearBadge = document.createElement('button');
    clearBadge.type = 'button';
    clearBadge.className = 'step-clear-badge';
    clearBadge.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="12" fill="#f3f4f6"/>
        <path d="M8 8L16 16M16 8L8 16" stroke="#000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;
    clearBadge.title = 'Remove this product';
    clearBadge.setAttribute('aria-label', clearBadge.title);
    clearBadge.addEventListener('click', (e) => {
      e.stopPropagation();
      this.removeProductFromSelection(stepIndex, variantId);
    });
    stepBox.appendChild(clearBadge);
  }

  // Product image container
  const imagesContainer = document.createElement('div');
  imagesContainer.className = 'bw-slot-card__image-wrapper';
  const img = document.createElement('img');
  img.src = product.imageUrl || BUNDLE_WIDGET.PLACEHOLDER_IMAGE;
  img.alt = product.title || '';
  img.className = 'bw-slot-card__image';
  imagesContainer.appendChild(img);
  stepBox.appendChild(imagesContainer);

  // Discount badge (bottom-sheet mode only, when step has a discountBadgeLabel)
  if (badgeLabel) {
    const badge = document.createElement('span');
    badge.className = 'bw-slot-discount-badge';
    badge.textContent = badgeLabel;
    stepBox.appendChild(badge);
  }

  // Product title at bottom
  const productTitle = document.createElement('p');
  productTitle.className = 'step-name step-name-completed product-title-state';
  const displayTitle = resolveSelectedSlotTitle(
    product.title,
    this._usesVerticalModalSlotLayout?.() === true,
  );
  productTitle.textContent = displayTitle;
  productTitle.title = product.title; // Full title on hover
  stepBox.appendChild(productTitle);

  // Filled slots stay editable. Selection validation still runs inside the
  // picker, while reopening lets shoppers replace an exact-one choice.
  makeSlotCardKeyboardAccessible(stepBox, () => this.openModal(stepIndex));

  return stepBox;
},

/**
 * Creates a slot card for a default/compulsory product step.
 * Looks like a filled card but has no remove button and shows an "Included" badge.
 */
createDefaultProductCard(step, stepIndex, product) {
  const stepBox = document.createElement('div');
  stepBox.className = 'step-box bw-slot-card bw-slot-card--filled';
  stepBox.dataset.stepIndex = stepIndex;
  stepBox.dataset.variantId = step.defaultVariantId || '';
  // Default cards are not clickable
  stepBox.style.cursor = 'default';

  // Product image
  const imageWrapper = document.createElement('div');
  imageWrapper.className = 'bw-slot-card__image-wrapper';
  const img = document.createElement('img');
  img.src = product.imageUrl || BUNDLE_WIDGET.PLACEHOLDER_IMAGE;
  img.alt = product.title || '';
  img.className = 'bw-slot-card__image';
  imageWrapper.appendChild(img);
  stepBox.appendChild(imageWrapper);

  // Product title
  const productTitle = document.createElement('p');
  productTitle.className = 'step-name bw-slot-card__label';
  const displayTitle = product.title.length > 25
    ? product.title.substring(0, 25) + '...'
    : product.title;
  productTitle.textContent = displayTitle;
  productTitle.title = product.title;
  stepBox.appendChild(productTitle);

  // "Included" badge — bottom-left
  const badge = document.createElement('span');
  badge.className = 'bw-slot-card__included-badge';
  badge.innerHTML = `<svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg> Included`;
  stepBox.appendChild(badge);

  return stepBox;
},

/**
 * Placeholder card for a default step while its product data is still loading.
 */
_createDefaultLoadingCard(step, stepIndex) {
  const stepBox = document.createElement('div');
  stepBox.className = 'step-box bw-slot-card bw-slot-card--filled';
  stepBox.dataset.stepIndex = stepIndex;
  stepBox.style.cursor = 'default';
  stepBox.style.opacity = '0.7';

  const label = document.createElement('p');
  label.className = 'step-name bw-slot-card__label';
  label.textContent = step.name || `Step ${stepIndex + 1}`;
  stepBox.appendChild(label);

  const badge = document.createElement('span');
  badge.className = 'bw-slot-card__included-badge';
  badge.textContent = 'Included';
  stepBox.appendChild(badge);

  return stepBox;
},

/**
 * Creates the free gift slot card.
 * Shows a ribbon icon, "Free {name}" label.
 * Non-clickable (locked) until all paid steps are complete.
 */
createFreeGiftSlotCard(step, stepIndex) {
  const unlocked = this.isFreeGiftUnlocked;
  const stepBox = document.createElement('div');
  stepBox.dataset.stepIndex = stepIndex;

  // Check if free gift step already has a selection
  const stepSelections = this.selectedProducts[stepIndex] || {};
  const selectedEntries = Object.entries(stepSelections).filter(([, qty]) => qty > 0);

  if (selectedEntries.length > 0 && unlocked) {
    // Show selected product for free gift slot
    const products = this.stepProductData[stepIndex] || [];
    const [variantId] = selectedEntries[0];
    const product = this.findProductBySelectionKey(products, variantId);
    if (product) {
      // Show filled state for free gift
      stepBox.className = 'step-box step-completed product-card-state bw-slot-card bw-slot-card--filled';

      const imageWrapper = document.createElement('div');
      imageWrapper.className = 'bw-slot-card__image-wrapper';
      const img = document.createElement('img');
      img.src = product.imageUrl || BUNDLE_WIDGET.PLACEHOLDER_IMAGE;
      img.alt = product.title || '';
      img.className = 'bw-slot-card__image';
      imageWrapper.appendChild(img);
      stepBox.appendChild(imageWrapper);

      // Remove button
      const clearBadge = document.createElement('button');
      clearBadge.type = 'button';
      clearBadge.className = 'step-clear-badge';
      clearBadge.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="12" fill="#f3f4f6"/><path d="M8 8L16 16M16 8L8 16" stroke="#000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
      clearBadge.title = 'Remove this product';
      clearBadge.setAttribute('aria-label', clearBadge.title);
      clearBadge.addEventListener('click', (e) => {
        e.stopPropagation();
        this.removeProductFromSelection(stepIndex, variantId);
      });
      stepBox.appendChild(clearBadge);

      const productTitle = document.createElement('p');
      productTitle.className = 'step-name step-name-completed product-title-state';
      const displayTitle = resolveSelectedSlotTitle(
        product.title,
        this._usesVerticalModalSlotLayout?.() === true,
      );
      productTitle.textContent = displayTitle;
      stepBox.appendChild(productTitle);

      // Ribbon overlay even in filled state
      stepBox.appendChild(this._createRibbonSvg());
      makeSlotCardKeyboardAccessible(stepBox, () => this.openModal(stepIndex));
      return stepBox;
    }
  }

  // Empty / locked state
  stepBox.className = `step-box bw-slot-card bw-slot-card--empty${!unlocked ? ' bw-slot-card--locked' : ''}`;

  const iconWrapper = document.createElement('div');
  iconWrapper.className = 'bw-slot-card__plus-icon';
  const primaryColorBS = getComputedStyle(document.documentElement)
    .getPropertyValue('--bundle-global-primary-button').trim() || '#1e3a8a';
  iconWrapper.style.cssText = `
    width: 80px;
    height: 80px;
    border-radius: 50%;
    background: color-mix(in srgb, ${primaryColorBS} 8%, transparent);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 10px;
  `;
  this._appendSlotIcon(iconWrapper);
  iconWrapper.style.color = primaryColorBS;
  stepBox.appendChild(iconWrapper);

  const label = document.createElement('p');
  label.className = 'step-name bw-slot-card__label';
  label.textContent = step.addonLabel || `Free ${step.name || `Step ${stepIndex + 1}`}`;
  stepBox.appendChild(label);

  // Red ribbon SVG overlay — top-right (free gift differentiator in all modes)
  stepBox.appendChild(this._createRibbonSvg());

  if (unlocked) {
    makeSlotCardKeyboardAccessible(stepBox, () => this.openModal(stepIndex));
  }

  return stepBox;
},

/** Returns the red ribbon SVG element for free gift cards */
_createRibbonSvg() {
  const ribbon = document.createElement('span');
  ribbon.className = 'bw-slot-card__ribbon';
  // Check for a merchant-configured badge image via Settings design CSS variable
  const badgeUrl = getComputedStyle(document.documentElement)
    .getPropertyValue('--bundle-free-gift-badge-url').trim();
  const hasMerchantBadge = badgeUrl && badgeUrl !== 'none' && badgeUrl !== '';
  if (hasMerchantBadge) {
    // Strip the url("...") wrapper to get the raw URL
    const rawUrl = badgeUrl.replace(/^url\(["']?/, '').replace(/["']?\)$/, '');
    const img = document.createElement('img');
    img.src = rawUrl;
    img.alt = 'Gift badge';
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.objectFit = 'contain';
    img.style.display = 'block';
    ribbon.appendChild(img);
  } else {
    ribbon.innerHTML = `<svg viewBox="0 0 24 24" fill="#e53e3e" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M20 7h-1.586l1.293-1.293a1 1 0 0 0-1.414-1.414L16 6.586V5a1 1 0 0 0-2 0v1.586l-1.293-1.293a1 1 0 0 0-1.414 1.414L12.586 8H11a1 1 0 1 0 0 2h1v2h-2a1 1 0 1 0 0 2h2v7l3-1.5 3 1.5V14h2a1 1 0 1 0 0-2h-2v-2h2a1 1 0 1 0 0-2zm-4 2v2h-2V9h2z"/>
    </svg>`;
  }
  return ribbon;
},

// Remove a specific product from selection (decrease quantity by 1)
removeProductFromSelection(stepIndex, variantId) {
  // Guard: default products are compulsory — they must always stay in selectedProducts
  const step = this.selectedBundle?.steps[stepIndex];
  const normalizedVariantId = this.normalizeSelectionKey(variantId);
  if (!normalizedVariantId) return;

  if (step?.isDefault && this.normalizeSelectionKey(step.defaultVariantId) === normalizedVariantId) return;
  if (this._isDirectDefaultVariant(normalizedVariantId)) return;

  const currentQuantity = this.getSelectedQuantity(stepIndex, normalizedVariantId);

  if (currentQuantity > 1) {
    // Decrease quantity
    this.setSelectedQuantity(stepIndex, normalizedVariantId, currentQuantity - 1);
  } else {
    // Remove completely
    this.setSelectedQuantity(stepIndex, normalizedVariantId, 0);
  }

  // Update UI
  this.renderSteps();
  this._renderDirectDefaultProducts();
  this.updateAddToCartButton();
  this.updateFooterMessaging();

  // Show toast notification
  ToastManager.show('Product removed from bundle');
}

// Full-page bundle layout (horizontal tabs)
};
