import {
  ComponentGenerator,
  CurrencyManager,
  PricingCalculator,
  TemplateManager,
  ToastManager,
} from '../../../bundle-widget-components.js';
import { renderSelectedProductRow } from '../../shared/components/selected-product-row.js';
import { getSelectedProductEntries } from '../../shared/engine/bundle-selectors.js';
import { resolveProductPageTemplateConfig } from './registry.js';

export function getCascadeSelectedDrawerState(selectedEntries = [], isOpen = false) {
  const entries = Array.isArray(selectedEntries) ? selectedEntries : [];
  const selectedQuantity = entries.reduce((sum, entry) => sum + Math.max(0, Number(entry?.quantity || 0)), 0);
  const hasSelectedProducts = selectedQuantity > 0;

  return {
    isOpen: Boolean(isOpen && hasSelectedProducts),
    selectedQuantity,
    hasSelectedProducts,
  };
}

export function getNextCascadeSelectedDrawerExpandedState({
  hasSelectedProducts = false,
  isExpanded = false,
  onEmpty = null,
} = {}) {
  if (!hasSelectedProducts) {
    if (typeof onEmpty === 'function') onEmpty();
    return false;
  }
  return !isExpanded;
}

export function getCascadeSelectedDrawerHeight({
  list = null,
  drawer = null,
  viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 0,
} = {}) {
  if (!list) return 0;

  const borderTopWidth = drawer && typeof getComputedStyle === 'function'
    ? Number.parseFloat(getComputedStyle(drawer).borderTopWidth || '0')
    : 0;
  const borderOffset = Number.isFinite(borderTopWidth) ? borderTopWidth : 0;
  const listStyle = typeof getComputedStyle === 'function' ? getComputedStyle(list) : {};
  const selectedRows = typeof list.querySelectorAll === 'function'
    ? Array.from(list.querySelectorAll('.bw-ppb-cascade-selected-item, .gbbMixCascadeBundleCartItem'))
    : [];
  const title = typeof list.querySelector === 'function'
    ? list.querySelector('.bw-ppb-cascade-selected-list-title, .gbbMixCascadeCartSectionHeading')
    : null;
  const rowGap = Number.parseFloat(listStyle.rowGap || listStyle.gap || '0');
  const paddingTop = Number.parseFloat(listStyle.paddingTop || '0');
  const visibleRowsLimit = 3;
  let visibleRowsHeight = Number.POSITIVE_INFINITY;

  if (selectedRows.length >= visibleRowsLimit && title) {
    const visibleRows = selectedRows.slice(0, visibleRowsLimit);
    const titleHeight = title.getBoundingClientRect?.().height || 0;
    const rowHeights = visibleRows.reduce((sum, row) => (
      sum + (row.getBoundingClientRect?.().height || 0)
    ), 0);
    const gap = Number.isFinite(rowGap) ? rowGap : 0;
    const top = Number.isFinite(paddingTop) ? paddingTop : 0;
    visibleRowsHeight = top
      + titleHeight
      + gap
      + rowHeights
      + (gap * Math.max(0, visibleRows.length - 1))
      + borderOffset;
  }

  const viewportLimit = Math.round(Number(viewportHeight || 0) * 0.6) || Number.POSITIVE_INFINITY;

  return Math.min(list.scrollHeight + borderOffset, visibleRowsHeight, viewportLimit, 420);
}

export function prepareCascadeSelectedProductDisplay({
  product = {},
  variantId = '',
  quantity = 1,
  formatPrice = null,
} = {}) {
  const normalizedQuantity = Math.max(1, Number(quantity || 1));
  const title = product.title || product.parentTitle || '';
  const variantTitle = normalizeSelectedRowVariantTitle(product, title);
  const amount = Number(product.price);
  const priceText = product.priceText || (
    Number.isFinite(amount) && typeof formatPrice === 'function'
      ? formatPrice(amount)
      : ''
  );

  return {
    ...product,
    variantId,
    quantity: normalizedQuantity,
    title: `${title} x ${normalizedQuantity}`,
    variantTitle,
    priceText,
    quantityLabel: `x ${normalizedQuantity}`,
  };
}

function normalizeSelectedRowVariantTitle(product, title) {
  const variantTitle = product.variantTitle && product.variantTitle !== 'Default Title'
    ? String(product.variantTitle).trim()
    : '';
  if (!variantTitle) return '';

  const normalizedTitle = String(title || '').trim();
  if (normalizedTitle.endsWith(` - ${variantTitle}`)) return '';

  return variantTitle;
}

export function shouldMountCascadeAddToCartInFooter(addToCartButton, footerElement) {
  return Boolean(addToCartButton && footerElement && addToCartButton.parentElement !== footerElement);
}

function formatCascadeDiscountPercentage(value) {
  const percentage = Number(value || 0);
  if (!Number.isFinite(percentage) || percentage <= 0) return '';

  return Number.isInteger(percentage)
    ? String(percentage)
    : String(Number(percentage.toFixed(2)));
}

export function getCascadeAddToCartButtonContent({
  label = '',
  finalPriceText = '',
  totalPriceText = '',
  discountAmountText = '',
  discountInfo = null,
} = {}) {
  const hasDiscount = Boolean(discountInfo?.hasDiscount);
  const discountMethod = discountInfo?.discountMethod || '';
  const appliedRuleValue = Number(discountInfo?.applicableRule?.discountValue || 0);
  const discountPercentage = appliedRuleValue || Number(discountInfo?.discountPercentage || 0);
  let discountPillText = '';

  if (hasDiscount && discountMethod === 'percentage_off') {
    const percentText = formatCascadeDiscountPercentage(discountPercentage);
    discountPillText = percentText ? `${percentText}% off` : '';
  } else if (hasDiscount && discountAmountText) {
    discountPillText = `${discountAmountText} off`;
  }

  return {
    label,
    separator: '\u2022',
    finalPriceText,
    compareAtPriceText: hasDiscount ? totalPriceText : '',
    discountPillText,
  };
}

export const cascadeTemplateMethods = {
  _isProductPageCascadeTemplate() {
    const config = resolveProductPageTemplateConfig({
      templateType: this._getProductPageTemplateType(),
      designPreset: this._getProductPageDesignPreset(),
      renderFilledSlotsAsHorizontalStacked: this.selectedBundle?.renderFilledSlotsAsHorizontalStacked,
    });

    return config?.id === 'LIST';
  },

  _getCascadeAddToCartButtonContent(options = {}) {
    return getCascadeAddToCartButtonContent(options);
  },

  _renderCascadeAddToCartButtonContent(button, content = {}) {
    if (!button) return;
    button.textContent = '';

    const appendPart = (tagName, className, text, { hidden = false } = {}) => {
      if (!text) return null;
      const part = document.createElement(tagName);
      part.className = className;
      part.textContent = text;
      if (hidden) {
        part.hidden = true;
        part.setAttribute('aria-hidden', 'true');
      }
      button.appendChild(part);
      return part;
    };

    appendPart('span', 'bw-ppb-cascade-add-to-cart-label', content.label);
    appendPart('span', 'bw-ppb-cascade-add-to-cart-separator', content.separator);
    appendPart('span', 'bw-ppb-cascade-add-to-cart-price', content.finalPriceText);
    appendPart('span', 'bw-ppb-cascade-add-to-cart-compare', content.compareAtPriceText, { hidden: true });
    appendPart('span', 'bw-ppb-cascade-add-to-cart-discount-pill', content.discountPillText);
  },

  _getSelectedProductEntries() {
    return getSelectedProductEntries({
      selectedProducts: this.selectedProducts,
      stepProductData: this.stepProductData,
    }, {
      expandProductsByStep: (products) => this.expandProductsByVariant(products || []),
      normalizeSelectionKey: (value) => this.normalizeSelectionKey(value),
    });
  },

  _getCascadeFooterMessage() {
    const displayOptions = this.selectedBundle?.messaging?.displayOptions;
    const pbConfig = displayOptions?.progressBar;
    const rules = this.selectedBundle?.pricing?.rules || [];

    if (rules.length === 0 || !this.selectedBundle?.pricing?.enabled) return '';

    const { totalQuantity, totalPrice, unitPrices } = PricingCalculator.calculateBundleTotal(
      this.selectedProducts,
      this.stepProductData,
      this.selectedBundle?.steps
    );
    const discountInfo = PricingCalculator.calculateDiscount(this.selectedBundle, totalPrice, totalQuantity, unitPrices);
    const combinedDiscountInfo = this.getDiscountInfoWithSelectedAddonDiscount(discountInfo, totalPrice);
    const nextRule = PricingCalculator.getNextDiscountRule?.(this.selectedBundle, totalQuantity, totalPrice) || null;
    const messageType = nextRule ? 'progress' : 'success';
    const fallbackTemplate = messageType === 'success'
      ? (pbConfig?.successText || this.selectedBundle.messaging?.successTemplate || 'You got {discountText}!')
      : (pbConfig?.progressText || this.selectedBundle.messaging?.progressTemplate || 'Add {conditionText} more to get {discountText}');
    const currencyInfo = CurrencyManager.getCurrencyInfo();
    const variables = TemplateManager.createDiscountVariables(
      this.selectedBundle,
      totalPrice,
      totalQuantity,
      combinedDiscountInfo,
      currencyInfo,
      { messageType }
    );
    const template = TemplateManager.getDiscountMessageTemplate({
      bundle: this.selectedBundle,
      totalQuantity,
      totalPrice,
      discountInfo: combinedDiscountInfo,
      messageType,
      fallbackTemplate,
      locale: window.Shopify?.locale,
    });

    return TemplateManager.replaceVariables(template, variables);
  },

  _renderCascadeFooter(el) {
    el.className = 'bundle-footer-messaging bw-ppb-cascade-footer wpbMixCascadeFooterWrapper wpbMixCascadeFooterWrapper--bundleATCBtnV2 wpbMixCascadeFooterWrapper--cartDrawerUI';
    el.style.display = '';
    el.style.cssText = '';

    const selectedEntries = this._getSelectedProductEntries();
    const { totalQuantity, totalPrice, unitPrices } = PricingCalculator.calculateBundleTotal(
      this.selectedProducts,
      this.stepProductData,
      this.selectedBundle?.steps
    );
    if (!this.cascadeSelectedDrawerState) {
      this.cascadeSelectedDrawerState = { isOpen: false };
    }
    const drawerState = getCascadeSelectedDrawerState(
      selectedEntries,
      this.cascadeSelectedDrawerState.isOpen,
    );
    const drawer = document.createElement('div');
    drawer.className = `bw-ppb-cascade-selected-drawer wpbMixCascadeCartDrawerContainer${drawerState.isOpen ? ' bw-ppb-cascade-selected-drawer--open gbbMixCascadeCartDrawerContainer--open' : ''}`;

    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'bw-ppb-cascade-selected-toggle wpbMixCascadeSelectedItemsInCartWrappper';
    toggle.setAttribute('aria-expanded', drawerState.isOpen ? 'true' : 'false');
    toggle.innerHTML = `
      <span class="bw-ppb-cascade-selected-toggle-chevron gbbMixCascadeCartChevronIcon" aria-hidden="true"></span>
      <span class="bw-ppb-cascade-selected-toggle-label wpbMixCascadeCartDrawerBtnText">${ComponentGenerator.escapeHtml(this._resolveText('viewBundleItems', 'View Bundle Items'))}</span>
      <span class="bw-ppb-cascade-selected-toggle-count wpbMixCascadeSelectedItemsInCart">${drawerState.selectedQuantity}</span>
    `;
    drawer.appendChild(toggle);

    let list = null;
    if (drawerState.hasSelectedProducts) {
      list = document.createElement('div');
      list.className = 'bw-ppb-cascade-selected-list wpbMixCascadeCartItemsWrapper';

      const title = document.createElement('div');
      title.className = 'bw-ppb-cascade-selected-list-title gbbMixCascadeCartSectionHeading wpbMixCascadeCartItemsTitle';
      title.dataset.sectionId = 'selectedProducts';
      title.innerHTML = `
        <span class="bw-ppb-cascade-selected-list-title-text gbbMixCascadeCartSectionHeadingTitle">${ComponentGenerator.escapeHtml(this._resolveText('bundleCartSelectedProductsText', 'Selected Products'))}</span>
        <span class="bw-ppb-cascade-selected-list-title-line gbbMixCascadeCartSectionHeadingLine" aria-hidden="true"></span>
      `;
      list.appendChild(title);

      selectedEntries.forEach(({ stepIndex, variantId, quantity, product }) => {
        const item = document.createElement('div');
        item.innerHTML = renderSelectedProductRow(prepareCascadeSelectedProductDisplay({
          product,
          variantId,
          quantity,
          formatPrice: (amount) => CurrencyManager.convertAndFormat(amount, CurrencyManager.getCurrencyInfo()),
        }), {
          className: 'bw-ppb-cascade-selected-item wpbMixCascadeBundleCartItem',
        }).trim();
        const row = item.firstElementChild;
        row?.querySelector('[data-action="remove-selected-product"]')?.addEventListener('click', () => {
          this.removeProductFromSelection(stepIndex, variantId);
        });
        if (row) list.appendChild(row);
      });
      drawer.appendChild(list);
    }

    const setDrawerExpanded = (isExpanded) => {
      const nextExpanded = Boolean(isExpanded && drawerState.hasSelectedProducts);
      let maxDrawerHeight = 0;
      drawer.classList.toggle('bw-ppb-cascade-selected-drawer--open', nextExpanded);
      drawer.classList.toggle('gbbMixCascadeCartDrawerContainer--open', nextExpanded);
      if (list && nextExpanded) {
        maxDrawerHeight = getCascadeSelectedDrawerHeight({ list, drawer });
        drawer.style.setProperty('--bw-ppb-cascade-selected-drawer-height', `${maxDrawerHeight}px`);
      }
      toggle.setAttribute('aria-expanded', nextExpanded ? 'true' : 'false');
      this.cascadeSelectedDrawerState.isOpen = nextExpanded;
      this.cascadeSelectedDrawerState.height = nextExpanded ? maxDrawerHeight : 0;
    };
    toggle.addEventListener('click', () => {
      setDrawerExpanded(getNextCascadeSelectedDrawerExpandedState({
        hasSelectedProducts: drawerState.hasSelectedProducts,
        isExpanded: drawer.classList.contains('bw-ppb-cascade-selected-drawer--open'),
        onEmpty: () => ToastManager.show('Add items to your bundle first'),
      }));
    });

    el.appendChild(drawer);
    const previousDrawerHeight = Math.max(0, Number(this.cascadeSelectedDrawerState.height || 0));
    if (drawerState.isOpen && previousDrawerHeight > 0) {
      drawer.style.setProperty('--bw-ppb-cascade-selected-drawer-height', `${previousDrawerHeight}px`);
      const scheduleFrame = typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function'
        ? window.requestAnimationFrame.bind(window)
        : (callback) => callback();
      scheduleFrame(() => setDrawerExpanded(true));
    } else {
      setDrawerExpanded(drawerState.isOpen);
    }

    const message = this._getCascadeFooterMessage();
    if (message) {
      const messageEl = document.createElement('p');
      messageEl.className = 'bw-ppb-cascade-discount-message';
      messageEl.textContent = message;
      el.appendChild(messageEl);
    }

    const addToCartButton = this.elements?.addToCartButton;
    if (shouldMountCascadeAddToCartInFooter(addToCartButton, el)) {
      el.appendChild(addToCartButton);
    }
  },
};
